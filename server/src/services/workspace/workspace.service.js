import fs from 'fs/promises';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';
import path from 'path';

export const listProjects = async (workspaceDir) => {
  try {
    const entries = await fs.readdir(workspaceDir, { withFileTypes: true });
    
    const projects = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('recovery-')) {
        const projectId = entry.name;
        
        try {
          const reportPath = resolveWorkspacePath(workspaceDir, projectId, 'recovery.json');
          const content = await fs.readFile(reportPath, 'utf-8');
          const report = JSON.parse(content);
          
          let fileCount = 0;
          if (report.files) {
            fileCount = Object.values(report.files).reduce((a, b) => a + b, 0);
          }
          
          projects.push({
            projectId,
            sourceUrl: report.sourceUrl,
            createdAt: report.timestamp,
            fileCount
          });
        } catch (e) {
          // Ignore projects without a valid recovery.json
        }
      }
    }
    
    // Sort descending by timestamp
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return projects;
  } catch (error) {
    return [];
  }
};

export const getProjectInfo = async (workspaceDir, projectId) => {
  const reportPath = resolveWorkspacePath(workspaceDir, projectId, 'recovery.json');
  const content = await fs.readFile(reportPath, 'utf-8');
  const report = JSON.parse(content);
  
  let fileCount = 0;
  if (report.files) {
    fileCount = Object.values(report.files).reduce((a, b) => a + b, 0);
  }

  return {
    projectId,
    sourceUrl: report.sourceUrl,
    createdAt: report.timestamp,
    fileCount
  };
};

export const getRecoveryReport = async (workspaceDir, projectId) => {
  const reportPath = resolveWorkspacePath(workspaceDir, projectId, 'recovery.json');
  const content = await fs.readFile(reportPath, 'utf-8');
  return JSON.parse(content);
};
