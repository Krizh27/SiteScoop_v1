import { generateResponse } from '../services/aiService.js';

export const testAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" is required and must be a string.'
      });
    }

    const result = await generateResponse(message);

    return res.json({
      success: true,
      response: result.content,
      model: result.model,
      usage: result.usage
    });
  } catch (error) {
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.message.includes('AI service configuration is incomplete')) {
       errorMessage = 'AI service configuration is incomplete.';
    } else if (error.message.includes('Failed to generate AI response')) {
       errorMessage = 'Failed to communicate with AI service.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};
