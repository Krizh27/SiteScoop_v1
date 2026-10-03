import { registerTool } from './toolRegistry.js';
import pingTool from './builtIn/pingTool.js';

export const initializeTools = () => {
  registerTool(pingTool);
};
