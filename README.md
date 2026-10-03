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

## Current Implementation Status
- **Stage 0**: Project Foundation is complete.
- **Stage 1**: Website Recovery Engine is complete. Recover deployed sites into a workspace.
- **Stage 2**: Recovery Explorer & Workspace API is complete. Safely view and traverse recovered resources.
