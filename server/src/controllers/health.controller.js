import { getAppStatus } from '../services/health.service.js';

/**
 * Controller to handle health check requests.
 * GET /api/health
 */
export const getHealth = (req, res, next) => {
  try {
    const healthStatus = getAppStatus();
    res.status(200).json(healthStatus);
  } catch (error) {
    next(error);
  }
};
