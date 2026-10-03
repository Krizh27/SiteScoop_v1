import { AgentError, AgentErrors } from './agent-errors.js';
import { agentActionSchema } from './agent.schemas.js';

export class AgentParser {
  /**
   * Safely extract and parse a single structured AgentAction from raw model text.
   * Throws AgentError(INVALID_AGENT_ACTION) if output is malformed or invalid.
   */
  static parse(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) {
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        'Model returned empty or non-string response.'
      );
    }

    let cleaned = rawText.trim();

    // 1. If wrapped in markdown code fence, extract the content
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    const codeBlocks = [...cleaned.matchAll(codeBlockRegex)];

    if (codeBlocks.length > 1) {
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        'Multiple conflicting code blocks detected in model response.'
      );
    } else if (codeBlocks.length === 1) {
      cleaned = codeBlocks[0][1].trim();
    }

    // 2. Locate top-level JSON objects by tracking brace balance
    const jsonObjects = this.extractTopLevelObjects(cleaned);

    if (jsonObjects.length === 0) {
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        'No structured JSON object could be found in model response.'
      );
    }

    if (jsonObjects.length > 1) {
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        'Multiple conflicting JSON objects detected in model response.'
      );
    }

    // 3. Parse JSON safely without eval
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonObjects[0]);
    } catch (err) {
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        `Malformed JSON in model response: ${err.message}`
      );
    }

    // 4. Validate against Zod schema
    const validation = agentActionSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issueDetails = validation.error.issues
        .map(i => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('; ');
      throw new AgentError(
        AgentErrors.INVALID_AGENT_ACTION,
        `Invalid action structure: ${issueDetails}`
      );
    }

    return validation.data;
  }

  /**
   * Extract all top-level balanced `{ ... }` string blocks.
   * Ignores braces inside quoted strings.
   */
  static extractTopLevelObjects(text) {
    const results = [];
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let startIndex = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          if (depth === 0) {
            startIndex = i;
          }
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && startIndex !== -1) {
            results.push(text.substring(startIndex, i + 1));
            startIndex = -1;
          } else if (depth < 0) {
            // Unbalanced closing brace
            depth = 0;
            startIndex = -1;
          }
        }
      }
    }

    return results;
  }
}
