# SiteScoop AI

> **Recover. Understand. Improve.**

SiteScoop AI is an open-source, AI-powered website recovery and development agent. It accepts a deployed website URL, extracts publicly accessible frontend resources, reconstructs an editable local project, and utilizes a local **Gemma 4** model via **Ollama** to inspect, debug, and improve the recovered website.

SiteScoop AI operates entirely locally on your workstation, with **zero mandatory dependency on paid hosted LLM APIs**.

---

## Current Implementation Status

- **Stage 0: Project Foundation** — **COMPLETED**
  - Modular Express.js backend with ES Modules, CORS configuration, centralized error handling, and `GET /api/health` endpoint.
  - Modern React + Vite frontend styled with Tailwind CSS, featuring developer-tool dark aesthetics and real-time backend health monitoring.
  - Environment variable scaffolding (`.env.example`).
  - Architecture documentation ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) defining responsibilities for all future layers.
- **Future Stages** (Planned):
  - *Stage 1: Website Extraction* (Cheerio & Playwright)
  - *Stage 2: Workspace Synthesis & Diffs* (Filesystem reconstruction, diff application, ZIP export)
  - *Stage 3: Local AI Inference* (Gemma 4 via Ollama)
  - *Stage 4: Autonomous Agent Harness* (Zod tool validation, iterative dev-loop)

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Module System**: JavaScript ES Modules

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Middleware**: `cors`, `dotenv`
- **Module System**: JavaScript ES Modules

### Planned Future Integrations
- **Extraction**: Cheerio (static DOM), Playwright (headless browser)
- **Local AI**: Ollama (running Gemma 4 locally)
- **Validation**: Zod
- **Filesystem & Bundling**: Node.js `fs/promises`, `diff`, `jszip`

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or later (v20+ or v24+ recommended)
- **npm**: v9.0.0 or later
- **Ollama**: (Optional for Stage 0; required for Stage 3 local Gemma 4 model inference)

---

## Project Structure

```
sitescoop-ai/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Modular UI components (Header, UrlInput, Status, etc.)
│   │   ├── pages/              # Page layouts (Dashboard.jsx)
│   │   ├── hooks/              # Custom hooks (useHealthCheck.js)
│   │   ├── services/           # API services (api.js)
│   │   ├── assets/             # Media and SVG assets (logo.svg)
│   │   ├── App.jsx             # Main application component
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html              # HTML document template
│   ├── package.json            # Client dependencies and scripts
│   └── vite.config.js          # Vite configuration with Tailwind CSS
├── server/                     # Backend Express.js application
│   ├── src/
│   │   ├── routes/             # Express route definitions (health.routes.js, index.js)
│   │   ├── controllers/        # Route controllers (health.controller.js)
│   │   ├── services/           # Business logic services (health.service.js)
│   │   ├── middleware/         # Middleware (errorHandler.js, notFoundHandler.js)
│   │   ├── utils/              # Helper utilities (logger.js)
│   │   ├── app.js              # Express app definition and middleware chain
│   │   └── server.js           # Server bootstrap and port listener
│   ├── .env.example            # Backend environment template
│   └── package.json            # Server dependencies and scripts
├── workspace/                  # Staging directory for recovered websites
│   └── .gitkeep
├── docs/
│   └── ARCHITECTURE.md         # Detailed architectural specification
├── .gitignore                  # Git exclusions for builds and node_modules
├── .env.example                # Root environment template
└── README.md                   # Project documentation
```

---

## Installation Instructions

Clone the repository and install dependencies for both the frontend and backend:

### 1. Install Backend Dependencies
```bash
cd sitescoop-ai/server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## Configuration

Both frontend and backend are pre-configured with sensible defaults for local development.

To customize environment settings, copy `.env.example` in `server`:
```bash
cd sitescoop-ai/server
cp .env.example .env
```

Default variables:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
WORKSPACE_DIR=../workspace
```

---

## How to Start the Project

Run the backend and frontend in separate terminal windows.

### Terminal 1: Start Backend Server
```bash
cd sitescoop-ai/server
npm run dev
```
*Alternatively, for standard production execution:*
```bash
npm start
```
The server will start at `http://localhost:5000`.

### Terminal 2: Start Frontend Application
```bash
cd sitescoop-ai/client
npm run dev
```
The client development server will start at `http://localhost:5173`.

---

## Health Check Verification

To verify that the backend is running properly, make a GET request to `/api/health`:

Using `curl`:
```bash
curl http://localhost:5000/api/health
```

Using PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "app": "SiteScoop AI",
  "status": "running"
}
```

When you open `http://localhost:5173` in your browser, the dashboard will display a live green connection status badge and render the health status JSON payload directly.
