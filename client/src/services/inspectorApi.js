const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Trigger an AI project inspection with optional focus areas.
 */
export const runInspection = async (projectId, focus = []) => {
  const payload = { projectId };
  if (Array.isArray(focus) && focus.length > 0) {
    payload.focus = focus;
  }

  const response = await fetch(`${API_BASE_URL}/inspector/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
};

/**
 * Fetch the latest cached inspection report for a project.
 */
export const getInspectionReport = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/inspector/projects/${encodeURIComponent(projectId)}/report`);
  const data = await response.json();
  return data;
};
