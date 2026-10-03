import { registerTool } from './toolRegistry.js';
import pingTool from './builtIn/pingTool.js';
import getSiteManifestTool from './builtIn/getSiteManifestTool.js';
import listSiteFilesTool from './builtIn/listSiteFilesTool.js';
import readSiteFileTool from './builtIn/readSiteFileTool.js';
import writeSiteFileTool from './builtIn/writeSiteFileTool.js';

export const initializeTools = () => {
  registerTool(pingTool);
  registerTool(getSiteManifestTool);
  registerTool(listSiteFilesTool);
  registerTool(readSiteFileTool);
  registerTool(writeSiteFileTool);
};
