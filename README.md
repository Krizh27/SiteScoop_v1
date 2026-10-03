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
  - Architecture documentation ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
- **Stage 1: Website Extraction Engine** — **COMPLETED**
  - Secure, SSRF-protected website extraction endpoint (`POST /api/extract`).
  - Deep HTML parsing with Cheerio (page metadata, stylesheets, scripts, images, fonts, manifests, and links).
  - Concurrency-controlled public asset fetcher (CSS, JS, images, fonts, icons) with 4-worker limit, 5MB individual cap, 40 total assets cap, and 25MB aggregate budget.
  - Isolated staging pipeline (`workspace/.staging/<extraction-id>/`) with original `index.html`, downloaded assets, and `manifest.json`.
  - Comprehensive SSRF validation: IP blocklists, private range filtering, cloud metadata blocking, and recursive redirect destination verification.
- **Future Stages** (Planned):
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
- **HTTP Client**: Axios
- **HTML Parser**: Cheerio
- **IP Security**: `ipaddr.js`
- **Middleware**: `cors`, `dotenv`
- **Module System**: JavaScript ES Modules

### Planned Future Integrations
- **Dynamic Scraping**: Playwright (headless browser for SPA rendering)
- **Local AI**: Ollama (running Gemma 4 locally)
- **Validation**: Zod
- **Filesystem & Bundling**: Node.js `fs/promises`, `diff`, `jszip`

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or later (v20+ or v24+ recommended)
- **npm**: v9.0.0 or later
- **Ollama**: (Optional for Stages 0-1; required for Stage 3 local Gemma 4 model inference)

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
│   │   ├── routes/             # Express routes (health.routes.js, extraction.routes.js, index.js)
│   │   ├── controllers/        # Route controllers (health.controller.js, extraction.controller.js)
│   │   ├── services/           # Services (extraction.service.js, urlValidator.service.js, etc.)
│   │   ├── middleware/         # Middleware (errorHandler.js, notFoundHandler.js)
│   │   ├── utils/              # Utilities (fileUtils.js, logger.js)
│   │   ├── app.js              # Express app definition and middleware chain
│   │   └── server.js           # Server bootstrap and port listener
│   ├── .env.example            # Backend environment template
│   └── package.json            # Server dependencies and scripts
├── workspace/                  # Staging and recovered workspace storage
│   ├── .staging/               # Isolated extraction runs (<extraction-id>/)
│   └── .gitkeep
├── docs/
│   └── ARCHITECTURE.md         # Detailed architectural specification
├── IMPLEMENTATION_STATUS.md    # Detailed phase-by-phase implementation ledger
├── .gitignore                  # Git exclusions for builds, node_modules, and staging
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

## API Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies backend operational status.
- **Response**:
  ```json
  {
    "success": true,
    "app": "SiteScoop AI",
    "status": "running"
  }
  ```

### 2. Website Extraction Engine
- **Endpoint**: `POST /api/extract`
- **Description**: Accepts a public website URL, performs SSRF security checks, downloads public assets, stages the content in `workspace/.staging/<id>/`, and generates a detailed manifest.
- **Request Body**:
  ```json
  {
    "url": "https://example.com"
  }
  ```
- **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "extractionId": "ext_1791010457564_3bd5d2ca",
    "sourceUrl": "https://example.com/",
    "page": {
      "title": "Example Domain",
      "description": "",
      "canonical": "https://example.com/",
      "language": "en"
    },
    "resources": {
      "stylesheets": [],
      "scripts": ["https://example.com/s.js"],
      "images": [],
      "fonts": [],
      "links": []
    },
    "assets": {
      "downloaded": 1,
      "failed": 0
    },
    "summary": {
      "totalResources": 1
    },
    "warnings": []
  }
  ```

### 3. Local AI Website Analysis
- **Endpoint**: `POST /api/ai/analyze`
- **Description**: Uses a local Gemma model running via Ollama to inspect, summarize, and suggest actionable code and CSS improvements based on extracted HTML and CSS context.
- **Request Body**:
  ```json
  {
    "projectId": "proj_1791011925945_ecac37",
    "question": "Explain this website and suggest improvements"
  }
  ```
- **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "projectId": "proj_1791011925945_ecac37",
    "model": "gemma4:e2b",
    "question": "Explain this website and suggest improvements",
    "analysis": "1. Short website summary: ...\n2. Three observations: ...\n3. Three practical suggestions: ...\n4. One suggested CSS improvement: ..."
  }
  ```

---

## Security & SSRF Protection

SiteScoop AI includes strict SSRF defenses to prevent access to the user's private network:
1. **Allowed Protocols**: Only `http:` and `https:`. All other protocols (file, ftp, gopher, etc.) are rejected.
2. **Credential Stripping**: URLs containing embedded user credentials (e.g. `user:pass@host`) are prohibited.
3. **Loopback & Private Address Blocking**: Blocks `127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`, `fe80::/10`, and link-local ranges.
4. **Cloud Metadata Endpoints**: Unconditionally blocks `169.254.169.254`, `metadata.google.internal`, and AWS/GCP instance metadata services.
5. **DNS Validation**: Performs full DNS resolution check on all resolved IPs before connecting.
6. **Redirect Verification**: Re-validates every redirect destination against SSRF policies (up to 3 redirects maximum).
7. **Execution Safety**: Downloaded JavaScript and assets are strictly treated as inert data and **never executed**.

---

## Extraction Limitations

- **Client-Side Rendering (SPA)**: Pure static extraction parses HTML returned by the initial HTTP response. Single-page applications requiring full JavaScript execution to populate content will be enhanced in future stages with optional headless Playwright browser rendering.
- **Download Limits**:
  - Individual asset size cap: **5 MB**.
  - Total assets per extraction: **40 files**.
  - Aggregate download budget: **25 MB**.
  - Concurrency: **4 simultaneous downloads**.
- **No Recursive Crawling**: Extracts the specified landing page only; hyperlinks are listed but not crawled recursively.

---

## How to Test Stage 1

### 1. Test Valid Website Extraction
```powershell
$body = '{"url":"https://example.com"}'
Invoke-RestMethod -Uri http://localhost:5000/api/extract -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### 2. Verify Staged Output
Check your workspace staging directory:
```powershell
Get-ChildItem -Recurse workspace/.staging
```
You will find:
- `workspace/.staging/<extraction-id>/index.html` (original raw HTML)
- `workspace/.staging/<extraction-id>/assets/` (downloaded stylesheets, scripts, images)
- `workspace/.staging/<extraction-id>/manifest.json` (metadata and asset ledger)

### 3. Test SSRF Rejection
Verify that private addresses are rejected with HTTP 400:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/extract -Method POST -Body '{"url":"http://127.0.0.1:5000"}' -ContentType "application/json"
```
