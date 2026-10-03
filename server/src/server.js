import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { logger } from './utils/logger.js';
import { startPreviewServer, stopPreviewServer } from './services/previewServer.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT, 10) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = app.listen(PORT, () => {
  logger.info(`SiteScoop AI Server listening on http://localhost:${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
  logger.info(`Allowed CORS origin: ${CLIENT_URL}`);

  // Launch live preview server on separate port (5050)
  startPreviewServer();
});

// Handle graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  stopPreviewServer();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;

