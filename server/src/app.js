import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/aiRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import { initializeTools } from './tools/init.js';

const app = express();

initializeTools();

app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoutes);
app.use('/api/agent', agentRoutes);

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
