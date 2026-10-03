const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch AI subsystem and Ollama connection status.
 */
export const getAIStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/ai/status`);
  const data = await response.json();
  return data;
};

/**
 * Send a test prompt to the local Gemma model via Express.
 * Returns normalized response structure or controlled error.
 */
export const testAI = async (prompt) => {
  const response = await fetch(`${API_BASE_URL}/ai/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  return data;
};
