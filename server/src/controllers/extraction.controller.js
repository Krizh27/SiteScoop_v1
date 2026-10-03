import { extractWebsite } from '../services/extraction.service.js';

/**
 * Controller to handle website extraction requests.
 * POST /api/extract
 */
export const extractUrl = async (req, res, next) => {
  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "url" (string)'
      });
    }

    const result = await extractWebsite(url.trim());
    return res.status(200).json(result);
  } catch (error) {
    const message = error.message || 'Website extraction failed';

    // Differentiate user input / SSRF validation errors from unexpected internal server errors
    const isClientError =
      message.includes('Malformed URL') ||
      message.includes('Invalid protocol') ||
      message.includes('prohibited') ||
      message.includes('blocked') ||
      message.includes('Valid URL') ||
      message.includes('hostname cannot be empty');

    if (isClientError) {
      return res.status(400).json({
        success: false,
        error: message
      });
    }

    // Target connectivity errors (e.g. DNS failure, connection timeout, 404 on target)
    const isTargetError =
      message.includes('Failed to resolve DNS') ||
      message.includes('Connection failed') ||
      message.includes('responded with HTTP') ||
      message.includes('timeout') ||
      message.includes('empty response');

    if (isTargetError) {
      return res.status(502).json({
        success: false,
        error: message
      });
    }

    next(error);
  }
};
