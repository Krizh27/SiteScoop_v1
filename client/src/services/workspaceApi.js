const API_BASE_URL = 'http://localhost:5000/api';

export const getProjects = async () => {
  const response = await fetch(`${API_BASE_URL}/workspace/projects`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch projects');
  return data.projects;
};

export const getProjectInfo = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch project');
  return data.project;
};

export const getFileTree = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/tree`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch tree');
  return data.tree;
};

export const getFileContent = async (projectId, path) => {
  const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/file?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to read file');
  return data.file;
};

export const getAssetUrl = (projectId, path) => {
  return `${API_BASE_URL}/workspace/projects/${projectId}/asset?path=${encodeURIComponent(path)}`;
};

export const getRecoveryReport = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/workspace/projects/${projectId}/report`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch report');
  return data.report;
};
