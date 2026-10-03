# SiteScoop AI — System Architecture

SiteScoop AI is an open-source, AI-powered website recovery and development agent. It accepts a deployed website URL, extracts publicly accessible frontend resources, reconstructs an editable local project, and utilizes a local Gemma 4 model (via Ollama) to inspect, debug, and improve the recovered codebase.

---

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                              SiteScoop AI                               |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +---------------------+
|   Client (Frontend)   | <---- HTTP / REST API ----> |   Server (Backend)  |
|  - React + Vite       |                           |  - Node.js Express  |
|  - Tailwind CSS       |                           |  - ES Modules       |
|  - Developer UI       |                           |  - Orchestrator     |
+-----------------------+                           +---------------------+
                                                              |
                  +-------------------------------------------+
                  |
                  v
+-------------------------------------------------------------------------+
|                           Core Subsystems                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  [PLANNED - Stage 1] Website Extraction Layer                           |
|    - HTML parser & DOM crawler (Cheerio)                                |
|    - Dynamic headless browser rendering (Playwright)                    |
|    - Asset fetcher (CSS, JS, fonts, images)                             |
|                                                                         |
|  [PLANNED - Stage 2] Workspace & File Management Layer                  |
|    - Sandboxed local project directories (./workspace/)                |
|    - Project structure reconstruction & bundler normalization           |
|    - Unified diff application & JSZip project export                    |
|                                                                         |
|  [PLANNED - Stage 3] Local AI Inference Layer                           |
|    - Ollama API bridge (http://localhost:11434)                         |
|    - Gemma 4 local model execution (zero API fees, fully private)       |
|    - Code reasoning, bug diagnosis, and AST-guided improvements         |
|                                                                         |
|  [PLANNED - Stage 4] Autonomous Agent Harness                           |
|    - Tool-calling loop with Zod validation                              |
|    - Build / dev-server verification loop                               |
|    - Rollback and diff review mechanism                                 |
+-------------------------------------------------------------------------+
```

---

## Component Responsibilities

### 1. Frontend Responsibilities
- **Status**: Implemented (Stage 0 Foundation)
- **Technology**: React 18, Vite, Tailwind CSS v4, ES Modules.
- **Responsibilities**:
  - Provides a clean, modern developer-tool interface for entering target URLs and managing website recovery sessions.
  - Displays real-time backend connection status and health diagnostics via `GET /api/health`.
  - Presents execution logs, extracted project trees, and recovery progress.
  - Provides diff inspection views, interactive debugging prompts, and project export triggers (in future stages).
  - Keeps UI modular, responsive, and resilient to backend polling cycles.

### 2. Backend Responsibilities
- **Status**: Implemented (Stage 0 Foundation)
- **Technology**: Node.js, Express.js, ES Modules, `dotenv`, `cors`.
- **Responsibilities**:
  - Acts as the central orchestrator coordinating website extraction, project synthesis, AI inference, and file operations.
  - Serves REST API endpoints for frontend consumption:
    - `GET /api/health` — Returns application status and operational readiness.
  - Configures CORS for local frontend development (`http://localhost:5173`).
  - Implements centralized error handling and 404 route handling.
  - Decouples server startup (`src/server.js`) from Express application configuration (`src/app.js`) for testability.

### 3. Website Extraction Layer
- **Status**: Planned (Stage 1)
- **Planned Technology**: `cheerio`, `playwright` (headless browser).
- **Responsibilities**:
  - Accepts a deployed target URL (e.g. `https://example.com`).
  - Performs static extraction using Cheerio to rapidly parse HTML and collect linked assets (`<link rel="stylesheet">`, `<script>`, `<img src>`, fonts, manifests).
  - Provides optional dynamic rendering using Playwright for client-side rendered (SPA/SSR) websites that require JavaScript execution to populate the DOM.
  - Resolves relative URLs to absolute URLs, respects site structures, and downloads assets securely into an isolated staging buffer.
  - Sanitizes asset filenames and paths to avoid directory traversal risks.

### 4. Workspace & File Management Layer
- **Status**: Planned (Stage 2)
- **Planned Technology**: Node.js `fs/promises`, `path`, `diff`, `jszip`.
- **Responsibilities**:
  - Manages the `./workspace` directory where recovered codebases reside in sandboxed isolation.
  - Reconstructs clean project directories (HTML, CSS, JS/JSX, media assets) from scraped resources.
  - Generates standardized build configs (`package.json`, `index.html`) to allow recovered sites to run locally.
  - Computes and applies unified diffs when code modifications are introduced.
  - Packages and exports the reconstructed workspace as a portable ZIP archive.

### 5. Local AI Inference Layer
- **Status**: Planned (Stage 3)
- **Planned Technology**: Local Ollama instance running the **Gemma 4** model.
- **Responsibilities**:
  - Interfaces with Ollama's local HTTP API (`http://localhost:11434/api/generate` and `/api/chat`).
  - Enforces zero mandatory reliance on paid hosted LLM APIs (OpenAI, Anthropic, etc.), ensuring total privacy and offline capability.
  - Formats system prompts and code context specifically optimized for Gemma 4's context window and instruction-following abilities.
  - Performs intelligent code comprehension, bug detection, missing asset reconstruction, and modernization recommendations.

### 6. Autonomous Agent Harness
- **Status**: Planned (Stage 4)
- **Planned Technology**: `zod`, custom tool-calling state machine.
- **Responsibilities**:
  - Provides a structured agent loop allowing Gemma 4 to invoke discrete tools (e.g. `read_file`, `write_file`, `apply_diff`, `test_build`).
  - Validates all AI tool calls and arguments against strict Zod schemas before executing filesystem changes.
  - Executes local dev-server checks to verify whether AI modifications compile and render without runtime errors.
  - Enables user approval checkpoints before applying irreversible project modifications.

---

## Implementation Roadmap & Status

| Stage | Module | Status | Description |
|---|---|---|---|
| **Stage 0** | **Project Foundation** | **Completed** | Express backend, React/Vite/Tailwind frontend, `/api/health`, environment configs, documentation. |
| **Stage 1** | **Website Extraction** | **Planned** | Cheerio HTML scraping, asset fetching, Playwright optional dynamic browser rendering. |
| **Stage 2** | **Workspace Synthesis** | **Planned** | Workspace file management, project structure reconstruction, diff engine, ZIP exporter. |
| **Stage 3** | **Local AI Inference** | **Planned** | Ollama integration with local Gemma 4 model, prompt engineering, code diagnosis. |
| **Stage 4** | **Agent Development Loop**| **Planned** | Tool execution harness, Zod validation, iterative self-repair and refinement. |

---

## Environment & Security Considerations
- All operations are designed to run **locally** on the developer's workstation.
- Workspace operations are restricted to the designated `WORKSPACE_DIR` path to prevent arbitrary filesystem writes.
- The AI layer uses local Ollama inference, keeping recovered source code and proprietary assets confidential.
