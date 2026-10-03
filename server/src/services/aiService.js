import { GoogleGenAI } from '@google/genai';

export const generateResponse = async (input, options = {}) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';

  if (!apiKey) {
    throw new Error('AI service configuration is incomplete: Missing GOOGLE_API_KEY');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: input,
      config: options
    });

    return {
      success: true,
      content: response.text,
      model: model,
      usage: response.usageMetadata || {}
    };
  } catch (error) {
    console.error('\n--- Google AI Studio Error Diagnostics ---');
    console.error(`Selected Model: ${model}`);
    console.error(`Error Type: ${error.name || 'N/A'}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`HTTP Status Code: ${error.status || 'N/A'}`);
    if (error.errorDetails) {
        console.error(`Detailed Error Body: ${JSON.stringify(error.errorDetails)}`);
    }
    console.error('------------------------------------\n');
    throw new Error('Failed to generate AI response: ' + error.message);
  }
};

export const generateWithTools = async ({ messages, tools, sysInstruction }) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const modelName = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';

  if (!apiKey) {
    throw new Error('AI service configuration is incomplete: Missing GOOGLE_API_KEY');
  }

  const ai = new GoogleGenAI({ apiKey });

  const functionDeclarations = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));

  const config = {
    tools: [{ functionDeclarations }],
    temperature: 0.2
  };
  
  if (sysInstruction) {
    config.systemInstruction = sysInstruction;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: messages,
      config
    });

    const functionCalls = response.functionCalls || [];
    if (functionCalls.length > 0) {
      return {
        type: 'tool_call',
        toolCalls: functionCalls.map(fc => ({
          name: fc.name,
          args: fc.args
        })),
        usage: response.usageMetadata || {}
      };
    }

    return {
      type: 'final',
      content: response.text,
      usage: response.usageMetadata || {}
    };
  } catch (error) {
    console.error('\n--- Google AI Studio Error Diagnostics ---');
    console.error(`Selected Model: ${modelName}`);
    console.error(`Error Type: ${error.name || 'N/A'}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`HTTP Status Code: ${error.status || 'N/A'}`);
    if (error.errorDetails) {
        console.error(`Detailed Error Body: ${JSON.stringify(error.errorDetails)}`);
    }
    console.error('------------------------------------\n');
    throw new Error('Failed to generate AI response: ' + error.message);
  }
};
