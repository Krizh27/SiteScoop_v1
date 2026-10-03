const tools = new Map();

export const registerTool = (tool) => {
  if (tools.has(tool.name)) {
    throw new Error(`Tool ${tool.name} is already registered.`);
  }
  tools.set(tool.name, tool);
};

export const getTool = (name) => {
  return tools.get(name);
};

export const hasTool = (name) => {
  return tools.has(name);
};

export const getAllTools = () => {
  return Array.from(tools.values());
};
