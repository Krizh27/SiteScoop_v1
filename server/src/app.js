import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/aiRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import { initializeTools } from './tools/init.js';
import path from 'path';

const app = express();

initializeTools();

app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/sites', siteRoutes);
app.use('/preview', express.static(path.resolve(process.cwd(), 'workspace', 'sites')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: "SiteScoop AI",
    status: "running"
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

export default app;
