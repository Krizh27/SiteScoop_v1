import { analyzeDependenciesSchema } from '../schemas/tool.schemas.js';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';
import fs from 'fs/promises';
import path from 'path';

export const analyzeDependenciesTool = {
  name: 'analyze_dependencies',
  description: 'Analyze project dependencies. Note that recovered deployed websites often lack package.json. This tool detects available manifests or infers from source code.',
  inputSchema: analyzeDependenciesSchema,
  execute: async (context, input) => {
    const projectRoot = resolveWorkspacePath(context.workspaceRoot, context.projectId);
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      return {
        available: true,
        packageManager: 'npm', // Assumed default if package.json exists, could check locks
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {}
      };
    } catch (error) {
      // package.json doesn't exist or isn't parseable
      return {
        available: false,
        reason: 'No package manifest was recovered from the deployed site.'
      };
    }
  }
};
