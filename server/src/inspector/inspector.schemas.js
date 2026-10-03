import { z } from 'zod';

export const findingCategoryEnum = z.enum([
  'recovery',
  'asset',
  'html',
  'css',
  'javascript',
  'dependency',
  'structure',
  'performance',
  'security',
  'unknown'
]);

export const findingSeverityEnum = z.enum(['info', 'warning', 'error']);

export const findingConfidenceEnum = z.enum(['low', 'medium', 'high']);

export const findingSchema = z.object({
  id: z.string().min(1, 'Finding id is required'),
  title: z.string().min(1, 'Finding title is required'),
  category: findingCategoryEnum.default('unknown'),
  severity: findingSeverityEnum.default('info'),
  confidence: findingConfidenceEnum.default('medium'),
  description: z.string().min(1, 'Description is required'),
  evidence: z.array(z.string().min(1)).min(1, 'Every finding must contain at least one evidence item'),
  affectedFiles: z.array(z.string()).default([]),
  suggestedAction: z.string().optional()
});

export const rawModelFindingSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional(),
  severity: z.string().optional(),
  confidence: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  evidence: z.union([z.array(z.string()), z.string()]).optional(),
  affectedFiles: z.union([z.array(z.string()), z.string()]).optional(),
  suggestedAction: z.string().optional()
});

export const modelInspectorResponseSchema = z.object({
  findings: z.array(rawModelFindingSchema)
});

export const inspectionReportSchema = z.object({
  success: z.literal(true),
  projectId: z.string().min(1),
  summary: z.object({
    findingCount: z.number().int().nonnegative(),
    errorCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    infoCount: z.number().int().nonnegative()
  }),
  findings: z.array(findingSchema),
  analysis: z.object({
    deterministicChecks: z.number().int().nonnegative(),
    agentSteps: z.number().int().nonnegative()
  })
});

export const runInspectorRequestSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  focus: z.array(z.enum([
    'recovery',
    'assets',
    'html',
    'css',
    'javascript',
    'dependencies',
    'structure'
  ])).optional()
});
