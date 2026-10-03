# SiteScoop AI

Recover. Understand. Improve.

SiteScoop AI is an open-source, AI-powered website recovery and development agent.

## Technology Stack
- **Frontend**: React, Vite, JavaScript ES Modules, Tailwind CSS
- **Backend**: Node.js, Express.js, JavaScript ES Modules

## Prerequisites
- Node.js (v18 or higher recommended)
- npm

## Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd sitescoop-ai/client
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd sitescoop-ai/server
   npm install
   ```
4. Copy `.env.example` to `.env` in the root folder (or backend as needed)

## Running the Application

### Start the Backend
```bash
cd sitescoop-ai/server
npm run dev
```

### Start the Frontend
```bash
cd sitescoop-ai/client
npm run dev
```

## Local AI Setup

SiteScoop AI connects to local open-weights models (such as Gemma) running via Ollama without requiring paid cloud APIs.

1. **Install Ollama**:
   Download and install Ollama from [ollama.com](https://ollama.com).

2. **Ensure configured model is available locally**:
   Pull your desired Gemma model (e.g. `gemma4:e2b` or `gemma4:e4b`):
   ```bash
   ollama pull gemma4:e2b
   ```

3. **Configure environment variables**:
   In `server/.env` (or root `.env`), configure your model settings:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma4:e2b
   OLLAMA_TIMEOUT_MS=120000
   OLLAMA_TEMPERATURE=0.2
   ```

4. **Start the backend server**:
   ```bash
   cd sitescoop-ai/server
   npm run dev
   ```

5. **Verify AI subsystem status**:
   ```bash
   curl http://localhost:5000/api/ai/status
   ```
   Expected response:
   ```json
   {
     "success": true,
     "ollama": { "available": true },
     "model": "gemma4:e2b"
   }
   ```

6. **Test model generation**:
   ```bash
   curl -X POST http://localhost:5000/api/ai/test \
     -H "Content-Type: application/json" \
     -d "{\"prompt\": \"Explain your role in SiteScoop AI in 3 concise bullet points.\"}"
   ```

## AI Agent

SiteScoop uses a local Gemma model through Ollama.

The model does not receive arbitrary filesystem or shell access.

Instead it interacts with SiteScoop through a validated read-only tool layer.

Current tools:
- `list_project_files`
- `read_file`
- `search_project`
- `get_recovery_report`
- `get_file_metadata`
- `analyze_dependencies`

### Run Agent Endpoint
```bash
curl -X POST http://localhost:5000/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "recovery-20261003060539-809",
    "request": "Explain the structure of this recovered website."
  }'
```

## AI Project Inspector

SiteScoop AI includes an evidence-backed Project Inspector answering:
> *"What is wrong, incomplete, suspicious, or potentially broken in this recovered website?"*

### Features
- **Deterministic Pre-Checks**: Analyzes recovery failures, assets, HTML structure, and dependency manifests without LLM hallucinations.
- **Evidence-First Guarantee**: Every finding must contain concrete citations from project files or recovery reports. Unsupported claims are rejected.
- **Strict Normalization**: Validates severity (`info`, `warning`, `error`), category, confidence (`low`, `medium`, `high`), deduplicates related issues, and caps maximum findings.
- **Interactive UI**: View findings, inspect affected files in the workspace viewer with a single click, and review inspection activity.

### Run Inspector Endpoint
```bash
curl -X POST http://localhost:5000/api/inspector/run \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "recovery-20261003060539-809",
    "focus": ["recovery", "assets", "html"]
  }'
```

### Fetch Latest Report
```bash
curl http://localhost:5000/api/inspector/projects/recovery-20261003060539-809/report
```

## Current Implementation Status
- **Stage 0**: Project Foundation is complete.
- **Stage 1**: Website Recovery Engine is complete. Recover deployed sites into a workspace.
- **Stage 2**: Recovery Explorer & Workspace API is complete. Safely view and traverse recovered resources.
- **Stage 3**: Agent Tool Layer is complete. An isolated, Zod-validated tool registry stands ready for the future AI model.
- **Stage 4**: Local Gemma Model Adapter is complete. Configuration-driven Ollama connection with base system prompts, error sandboxing, and non-streaming model generation.
- **Stage 5**: Agent Harness is complete. Autonomous multi-step read-only reasoning loop, Zod action protocol, repeat-call detection, step limits, and Developer Agent Panel.
- **Stage 6**: AI Project Inspector is complete. Deterministic pre-checks, evidence-backed finding schema, Zod validation, normalization, and React Inspector Panel.
