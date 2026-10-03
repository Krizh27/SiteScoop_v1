import { AgentError, AgentErrors } from '../agent-errors.js';

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  registerTool(tool) {
    if (!tool || !tool.name || !tool.execute || !tool.inputSchema) {
      throw new Error('Invalid tool structure');
    }
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new AgentError(AgentErrors.INVALID_TOOL, `Unknown tool: ${name}`);
    }
    return tool;
  }

  hasTool(name) {
    return this.tools.has(name);
  }

  listTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input: this.formatZodSchema(tool.inputSchema)
    }));
  }

  // Very basic zod schema formatter to avoid leaking raw internals
  formatZodSchema(zodSchema) {
    if (!zodSchema || !zodSchema.shape) return {};
    const shape = zodSchema.shape;
    const formatted = {};
    for (const key in shape) {
      formatted[key] = 'string'; // Default simplified representation
      // We could refine this based on zod internal type if needed later
    }
    return formatted;
  }
}

export const registry = new ToolRegistry();
