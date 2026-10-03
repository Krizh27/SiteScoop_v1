import axios from 'axios';
import path from 'path';
import { createProject, saveFile } from './project.service.js';
import { parseHtml } from './html.service.js';
import { downloadAsset } from './asset.service.js';
import { logger } from '../../utils/logger.js';

export const recoverWebsite = async (sourceUrl, workspaceDir) => {
  logger.info(`Starting recovery for: ${sourceUrl}`);
  
  // 1. Fetch the page
  const response = await axios.get(sourceUrl, {
    timeout: 15000,
    maxContentLength: 5 * 1024 * 1024, // 5MB limit for HTML
    headers: {
      'User-Agent': 'SiteScoop-AI/1.0',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });

  const finalUrl = response.request.res.responseUrl || sourceUrl;
  const contentType = response.headers['content-type'] || '';
  
  if (!contentType.includes('text/html')) {
    throw new Error('URL did not return HTML content');
  }

  const htmlContent = response.data;

  // 2. Parse HTML and extract resources
  const { resources, getUpdatedHtml, updateReference } = parseHtml(htmlContent, finalUrl);
  
  // 3. Create project structure
  const { projectId, projectPath } = await createProject(workspaceDir);

  const report = {
    sourceUrl,
    finalUrl,
    timestamp: new Date().toISOString(),
    status: 'processing',
    files: { html: 1, css: 0, javascript: 0, images: 0, fonts: 0, other: 0 },
    resources: [],
    failedResources: [],
    limitations: []
  };

  // 4. Download resources and rewrite references
  const downloadPromises = resources.map(async (resource) => {
    try {
      const { content, localPath } = await downloadAsset(resource.resolved, resource.type);
      
      await saveFile(projectPath, localPath, content);
      updateReference(resource.element, resource.attr, localPath);
      
      report.resources.push({
        source: resource.resolved,
        localPath,
        type: resource.type,
        status: 'downloaded'
      });

      if (report.files[resource.type] !== undefined) {
        report.files[resource.type]++;
      } else {
        report.files.other++;
      }
    } catch (error) {
      logger.warn(`Failed to download asset: ${resource.resolved} - ${error.message}`);
      report.failedResources.push({
        source: resource.resolved,
        type: resource.type,
        error: error.message
      });
    }
  });

  await Promise.allSettled(downloadPromises);

  // 5. Save updated HTML and report
  const updatedHtml = getUpdatedHtml();
  await saveFile(projectPath, 'index.html', updatedHtml);

  report.status = 'completed';
  await saveFile(projectPath, 'recovery.json', JSON.stringify(report, null, 2));
  
  logger.info(`Recovery completed for ${sourceUrl}. Project ID: ${projectId}`);

  return {
    projectId,
    sourceUrl,
    finalUrl,
    projectPath,
    summary: report.files,
    failedResources: report.failedResources
  };
};
