import { registry } from './tool-registry.js';

import { listProjectFilesTool } from './list-project-files.tool.js';
import { readFileTool } from './read-file.tool.js';
import { searchProjectTool } from './search-project.tool.js';
import { getRecoveryReportTool } from './get-recovery-report.tool.js';
import { getFileMetadataTool } from './get-file-metadata.tool.js';
import { analyzeDependenciesTool } from './analyze-dependencies.tool.js';
import { proposeEditTool } from './propose-edit.tool.js';
import { getDiffTool } from './get-diff.tool.js';
import { applyEditTool } from './apply-edit.tool.js';

export const registerAllTools = () => {
  if (registry.tools.size > 0) return; // Prevent duplicate registration in hot reload

  registry.registerTool(listProjectFilesTool);
  registry.registerTool(readFileTool);
  registry.registerTool(searchProjectTool);
  registry.registerTool(getRecoveryReportTool);
  registry.registerTool(getFileMetadataTool);
  registry.registerTool(analyzeDependenciesTool);
  registry.registerTool(proposeEditTool);
  registry.registerTool(getDiffTool);
  registry.registerTool(applyEditTool);
  
  console.log('[Agent] Registered tools:', Array.from(registry.tools.keys()).join(', '));
};

