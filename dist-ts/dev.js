import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { compileAutumn, loadApplicationProperties } from './compiler/index.js';
export function getEntryFile() {
    const candidates = [
        path.resolve(process.cwd(), 'app/app.controller.atm'),
        path.resolve(process.cwd(), 'src/Application.atm'),
        path.resolve(process.cwd(), 'src/App.controller.atm')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return candidates[0];
}
export function startDevServer(defaultPort) {
    const props = loadApplicationProperties();
    const port = defaultPort || props['server.port'] || 3200;
    const app = express();
    console.log('Starting Autumn Development Server...');
    const entryFile = getEntryFile();
    console.log(`Compiling entry point: ${entryFile}`);
    compileAutumn(entryFile);
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    // SPA Fallback
    app.use((req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
    const watchPatterns = [
        path.resolve(process.cwd(), 'src/**/*.atm'),
        path.resolve(process.cwd(), 'src/**/*.ts'),
        path.resolve(process.cwd(), 'src/**/*.html'),
        path.resolve(process.cwd(), 'src/**/*.css'),
        path.resolve(process.cwd(), 'app/**/*.atm'),
        path.resolve(process.cwd(), 'app/**/*.html'),
        path.resolve(process.cwd(), 'app/**/*.css'),
        path.resolve(process.cwd(), 'main.html'),
        path.resolve(process.cwd(), 'applicationRoutes.atm'),
        path.resolve(process.cwd(), 'head.config.json'),
        path.resolve(process.cwd(), 'src/head.config.json')
    ];
    chokidar.watch(watchPatterns, { ignoreInitial: true }).on('change', (filePath) => {
        console.log(`File change detected in ${filePath}. Recompiling...`);
        compileAutumn(getEntryFile());
    });
    app.listen(port, () => {
        console.log(`
  🍁 Autumn Dev Server running at:
  > Local: http://localhost:${port}
    `);
    });
}
