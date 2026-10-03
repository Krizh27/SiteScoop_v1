import { z } from 'zod';
import { listProjects, getProjectInfo, getRecoveryReport } from '../services/workspace/workspace.service.js';
import { getFileTree } from '../services/workspace/file-tree.service.js';
import { readFileContent, serveAssetStream, searchWorkspace } from '../services/workspace/file-reader.service.js';
import path from 'path';

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
