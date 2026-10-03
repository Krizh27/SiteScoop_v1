const API_BASE_URL = 'http://localhost:5000/api';

export const getAgentTools = async () => {
  const response = await fetch(`${API_BASE_URL}/agent/tools`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch agent tools');
  return data.tools;
};

export const executeAgentTool = async (tool, input) => {
  const response = await fetch(`${API_BASE_URL}/agent/tools/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tool, input })
  });
  
  const data = await response.json();
  return data;
};

/**
 * Fetch current Agent subsystem status.
 */
export const getAgentStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/agent/status`);
  const data = await response.json();
  return data;
};

/**
 * Run the autonomous read-only agent for a given project and request.
 */
export const runAgent = async (projectId, request) => {
  const response = await fetch(`${API_BASE_URL}/agent/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ projectId, request })
  });

  const data = await response.json();
  return data;
};
