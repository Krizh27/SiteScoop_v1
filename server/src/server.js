import app from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Gemma Model: ${process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it'}`);
});
