import { z } from 'zod';
import { listProjects, getProjectInfo, getRecoveryReport } from '../services/workspace/workspace.service.js';
import { getFileTree } from '../services/workspace/file-tree.service.js';
import { readFileContent, serveAssetStream, searchWorkspace } from '../services/workspace/file-reader.service.js';
import { resolveWorkspacePath } from '../utils/workspace-path.js';
import path from 'path';
import fs from 'fs/promises';

const getWorkspaceDir = () => process.env.WORKSPACE_DIR 
  ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
  : path.resolve(process.cwd(), '../workspace');

export const getProjects = async (req, res) => {
  try {
    const projects = await listProjects(getWorkspaceDir());
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await getProjectInfo(getWorkspaceDir(), req.params.projectId);
    res.json({ success: true, project });
  } catch (error) {
    res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'The requested project does not exist.' } });
  }
};

export const getTree = async (req, res) => {
  try {
    const tree = await getFileTree(getWorkspaceDir(), req.params.projectId);
    res.json({ success: true, tree });
  } catch (error) {
    res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } });
  }
};

export const getFile = async (req, res) => {
  try {
    const filePath = z.string().parse(req.query.path);
    const file = await readFileContent(getWorkspaceDir(), req.params.projectId, filePath);
    res.json({ success: true, file });
  } catch (error) {
    if (error.message === 'FILE_TOO_LARGE') {
      res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum read size.' } });
    } else {
      res.status(400).json({ success: false, error: { code: 'FILE_READ_ERROR', message: error.message } });
    }
  }
};

export const getAsset = (req, res) => {
  try {
    const filePath = z.string().parse(req.query.path);
    const absolutePath = serveAssetStream(getWorkspaceDir(), req.params.projectId, filePath);
    res.sendFile(absolutePath);
  } catch (error) {
    res.status(404).json({ success: false, error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found or path invalid.' } });
  }
};

export const searchProject = async (req, res) => {
  try {
    const query = z.string().parse(req.query.q);
    if (!query) throw new Error('Empty query');
    const results = await searchWorkspace(getWorkspaceDir(), req.params.projectId, query);
    res.json({ success: true, query, results });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'SEARCH_FAILED', message: error.message } });
  }
};

export const getReport = async (req, res) => {
  try {
    const report = await getRecoveryReport(getWorkspaceDir(), req.params.projectId);
    res.json({ success: true, report });
  } catch (error) {
    res.status(404).json({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
  }
};

/**
 * GET /api/workspace/projects/:projectId/preview
 * GET /api/workspace/projects/:projectId/preview/*
 * Safely serves frontend files for live preview within an iframe.
 */
export const previewProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    let subpath = req.params[0] || req.query.path || '';

    // If subpath is empty or ends with a slash, serve index.html
    if (!subpath || subpath.endsWith('/')) {
      subpath = path.posix.join(subpath, 'index.html');
    }

    // Resolve path securely within project boundaries
    let filePath;
    try {
      filePath = resolveWorkspacePath(getWorkspaceDir(), projectId, subpath);
    } catch (err) {
      return res.status(403).send('Forbidden: Path traversal or invalid project path.');
    }

    // Check if target file exists and is a regular file
    let stat;
    try {
      stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        stat = await fs.stat(filePath);
      }
    } catch {
      return res.status(404).send(`Resource "${subpath}" not found in project "${projectId}".`);
    }

    // Set permissive frame headers for local preview iframe embedding
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:*");
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).send(`Preview error: ${error.message}`);
  }
};

