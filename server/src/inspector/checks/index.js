import { runRecoveryCheck } from './recovery.check.js';
import { runAssetsCheck } from './assets.check.js';
import { runHtmlCheck } from './html.check.js';
import { runDependenciesCheck } from './dependencies.check.js';

export async function runAllDeterministicChecks(projectDir) {
  const [recovery, assets, html, dependencies] = await Promise.all([
    runRecoveryCheck(projectDir),
    runAssetsCheck(projectDir),
    runHtmlCheck(projectDir),
    runDependenciesCheck(projectDir)
  ]);

  return {
    recovery,
    assets,
    html,
    dependencies
  };
}

export * from './recovery.check.js';
export * from './assets.check.js';
export * from './html.check.js';
export * from './dependencies.check.js';
