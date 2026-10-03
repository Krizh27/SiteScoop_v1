const API_BASE_URL = 'http://localhost:5000/api';

export const recoverWebsite = async (url) => {
  const response = await fetch(`${API_BASE_URL}/recovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to recover website');
  }

  return data;
};
