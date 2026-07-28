import express from 'express';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import { compileAutumn } from './compiler.js';
export function startDevServer(port = 3000) {
    const app = express();
    console.log('🍁 Iniciando servidor de desarrollo de Autumn (TypeScript)...');
    const entryFile = path.resolve(process.cwd(), 'src/app.atm');
    compileAutumn(entryFile);
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    const watchPattern = path.resolve(process.cwd(), 'src/**/*.atm');
    chokidar.watch(watchPattern).on('change', (filePath) => {
        console.log(`🍁 Cambio detectado en ${filePath}. Recompilando...`);
        compileAutumn(filePath);
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
