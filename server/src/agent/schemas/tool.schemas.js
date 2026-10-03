import { z } from 'zod';

// Reject navigation and absolute paths
const safePathPattern = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).*$/;

export const projectIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid project ID format');

export const projectPathSchema = z.string()
  .min(1)
  .regex(safePathPattern, 'Path traversal and absolute paths are forbidden')
  .refine(val => !val.includes('\0'), 'Null bytes are forbidden');

export const searchQuerySchema = z.string().min(1);

export const listProjectFilesSchema = z.object({
  projectId: projectIdSchema
});

export const readFileSchema = z.object({
  projectId: projectIdSchema,
  path: projectPathSchema
});

export const searchProjectSchema = z.object({
  projectId: projectIdSchema,
  query: searchQuerySchema,
  maxResults: z.number().int().positive().optional().default(100)
});

export const getRecoveryReportSchema = z.object({
  projectId: projectIdSchema
});

export const getFileMetadataSchema = z.object({
  projectId: projectIdSchema,
  path: projectPathSchema
});

export const analyzeDependenciesSchema = z.object({
  projectId: projectIdSchema
});

export const proposeEditSchema = z.object({
  projectId: projectIdSchema,
  path: projectPathSchema,
  proposedContent: z.string({ required_error: 'proposedContent is required' }),
  reason: z.string().min(1).optional().default('Proposed code edit')
});

export const getDiffSchema = z.object({
  changeId: z.string().min(1, 'changeId is required')
});

export const applyEditSchema = z.object({
  changeId: z.string().min(1, 'changeId is required')
});

