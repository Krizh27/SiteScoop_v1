import fs from 'fs/promises';
import path from 'path';

export const createProject = async (baseDir) => {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const projectId = `recovery-${timestamp}-${randomId}`;
  
  const projectPath = path.resolve(baseDir, projectId);
  
  // Prevent path traversal
  if (!projectPath.startsWith(path.resolve(baseDir))) {
    throw new Error('Invalid project path');
  }

  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets', 'css'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets', 'js'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets', 'images'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets', 'fonts'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets', 'other'), { recursive: true });

  return { projectId, projectPath };
};

export const saveFile = async (projectPath, relativePath, content, encoding = 'utf-8') => {
  const fullPath = path.resolve(projectPath, relativePath);
  
  // Prevent path traversal
  if (!fullPath.startsWith(path.resolve(projectPath))) {
    throw new Error('Path traversal detected');
  }

  if (typeof content === 'string') {
    await fs.writeFile(fullPath, content, { encoding });
  } else {
    // Binary content (Buffer)
    await fs.writeFile(fullPath, content);
  }
};
