import { generateWithTools } from '../services/aiService.js';
import { getAllTools, getTool } from '../tools/toolRegistry.js';

const MAX_AGENT_STEPS = 8;

export const runAgentLoop = async (userMessage, sysInstruction) => {
  const tools = getAllTools();
  
  const messages = [
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  let currentStep = 1;
  const stepsData = [];
  
  while (currentStep <= MAX_AGENT_STEPS) {
    console.log(`[AGENT] Step ${currentStep}`);
    
    let aiResult;
    try {
      aiResult = await generateWithTools({ messages, tools, sysInstruction });
    } catch (err) {
      console.error(`[AGENT] Model API error: ${err.message}`);
      throw new Error(`Model API error: ${err.message}`);
    }

    if (aiResult.type === 'tool_call') {
      const toolCalls = aiResult.toolCalls;
      
      const fc = toolCalls[0];
      console.log(`[AGENT] Model requested tool: ${fc.name}`);
      
      messages.push({
        role: 'model',
        parts: [{ functionCall: { name: fc.name, args: fc.args } }]
      });

      stepsData.push({
        step: currentStep,
        type: 'tool_call',
        toolName: fc.name,
        arguments: fc.args
      });

      console.log(`[AGENT] Executing tool: ${fc.name}`);
      
      let toolResult;
      const tool = getTool(fc.name);
      
      if (!tool) {
        console.log(`[AGENT] Unknown tool: ${fc.name}`);
        toolResult = { error: `Tool ${fc.name} does not exist.` };
      } else {
        try {
          toolResult = await tool.execute(fc.args);
          console.log(`[AGENT] Tool completed`);
        } catch (e) {
          console.log(`[AGENT] Tool execution error: ${e.message}`);
          toolResult = { error: `Tool execution failed: ${e.message}` };
        }
      }

      stepsData.push({
        step: currentStep,
        type: 'tool_result',
        toolName: fc.name,
        result: toolResult
      });

      messages.push({
        role: 'user',
        parts: [{ functionResponse: { name: fc.name, response: toolResult } }]
      });

      currentStep++;
    } else {
      console.log(`[AGENT] Final response received`);
      stepsData.push({
        step: currentStep,
        type: 'final_response',
        content: aiResult.content
      });
      return {
        success: true,
        response: aiResult.content,
        steps: stepsData
      };
    }
  }

  throw new Error(`Maximum agent steps (${MAX_AGENT_STEPS}) exceeded.`);
};
