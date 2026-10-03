/**
 * SiteScoop AI API Client Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch system health status from the backend.
 * @returns {Promise<{success: boolean, app: string, status: string}>}
 */
export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch health check:', error);
    throw error;
  }
}

/**
 * Trigger website extraction on the backend.
 * @param {string} url - Target website URL
 * @returns {Promise<object>} Extraction result with projectId, metadata, and asset counts
 */
export async function extractWebsite(url) {
  try {
    const response = await fetch(`${API_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to extract website:', error);
    throw error;
  }
}
