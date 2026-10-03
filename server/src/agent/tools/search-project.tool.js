import { searchProjectSchema } from '../schemas/tool.schemas.js';
import { searchWorkspace } from '../../services/workspace/file-reader.service.js';

export const searchProjectTool = {
  name: 'search_project',
  description: 'Search for text across all supported text files in the project. Use this to find specific functions, classes, or keywords. Binary files are skipped.',
  inputSchema: searchProjectSchema,
  execute: async (context, input) => {
    // Stage 2 already implements limits and safe paths
    const results = await searchWorkspace(context.workspaceRoot, context.projectId, input.query);
    
    // Apply maxResults
    const max = input.maxResults || 100;
    const trimmed = results.slice(0, max);
    
    return {
      query: input.query,
      results: trimmed
    };
  }
};
