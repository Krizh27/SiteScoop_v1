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

/**
 * Trigger local AI website analysis with Ollama.
 * @param {string} projectId - Project ID of extracted website
 * @param {string} question - User question/instruction
 * @returns {Promise<object>} AI analysis result
 */
export async function analyzeWebsite(projectId, question) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ projectId, question })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to analyze website with AI:', error);
    throw error;
  }
}

/**
 * Fetch project files list.
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function fetchProjectFiles(projectId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/files`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch project files:', error);
    throw error;
  }
}

/**
 * Fetch specific file content.
 * @param {string} projectId
 * @param {string} filePath
 * @returns {Promise<object>}
 */
export async function fetchFileContent(projectId, filePath) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(filePath)}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch file content:', error);
    throw error;
  }
}

/**
 * Save / update file content.
 * @param {string} projectId
 * @param {string} filePath
 * @param {string} content
 * @returns {Promise<object>}
 */
export async function saveFileContent(projectId, filePath, content) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ path: filePath, content })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to save file content:', error);
    throw error;
  }
}

/**
 * Run autonomous agent harness loop with Gemma to inspect/modify code using CRUD tools.
 * @param {string} projectId
 * @param {string} instruction
 * @returns {Promise<object>}
 */
export async function editProjectWithAgent(projectId, instruction) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ projectId, instruction })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to run agent edit:', error);
    throw error;
  }
}

/**
 * Get direct live preview URL for project on port 5050.
 * @param {string} projectId
 * @returns {string}
 */
export function getProjectPreviewUrl(projectId) {
  const previewPort = import.meta.env.VITE_PREVIEW_PORT || 5050;
  return `http://localhost:${previewPort}/projects/${encodeURIComponent(projectId)}/`;
}


