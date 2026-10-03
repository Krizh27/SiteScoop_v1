import express from 'express';
import cors from 'cors';
import recoveryRoutes from './routes/recovery.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/recovery', recoveryRoutes);
app.use('/api/workspace', workspaceRoutes);
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
