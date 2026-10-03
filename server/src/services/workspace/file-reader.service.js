import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { resolveWorkspacePath } from '../../utils/workspace-path.js';
import readline from 'readline';

const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.cjs', 
  '.json', '.md', '.txt', '.svg', '.xml'
]);

export const readFileContent = async (workspaceDir, projectId, relativePath) => {
  const filePath = resolveWorkspacePath(workspaceDir, projectId, relativePath);
  const stat = await fs.stat(filePath);
  
  if (!stat.isFile()) {
    throw new Error('Not a file');
  }

  const extension = path.extname(filePath).toLowerCase();
  const maxBytes = parseInt(process.env.MAX_FILE_READ_BYTES, 10) || 1000000; // 1MB default
  
  const isText = TEXT_EXTENSIONS.has(extension);
  
  const response = {
    path: relativePath,
    name: path.basename(filePath),
    extension,
    size: stat.size,
    binary: !isText
  };

  if (!isText) {
    return response;
  }

  if (stat.size > maxBytes) {
    throw new Error('FILE_TOO_LARGE');
  }

  response.content = await fs.readFile(filePath, 'utf-8');
  return response;
};

export const serveAssetStream = (workspaceDir, projectId, relativePath) => {
  const filePath = resolveWorkspacePath(workspaceDir, projectId, relativePath);
  if (!fsSync.existsSync(filePath)) {
    throw new Error('File not found');
  }
  return filePath; // Let Express handle stream/send
};

export const searchWorkspace = async (workspaceDir, projectId, query) => {
  const projectRoot = resolveWorkspacePath(workspaceDir, projectId);
  const results = [];
  
  const searchInDirectory = async (currentPath) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await searchInDirectory(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;

        try {
          const stat = await fs.stat(fullPath);
          if (stat.size > (parseInt(process.env.MAX_FILE_READ_BYTES, 10) || 1000000)) continue;

          const fileStream = fsSync.createReadStream(fullPath);
          const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

          let lineNumber = 1;
          for await (const line of rl) {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              const relativePath = path.relative(projectRoot, fullPath).split(path.sep).join('/');
              results.push({
                path: relativePath,
                line: lineNumber,
                preview: line.trim().substring(0, 150)
              });
              if (results.length >= 100) {
                rl.close();
                return;
              }
            }
            lineNumber++;
          }
        } catch (err) {
          // Ignore read errors for search
        }
      }
    }
  };

  await searchInDirectory(projectRoot);
  return results;
};
