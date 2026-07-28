import fs from 'fs-extra';
import path from 'path';
import { loadApplicationProperties } from './properties.loader.js';
import { parseAutumnComponent } from './parser.js';
import { processControlFlow } from './control-flow.js';
import { generateFinalHtml } from './html-generator.js';
export { loadApplicationProperties } from './properties.loader.js';
export { parseAutumnComponent } from './parser.js';
export { processControlFlow } from './control-flow.js';
export { generateFinalHtml } from './html-generator.js';
export function compileAutumn(entryFile) {
    let appFile = path.resolve(entryFile);
    if (appFile.endsWith('Application.atm') || appFile.endsWith('Application.ts')) {
        const appContent = fs.readFileSync(appFile, 'utf-8');
        const rootMatch = appContent.match(/rootController\s*:\s*(\w+)/);
        if (rootMatch) {
            const rootSymbol = rootMatch[1];
            const importRegex = new RegExp(`import\\s+\\{\\s*${rootSymbol}\\s*\\}\\s+from\\s+["']([^"']+)["']`);
            const match = appContent.match(importRegex);
            if (match) {
                const relPath = match[1];
                appFile = path.resolve(path.dirname(appFile), relPath);
            }
        }
    }
    if (!fs.existsSync(appFile)) {
        console.warn(`🍁 Warning: No se encontró el controlador principal en ${appFile}`);
        return;
    }
    const rootContent = fs.readFileSync(appFile, 'utf-8');
    const rootParsed = parseAutumnComponent(rootContent, appFile);
    let combinedStyles = rootParsed.styleContent;
    let rootHtml = rootParsed.templateContent;
    const combinedVariables = { ...rootParsed.variables };
    const repoMatches = rootContent.matchAll(/@repository\s*\(\s*(\w+)\s*\)|@Repository\s*\(\s*(\w+)\s*\)/g);
    for (const match of repoMatches) {
        const compName = match[1] || match[2];
        const importRegex = new RegExp(`import\\s+\\{\\s*${compName}\\s*\\}\\s+from\\s+["']([^"']+)["']`);
        const importMatch = rootContent.match(importRegex);
        if (importMatch) {
            const relPath = importMatch[1];
            const subPath = path.resolve(path.dirname(appFile), relPath);
            if (fs.existsSync(subPath)) {
                const subParsed = parseAutumnComponent(fs.readFileSync(subPath, 'utf-8'), subPath);
                if (subParsed.styleContent) {
                    combinedStyles += `\n${subParsed.styleContent}`;
                }
                Object.assign(combinedVariables, subParsed.variables);
                const tagNames = [compName, compName.toLowerCase(), `app-${compName.toLowerCase()}`];
                for (const tagName of tagNames) {
                    const tagRegex = new RegExp(`<${tagName}\\s*\\/?>|<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'gi');
                    if (rootHtml.match(tagRegex)) {
                        rootHtml = rootHtml.replace(tagRegex, subParsed.templateContent);
                    }
                }
            }
        }
    }
    const props = loadApplicationProperties();
    // Procesar directivas de control de flujo (@if, @for, @empty, cortocircuitos &&)
    rootHtml = processControlFlow(rootHtml, combinedVariables);
    // Generar HTML final en ./dist/index.html
    generateFinalHtml(rootHtml, combinedStyles, combinedVariables, props);
}
