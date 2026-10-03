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
|  [COMPLETED - Stage 1] Website Extraction Engine                        |
|    - SSRF-protected HTTP client with redirect validation (Axios/ipaddr)  |
|    - HTML parser & metadata / resource collector (Cheerio)              |
|    - Concurrency-governed public asset fetcher (CSS, JS, images, fonts) |
|    - Staging pipeline: workspace/.staging/<id>/ & manifest.json         |
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
- **Status**: Implemented (Stage 0 Foundation & Stage 1 Extraction)
- **Technology**: Node.js, Express.js, ES Modules, `dotenv`, `cors`, `axios`, `cheerio`, `ipaddr.js`.
- **Responsibilities**:
  - Acts as the central orchestrator coordinating website extraction, project synthesis, AI inference, and file operations.
  - Serves REST API endpoints for frontend consumption:
    - `GET /api/health` — Returns application status and operational readiness.
    - `POST /api/extract` — Accepts `{ "url": "..." }`, orchestrates SSRF-safe extraction, stages HTML and public assets, and returns structured extraction metadata.
  - Configures CORS for local frontend development (`http://localhost:5173`).
  - Implements centralized error handling and 404 route handling.
  - Decouples server startup (`src/server.js`) from Express application configuration (`src/app.js`) for testability.

### 3. Website Extraction Layer
- **Status**: Implemented (Stage 1 Engine)
- **Technology**: `axios`, `cheerio`, `ipaddr.js`, Node.js `dns/promises`, `fs/promises`.
- **Responsibilities**:
  - Accepts a deployed target URL (e.g. `https://example.com`).
  - **SSRF Protection & URL Validation** (`urlValidator.service.js`):
    - Restricts protocols to `http:` and `https:`.
    - Prohibits embedded credentials, empty hostnames, and malformed strings.
    - Blocks loopback, private IPv4/IPv6, link-local, carrier-grade NAT, and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
    - Performs full DNS resolution check on all resolved IPs.
    - Tracks redirects manually up to 3 hops, revalidating every destination IP against SSRF rules.
  - **HTML & Resource Parsing** (`resourceExtractor.service.js`):
    - Parses HTML via Cheerio with `<base href>` resolution support.
    - Extracts page metadata: title, description, canonical URL, language, viewport, favicon.
    - Collects and deduplicates stylesheet references (`<link rel="stylesheet">`, `@import`).
    - Collects script references (`<script src>`).
    - Collects images (`<img src>`, `<img srcset>`, `<picture><source>`).
    - Collects fonts (`<link rel="preload" as="font">`, `.woff`, `.woff2`, `.ttf`, etc.).
    - Collects manifests, icons, and top-level navigation links.
  - **Asset Fetching & Staging** (`assetFetcher.service.js`, `fileUtils.js`):
    - Limits download concurrency to 4 simultaneous requests.
    - Enforces 5 MB per-asset limit, 40 total assets cap, and 25 MB aggregate download budget.
    - Validates asset URLs against SSRF policies prior to fetching.
    - Sanitizes filenames against path traversal attacks and preserves valid extensions.
    - Stages original `index.html`, downloaded assets, and `manifest.json` under `workspace/.staging/<extraction-id>/`.
  - *Future Enhancement*: Dynamic headless browser rendering (Playwright) planned for client-side rendered SPA websites.

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
- **Status**: Implemented (Ollama Integration)
- **Technology**: Local Ollama instance running Gemma (`OLLAMA_MODEL=gemma4:e2b`).
- **Responsibilities**:
  - Interfaces with Ollama's local HTTP API (`http://localhost:11434/api/chat`).
  - Enforces zero mandatory reliance on paid hosted LLM APIs (OpenAI, Anthropic, etc.), ensuring total privacy and offline capability.
  - Formats system prompts and code context specifically optimized for Gemma to analyze HTML/CSS context.
  - Generates:
    1. Short website summary
    2. Three observations about the website
    3. Three practical improvement suggestions
    4. One suggested CSS improvement
  - Accessible via `POST /api/ai/analyze`.

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
| **Stage 1** | **Website Extraction Engine** | **Completed** | SSRF-safe URL validation, Cheerio HTML parsing, asset fetcher, `POST /api/extract`, staging manifest. |
| **Stage 2** | **Workspace Synthesis** | **Planned** | Workspace file management, project structure reconstruction, diff engine, ZIP exporter. |
| **Stage 3** | **Local AI Inference** | **Completed** | Ollama integration with local Gemma model, prompt engineering, code diagnosis, `POST /api/ai/analyze`. |
| **Stage 4** | **Agent Development Loop**| **Planned** | Tool execution harness, Zod validation, iterative self-repair and refinement. |

---

## Environment & Security Considerations
- All operations are designed to run **locally** on the developer's workstation.
- Workspace operations are restricted to the designated `WORKSPACE_DIR` path to prevent arbitrary filesystem writes.
- The AI layer uses local Ollama inference, keeping recovered source code and proprietary assets confidential.
