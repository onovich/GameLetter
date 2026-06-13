import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createCmsPaths(metaUrl) {
  const filename = fileURLToPath(metaUrl);
  const dirname = path.dirname(filename);
  const rootDir = path.resolve(dirname, '..', '..');
  const studioDir = path.join(rootDir, 'studio');
  const distDir = path.join(rootDir, 'dist');
  const inboxDir = path.join(rootDir, 'workbench', 'inbox');
  const archiveDir = path.join(rootDir, 'workbench', 'archive');
  const pendingDir = path.join(rootDir, 'workbench', 'pending');
  const publishUndoDir = path.join(archiveDir, 'publish-undo');
  const dataPath = path.join(rootDir, 'public', 'data.json');
  const port = Number(process.env.PROMPT_CMS_PORT || 4318);

  return {
    filename,
    dirname,
    rootDir,
    studioDir,
    distDir,
    inboxDir,
    archiveDir,
    pendingDir,
    publishUndoDir,
    dataPath,
    port
  };
}

export function loadLocalEnvFiles(rootDir) {
  ['.env.local', '.env'].forEach((fileName) => {
    const filePath = path.join(rootDir, fileName);
    if (!fsSync.existsSync(filePath)) {
      return;
    }
    const content = fsSync.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  });
}
