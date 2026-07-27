const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const compileAutumn = require('./compiler');
const app = express();
const PORT = 3000;
console.log('🍁 Iniciando servidor de desarrollo de Autumn...');
compileAutumn('./src/app.atm');
app.use(express.static(path.join(__dirname, 'dist')));
chokidar.watch('./src/*.atm').on('change', (filePath) => {
  console.log(`🍁 Cambio detectado en ${filePath}. Recompilando...`);
  compileAutumn(filePath);
});
app.listen(PORT, () => {
  console.log(`
  🍁 Autumn Dev Server corriendo con éxito!
  > Local: http://localhost:${PORT}
  `);
});