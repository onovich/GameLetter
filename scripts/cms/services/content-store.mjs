import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function stringifyDataJson(value, depth = 0) {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return '[]';
    }
    const isPrimitiveArray = value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item));
    if (isPrimitiveArray && value.length <= 8) {
      return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    }
    return `[\n${value.map((item) => `${nextIndent}${stringifyDataJson(item, depth + 1)}`).join(',\n')}\n${indent}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) {
      return '{}';
    }
    return `{\n${entries.map(([key, child]) => `${nextIndent}${JSON.stringify(key)}: ${stringifyDataJson(child, depth + 1)}`).join(',\n')}\n${indent}}`;
  }

  return JSON.stringify(value);
}

export function createContentStore({ rootDir, dataPath }) {
  return {
    async readDataSource() {
      const raw = await fs.readFile(dataPath, 'utf8');
      return JSON.parse(raw);
    },

    async writeDataSource(data) {
      await fs.writeFile(dataPath, `${stringifyDataJson(data)}\n`, 'utf8');
    },

    async regenerateRss() {
      await execFileAsync(process.execPath, [path.join(rootDir, 'scripts', 'generate-rss.mjs')], { cwd: rootDir });
    }
  };
}
