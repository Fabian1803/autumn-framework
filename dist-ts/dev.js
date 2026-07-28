import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { compileAutumn, loadApplicationProperties } from './compiler.js';
export function getEntryFile() {
    const candidates = [
        path.resolve(process.cwd(), 'src/Application.atm'),
        path.resolve(process.cwd(), 'src/App.controller.atm'),
        path.resolve(process.cwd(), 'src/contador/contador.controller.atm'),
        path.resolve(process.cwd(), 'app/app.atm')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return candidates[candidates.length - 1];
}
export function startDevServer(defaultPort) {
    const props = loadApplicationProperties();
    const port = defaultPort || props['server.port'] || 3200;
    const app = express();
    console.log('🍁 Iniciando servidor de desarrollo de Autumn (TypeScript)...');
    const entryFile = getEntryFile();
    console.log(`🍁 Compilando entrada: ${entryFile}`);
    compileAutumn(entryFile);
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    const watchPatterns = [
        path.resolve(process.cwd(), 'src/**/*.atm'),
        path.resolve(process.cwd(), 'src/**/*.ts'),
        path.resolve(process.cwd(), 'src/**/*.html'),
        path.resolve(process.cwd(), 'src/**/*.css'),
        path.resolve(process.cwd(), 'app/**/*.atm'),
        path.resolve(process.cwd(), 'main.html'),
        path.resolve(process.cwd(), 'src/application.properties.json')
    ];
    chokidar.watch(watchPatterns, { ignoreInitial: true }).on('change', (filePath) => {
        console.log(`🍁 Cambio detectado en ${filePath}. Recompilando...`);
        compileAutumn(getEntryFile());
    });
    app.listen(port, () => {
        console.log(`
  🍁 Autumn Dev Server (TS) corriendo con éxito!
  > Local: http://localhost:${port}
    `);
    });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    startDevServer();
}
