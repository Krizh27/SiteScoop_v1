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
