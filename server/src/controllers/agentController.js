import { runAgentLoop } from '../agent/agentLoop.js';

export const runAgent = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" is required and must be a string.'
      });
    }

    const result = await runAgentLoop(message);

    return res.json({
      success: true,
      response: result.response,
      steps: result.steps
    });
  } catch (error) {
    console.error(`[AGENT CONTROLLER] Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during agent execution.'
    });
  }
};

export const analyzeSite = async (req, res) => {
  try {
    const { siteId, message } = req.body;

    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ success: false, error: 'siteId is required' });
    }

    const sysInstruction = `You are SiteScoop, a developer-focused website analysis agent.
Inspect the recovered website using the available tools.
Only make claims supported by evidence.
When possible cite file names and relevant lines.
Distinguish confirmed issues from suggestions.
Do not modify files.`;

    const userMessage = `Site ID: ${siteId}\nUser request: ${message || 'Analyze this website for bugs and improvements.'}`;

    const result = await runAgentLoop(userMessage, sysInstruction);

    return res.json({
      success: true,
      response: result.response,
      steps: result.steps
    });
  } catch (error) {
    console.error(`[AGENT CONTROLLER] Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const fixSite = async (req, res) => {
  try {
    const { siteId, message } = req.body;

    if (!siteId || typeof siteId !== 'string') {
      return res.status(400).json({ success: false, error: 'siteId is required' });
    }

    const sysInstruction = `You are SiteScoop, a developer-focused website fixing agent.
Inspect the recovered website using the available tools and apply fixes using write_site_file.
Only make changes that fix the user's issue or improve the code quality.
Ensure you do not break existing functionality.
Make sure to explain what you fixed.`;

    const userMessage = `Site ID: ${siteId}\nUser request: ${message || 'Fix the website based on your previous analysis.'}`;

    const result = await runAgentLoop(userMessage, sysInstruction);

    return res.json({
      success: true,
      response: result.response,
      steps: result.steps
    });
  } catch (error) {
    console.error(`[AGENT CONTROLLER] Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};
