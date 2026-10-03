import { registry } from '../tools/tool-registry.js';
import { AgentPolicy } from '../agent-policy.js';

/**
 * Format permitted registry tools into a compact format for the agent prompt.
 */
export function formatToolDescriptions() {
  const allowed = AgentPolicy.getAllowedTools();
  const toolDefs = [];

  for (const name of allowed) {
    if (!registry.hasTool(name)) continue;
    const tool = registry.getTool(name);
    
    // Format input fields compactly
    let inputDesc = '{}';
    if (tool.inputSchema && tool.inputSchema.shape) {
      const fields = Object.keys(tool.inputSchema.shape).map(key => `"${key}": ...`);
      inputDesc = `{ ${fields.join(', ')} }`;
    }

    toolDefs.push(`- **${tool.name}**: ${tool.description}\n  Input shape: ${inputDesc}`);
  }

  return toolDefs.join('\n\n');
}
