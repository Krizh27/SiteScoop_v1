import { inspectorService } from '../inspector/inspector.service.js';
import { runInspectorRequestSchema } from '../inspector/inspector.schemas.js';
import { InspectorError, InspectorErrors } from '../inspector/inspector.errors.js';

/**
 * POST /api/inspector/run
 * Body: { projectId, focus? }
 */
export const runInspection = async (req, res) => {
  try {
    const parseResult = runInspectorRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return res.status(400).json({
        success: false,
        error: {
          code: InspectorErrors.INVALID_INPUT,
          message: errorMsg
        }
      });
    }

    const { projectId, focus } = parseResult.data;
    const report = await inspectorService.inspectProject({ projectId, focus });

    return res.json(report);
  } catch (err) {
    const statusCode = err.code === InspectorErrors.NO_PROJECT_DATA ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || InspectorErrors.INSPECTION_FAILED,
        message: err.message || 'Inspection failed'
      }
    });
  }
};

/**
 * GET /api/inspector/projects/:projectId/report
 */
export const getInspectionReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: InspectorErrors.INVALID_INPUT,
          message: 'projectId path parameter is required'
        }
      });
    }

    const report = inspectorService.getReport(projectId);
    return res.json(report);
  } catch (err) {
    const statusCode = err.code === InspectorErrors.INSPECTION_NOT_FOUND ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || InspectorErrors.INSPECTION_NOT_FOUND,
        message: err.message || 'Inspection report not found'
      }
    });
  }
};
