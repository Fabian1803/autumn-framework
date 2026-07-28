import fs from 'fs-extra';
import path from 'path';
export function parseAutumnComponent(content) {
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    const scriptContent = scriptMatch ? scriptMatch[1].trim() : '';
    const templateContent = templateMatch ? templateMatch[1].trim() : '';
    const styleContent = styleMatch ? styleMatch[1].trim() : '';
    const variables = {};
    const variableMatches = scriptContent.matchAll(/(?:let|const|var)\s+(\w+)\s*=\s*["']([^"']+)["'];/g);
    for (const match of variableMatches) {
        const [_, varName, varValue] = match;
        variables[varName] = varValue;
    }
    return {
        scriptContent,
        templateContent,
        styleContent,
        variables
    };
}
export function compileAutumn(filePath) {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const { styleContent, variables } = parseAutumnComponent(content);
    let { templateContent } = parseAutumnComponent(content);
    for (const [key, value] of Object.entries(variables)) {
        templateContent = templateContent.replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), value);
    }
    const finalHtml = `<!DOCTYPE html>
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
    const distDir = path.resolve(process.cwd(), 'dist');
    fs.ensureDirSync(distDir);
    fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
    console.log('🍁 [Autumn TS] ¡Compilación exitosa! Archivo generado en ./dist/index.html');
}
