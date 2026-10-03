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

## Planned Future Components

### Website Extraction Layer (Planned)
- Extract frontend resources from target URL using Cheerio.
- Optional browser rendering via Playwright.

### Local AI Inference Layer (Planned)
- Communicate with local Gemma 4 models using Ollama for analysis and modifications.

### Agent Harness (Planned)
- Orchestrate tasks and provide context mapping between the extracted codebase and the AI model.

### Workspace/File Management (Planned)
- Use Node.js filesystem APIs for project generation.
- Zip projects for export using JSZip.
- Code modifications via `diff`.
