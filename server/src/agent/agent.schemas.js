import { z } from 'zod';

export const toolCallActionSchema = z.object({
  type: z.literal('tool_call'),
  tool: z.string().min(1, 'Tool name is required'),
  input: z.record(z.unknown()).default({})
});

export const finalActionSchema = z.object({
  type: z.literal('final'),
  answer: z.string().min(1, 'Final answer is required and cannot be empty')
});

export const clarificationActionSchema = z.object({
  type: z.literal('clarification'),
  question: z.string().min(1, 'Clarification question is required and cannot be empty')
});

export const agentActionSchema = z.discriminatedUnion('type', [
  toolCallActionSchema,
  finalActionSchema,
  clarificationActionSchema
]);

export const runAgentRequestSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  request: z.string().min(1, 'request is required').max(4000, 'request exceeds maximum length of 4000 characters')
});
