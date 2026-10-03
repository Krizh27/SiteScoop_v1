import { z } from 'zod';
import { isAllowedUrl } from '../services/recovery/url.service.js';
import { recoverWebsite } from '../services/recovery/recovery.service.js';
import path from 'path';

const recoverySchema = z.object({
  url: z.string().url()
});

export const recover = async (req, res) => {
  try {
    const validation = recoverySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid URL provided' });
    }

    const { url } = validation.data;

    if (!isAllowedUrl(url)) {
      return res.status(400).json({ success: false, error: 'Disallowed URL' });
    }

    // Default workspace dir
    const workspaceDir = process.env.WORKSPACE_DIR 
      ? path.resolve(process.cwd(), process.env.WORKSPACE_DIR)
      : path.resolve(process.cwd(), '../workspace');

    const result = await recoverWebsite(url, workspaceDir);

    // Never expose absolute path to the frontend, just provide a relative path or hide it.
    // For API response, we return the relative path
    const safeResponse = {
      ...result,
      projectPath: `workspace/${result.projectId}`
    };

    res.json({ success: true, ...safeResponse });

  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Recovery failed'
    });
  }
};
