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

## Agent Harness

In Stage 5, we implemented the **Agent Harness** (`server/src/agent/`), which links the local Gemma model to the read-only Safe Tool Registry through an iterative reasoning loop.

### Control Flow

```text
User Request
     ↓
Agent Service (agent.service.js)
     ↓
Agent Loop (agent-loop.js)
     ↓
Gemma (via Model Service)
     ↓
Structured Action (JSON)
     ↓
Zod Validation (agent.schemas.js)
     ↓
Agent Policy (agent-policy.js)
     ↓
Tool Executor (tool-executor.js)
     ↓
Read-only Tool (safe workspace boundary)
     ↓
Observation (truncated to size limits)
     ↓
Gemma (next turn)
     ↓
Final Answer (markdown)
```

### Authorization Principle

**Gemma proposes actions, but the application authorizes and executes them.**

1. **Model Proposes Actions**: The model returns structured JSON with an action type (`tool_call`, `final`, or `clarification`).
2. **Server Validates & Authorizes**:
   - `AgentParser` safely extracts and validates the action shape with Zod without using `eval()`.
   - `AgentPolicy` strictly enforces that only the six permitted read-only tools can be called. Unknown or mutating tools (e.g. `delete_file`, `exec_command`) are rejected before execution.
   - Project ID boundaries are enforced automatically by the server context, preventing path traversal outside the project directory.
   - Runaway loops are blocked via step limits (`AGENT_MAX_STEPS`) and repeated tool call detection.
3. **No Private Chain-of-Thought Leaks**: Internal prompts and hidden thoughts are omitted from the client response. Only tool activity names and the final answer are returned to the user.

## AI Project Inspector

In Stage 6, we implemented the **AI Project Inspector** (`server/src/inspector/`). The inspector analyzes recovered projects for concrete broken references, missing assets, structural flaws, and recovery limitations.

### Architecture

```text
                 ┌──────────────────────┐
                 │ Recovered Website    │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Deterministic Checks │ (recovery, HTML, assets, dependencies)
                 └──────────┬───────────┘
                            │
                     Evidence/Signals
                            │
                 ┌──────────▼───────────┐
                 │    Gemma Agent       │ (read-only tools & inspection prompt)
                 └──────────┬───────────┘
                            │
                    Structured Findings
                            │
                 ┌──────────▼───────────┐
                 │ Finding Normalizer   │ (schema validation, deduplication, ranking)
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Inspector Report     │
                 └──────────────────────┘
```

### Core Inspection Principles

1. **Evidence-First Requirement**: Every finding must cite concrete, verifiable evidence (e.g. download failure in `recovery.json`, broken relative tag in `index.html`, missing `<meta name="viewport">`). Unsupported claims are discarded.
2. **Distinguish Fact from Inference**: The inspector does not declare something broken merely because it looks unusual. Missing backend code or absent `package.json` manifests are reported as architectural limitations of frontend extraction rather than software bugs.
3. **Deterministic Guardrails**: Static checks run prior to model reasoning to provide grounded factual anchors, ensuring key issues are identified even if the local model is brief or offline.
4. **Interactive File Navigation**: Every finding lists affected workspace files; clicking a file in the UI opens the file directly in the existing code viewer.

## Planned Future Components

### Code Modification & Export (Future)
- Code modifications via safe diff application.
- Zip projects for export using JSZip.
- Optional browser rendering via Playwright.
