import { z } from 'zod';

export const ollamaMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

export const ollamaChatRequestSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  messages: z.array(ollamaMessageSchema).min(1, 'At least one message is required'),
  stream: z.literal(false).default(false),
  options: z.object({
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

export const ollamaGenerateRequestSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  system: z.string().optional(),
  stream: z.literal(false).default(false),
  options: z.object({
    temperature: z.number().min(0).max(2).optional()
  }).optional()
});

export const ollamaChatResponseSchema = z.object({
  model: z.string().optional(),
  message: z.object({
    role: z.string(),
    content: z.string()
  }),
  done: z.boolean().optional(),
  prompt_eval_count: z.number().nullable().optional(),
  eval_count: z.number().nullable().optional()
});

export const ollamaGenerateResponseSchema = z.object({
  model: z.string().optional(),
  response: z.string(),
  done: z.boolean().optional(),
  prompt_eval_count: z.number().nullable().optional(),
  eval_count: z.number().nullable().optional()
});
