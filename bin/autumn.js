#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist-ts/dev.js');
if (fs.existsSync(distPath)) {
  const { startDevServer } = await import(`file://${distPath}`);
  startDevServer();
} else {
  try {
    const { startDevServer } = await import('../dev.js');
    startDevServer();
  } catch (err) {
    console.error('Error iniciando Autumn:', err);
  }
}