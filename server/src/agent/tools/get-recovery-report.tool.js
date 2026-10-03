import { getRecoveryReportSchema } from '../schemas/tool.schemas.js';
import { getRecoveryReport } from '../../services/workspace/workspace.service.js';
import { AgentError, AgentErrors } from '../agent-errors.js';

export const getRecoveryReportTool = {
  name: 'get_recovery_report',
  description: 'Retrieve the original website recovery report. Use this to understand the original URL, what was successfully downloaded, and what resources failed or are missing.',
  inputSchema: getRecoveryReportSchema,
  execute: async (context, input) => {
    try {
      const report = await getRecoveryReport(context.workspaceRoot, context.projectId);
      return report;
    } catch (error) {
      throw new AgentError(AgentErrors.FILE_NOT_FOUND, 'Recovery report not found for this project.');
    }
  }
};
