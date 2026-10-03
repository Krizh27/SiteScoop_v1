# Architecture

## Frontend Responsibilities
- Provide the user interface (React, Tailwind CSS).
- Interact with backend APIs for extraction, AI operations, and project file management.
- Dashboard for viewing target websites and extraction status.

## Backend Responsibilities
- Serve as the main control hub (Node.js, Express).
- Manage API endpoints for the client.

## Agent Tool Architecture

In Stage 3, we implemented the Agent Tool Layer. This creates a clean boundary between the future AI model (Gemma) and the file system operations.

The architecture operates strictly read-only and follows this flow:

```
Model
  ↓
Structured Agent Action
  ↓
Agent Harness
  ↓
Tool Registry
  ↓
Zod Validation
  ↓
Safe Tools
  ↓
Workspace Services
  ↓
Recovered Project
```

This prevents the AI model from making direct filesystem or shell execution calls, isolating it to safe, deterministic, and sandboxed methods scoped strictly to a recovered project workspace.

## Local AI Architecture

In Stage 4, we implemented the Local Gemma Model Adapter. This layer provides isolated, configuration-driven communication with locally running Ollama instances (such as `gemma4:e2b` or other configured Gemma models).

The architecture follows this strict separation:

```text
React
  ↓
Express API (/api/ai/status, /api/ai/test)
  ↓
Model Service (model.service.js)
  ↓
Ollama Client (ollama.client.js)
  ↓
Local Gemma (via Ollama HTTP API)
```

### Architectural Separation: Model Adapter vs. Agent / Tool Layer

SiteScoop AI intentionally decouples the **Model Adapter** (`server/src/ai/`) from the **Agent Tool Layer** (`server/src/agent/`):

1. **Model Agnosticism & Swappability**: The model adapter communicates with Ollama using configurable parameters (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_TEMPERATURE`). Different teams or deployment environments can switch models (e.g. from `gemma4:e2b` to `gemma4:e4b`) without modifying agent logic or tools.
2. **Security & Sandboxing**: The model adapter has zero knowledge of the filesystem, project files, or shell commands. The frontend never talks directly to Ollama (`localhost:11434`), preventing any unauthorized browser-side prompt injections or port access.
3. **Fault Tolerance & Resilience**: If Ollama is offline or unconfigured, the rest of SiteScoop AI (website recovery engine, workspace API, file explorer, project report) continues to function completely independently.
4. **Clean Staging for Agent Harness (Stage 5)**: In Stage 5, the Agent Harness will sit between the Model Service and the Tool Registry, governing reasoning loops, tool invocation, and reflection without tangling HTTP protocol handling with tool execution.

## Planned Future Components

### Agent Harness (Stage 5)
- Orchestrate autonomous reasoning loops between Gemma and the Safe Tool Registry.
- Map prompt context and structured tool arguments.

### Code Modification & Export (Future)
- Code modifications via safe diff application.
- Zip projects for export using JSZip.
- Optional browser rendering via Playwright.
