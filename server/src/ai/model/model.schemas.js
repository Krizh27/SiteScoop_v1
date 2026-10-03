import { z } from 'zod';

export const modelRequestSchema = z.object({
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, 'userPrompt is required and cannot be empty'),
  temperature: z.number().min(0).max(2).optional()
});

export const modelResponseSchema = z.object({
  success: z.literal(true),
  model: z.string().min(1, 'model identifier is required'),
  content: z.string(),
  usage: z.object({
    promptTokens: z.number().nullable(),
    completionTokens: z.number().nullable()
  })
});
