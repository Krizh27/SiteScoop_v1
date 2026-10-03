import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { sanitizeFilename } from '../utils/fileUtils.js';
import { logger } from '../utils/logger.js';

let previewServerInstance = null;
let activeProjectId = null;
const PREVIEW_PORT = parseInt(process.env.PREVIEW_PORT, 10) || 5050;

/**
 * Locate project directory in workspace
 */
async function getProjectDir(projectId) {
  const cleanId = sanitizeFilename(projectId);
  const workspaceRoot = process.env.WORKSPACE_DIR
    ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
    : path.resolve(process.cwd(), '../workspace');

  const projectDir = path.join(workspaceRoot, 'projects', cleanId);
  try {
    const stat = await fs.stat(projectDir);
    if (stat.isDirectory()) return { projectDir, projectId: cleanId };
  } catch {}

  const stagingDir = path.join(workspaceRoot, '.staging', cleanId);
  try {
    const stat = await fs.stat(stagingDir);
    if (stat.isDirectory()) return { projectDir: stagingDir, projectId: cleanId };
  } catch {}

  return null;
}

/**
 * Set active project for root / preview
 */
export function setActiveProject(projectId) {
  if (projectId) {
    activeProjectId = sanitizeFilename(projectId);
  }
}

/**
 * Get preview URL for a project
 */
export function getPreviewUrl(projectId) {
  const cleanId = projectId ? sanitizeFilename(projectId) : activeProjectId;
  if (!cleanId) {
    return `http://localhost:${PREVIEW_PORT}`;
  }
  return `http://localhost:${PREVIEW_PORT}/projects/${cleanId}/`;
}

/**
 * Start dedicated HTTP Live Preview server on port 5050
 */
export function startPreviewServer() {
  if (previewServerInstance) {
    return previewServerInstance;
  }

  const previewApp = express();

  // Allow iframe embedding and cross-origin resource access
  previewApp.use(cors({ origin: '*' }));
  previewApp.use((req, res, next) => {
    // Disable aggressive browser caching for live development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Allow embedding in iframe from localhost:5173
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:*");
    next();
  });

  // Serve static files for specific project
  previewApp.use('/projects/:projectId', async (req, res, next) => {
    const found = await getProjectDir(req.params.projectId);
    if (!found) {
      return res.status(404).send(`<h3>Project "${req.params.projectId}" not found in workspace.</h3>`);
    }
    setActiveProject(found.projectId);

    // If accessed as /projects/:projectId without trailing slash, redirect with slash so relative links work
    const urlBeforeQuery = req.originalUrl.split('?')[0];
    if (!urlBeforeQuery.endsWith('/')) {
      const queryString = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
      return res.redirect(301, urlBeforeQuery + '/' + queryString);
    }

    express.static(found.projectDir, {
      index: ['index.html', 'index.htm'],
      dotfiles: 'deny'
    })(req, res, next);
  });


  // Serve root / by serving the active project
  previewApp.use('/', async (req, res, next) => {
    if (!activeProjectId) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>SiteScoop AI — Live Preview Server</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #94a3b8;">
          <h2 style="color: #f8fafc;">SiteScoop AI — Live Preview Server (Port ${PREVIEW_PORT})</h2>
          <p>No active project selected. Extract a website or run Gemma in the dashboard to preview live changes.</p>
        </body>
        </html>
      `);
    }

    const found = await getProjectDir(activeProjectId);
    if (!found) {
      return res.status(404).send(`<h3>Active project "${activeProjectId}" not found.</h3>`);
    }

    express.static(found.projectDir, {
      index: ['index.html', 'index.htm'],
      dotfiles: 'deny'
    })(req, res, next);
  });

  try {
    previewServerInstance = previewApp.listen(PREVIEW_PORT, () => {
      logger.info(`Live Project Preview Server listening on http://localhost:${PREVIEW_PORT}`);
    });

    previewServerInstance.on('error', (err) => {
      logger.warn(`Preview server error on port ${PREVIEW_PORT}: ${err.message}`);
    });
  } catch (err) {
    logger.warn(`Failed to bind preview server on port ${PREVIEW_PORT}: ${err.message}`);
  }

  return previewServerInstance;
}

export function stopPreviewServer() {
  if (previewServerInstance) {
    previewServerInstance.close();
    previewServerInstance = null;
  }
}
