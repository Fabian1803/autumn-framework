const fs = require('fs-extra');
const path = require('path');

function compileAutumn(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);

    const scriptContent = scriptMatch ? scriptMatch[1].trim() : '';
    let templateContent = templateMatch ? templateMatch[1].trim() : '';
    const styleContent = styleMatch ? styleMatch[1].trim() : '';
    const variables = {};
    const variableMatches = scriptContent.matchAll(/let\s+(\w+)\s*=\s*["']([^"']+)["'];/g);

    for (const match of variableMatches) {
        const [_, varName, varValue] = match;
        variables[varName] = varValue;
    }

    for (const [key, value] of Object.entries(variables)) {
        templateContent = templateContent.replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), value);
    }

    const finalHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Autumn App 🍁</title>
  <style>
    ${styleContent}
  </style>
</head>
<body>
  ${templateContent}
</body>
</html>
  `;

    fs.ensureDirSync('./dist');
    fs.writeFileSync('./dist/index.html', finalHtml);
    console.log('🍁 [Autumn] ¡Compilación exitosa! Archivo generado en ./dist/index.html');
}
compileAutumn('./src/app.atm');
module.exports = compileAutumn;