import express from 'express';
import cors from 'cors';
import recoveryRoutes from './routes/recovery.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import agentRoutes from './routes/agent.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { registerAllTools } from './agent/tools/index.js';

const app = express();

// Initialize tools
registerAllTools();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/recovery', recoveryRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: 'SiteScoop AI',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

export default app;
