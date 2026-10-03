import fs from 'fs/promises';
import path from 'path';

/**
 * Deterministic check on project dependencies and package manifest.
 */
export async function runDependenciesCheck(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  try {
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);

    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    return {
      category: 'dependency',
      hasPackageJson: true,
      dependencyCount: deps.length,
      devDependencyCount: devDeps.length,
      sampleDependencies: deps.slice(0, 10),
      isMalformed: false
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        category: 'dependency',
        hasPackageJson: false,
        message: 'No package manifest was recovered, so original npm dependencies cannot be confirmed from the project.'
      };
    }
    return {
      category: 'dependency',
      hasPackageJson: true,
      isMalformed: true,
      message: `package.json was found but could not be parsed: ${err.message}`
    };
  }
}
