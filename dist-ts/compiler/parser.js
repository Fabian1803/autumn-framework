import fs from 'fs-extra';
import path from 'path';
export function extractBalancedBlock(text, startIndex) {
    const openBraceIndex = text.indexOf('{', startIndex);
    if (openBraceIndex === -1)
        return null;
    let depth = 0;
    for (let i = openBraceIndex; i < text.length; i++) {
        if (text[i] === '{') {
            depth++;
        }
        else if (text[i] === '}') {
            depth--;
            if (depth === 0) {
                return {
                    body: text.substring(openBraceIndex + 1, i),
                    startIndex: openBraceIndex,
                    endIndex: i + 1
                };
            }
        }
    }
    return null;
}
export function parseAutumnComponent(content, filePath) {
    const dirPath = filePath ? path.dirname(filePath) : process.cwd();
    const selectorMatch = content.match(/selector\s*:\s*["']([^"']+)["']/);
    const selector = selectorMatch ? selectorMatch[1] : undefined;
    let styleContent = '';
    const styleInvalidMatch = content.match(/@Style(?:\s+public)?\s*css\s*\(\s*["']([^"']+)["']/);
    if (styleInvalidMatch) {
        throw new Error(`[Autumn Compiler Error] Sintaxis inválida en ${filePath || 'componente'}: No se puede poner una ruta de archivo en public css('${styleInvalidMatch[1]}'). Usa '@Style public ("${styleInvalidMatch[1]}");' para archivos externos o '@Style public css() { ... }' para estilos integrados.`);
    }
    const styleFileMatch = content.match(/@Style(?:[\s-]*url)?(?:\s+public)?\s*\(\s*["']([^"']+)["']\s*\)/);
    const stylePos = content.indexOf('@Style');
    if (styleFileMatch) {
        const relPath = styleFileMatch[1];
        const absPath = path.resolve(dirPath, relPath);
        if (fs.existsSync(absPath)) {
            styleContent = fs.readFileSync(absPath, 'utf-8').trim();
        }
    }
    else if (stylePos !== -1) {
        const cssMethodMatch = content.substring(stylePos).match(/(?:static|public)?\s*css\s*\(\)\s*/);
        if (cssMethodMatch && cssMethodMatch.index !== undefined) {
            const braceStart = stylePos + cssMethodMatch.index + cssMethodMatch[0].length;
            const block = extractBalancedBlock(content, braceStart);
            if (block) {
                styleContent = block.body.replace(/<\/?style>/gi, '').trim();
            }
        }
    }
    if (!styleContent) {
        const styleTagMatch = content.match(/<style>([\s\S]*?)<\/style>/);
        if (styleTagMatch) {
            styleContent = styleTagMatch[1].trim();
        }
    }
    let templateContent = '';
    const viewInvalidMatch = content.match(/@View(?:\s+public)?\s*html\s*\(\s*["']([^"']+)["']/);
    if (viewInvalidMatch) {
        throw new Error(`[Autumn Compiler Error] Sintaxis inválida en ${filePath || 'componente'}: No se puede poner una ruta de archivo en public html('${viewInvalidMatch[1]}'). Usa '@View public ("${viewInvalidMatch[1]}");' para archivos externos o '@View public html() { ... }' para plantillas integradas.`);
    }
    const viewFileMatch = content.match(/@View(?:[\s-]*url)?(?:\s+public)?\s*\(\s*["']([^"']+)["']\s*\)/);
    const viewPos = content.indexOf('@View');
    if (viewFileMatch) {
        const relPath = viewFileMatch[1];
        const absPath = path.resolve(dirPath, relPath);
        if (fs.existsSync(absPath)) {
            templateContent = fs.readFileSync(absPath, 'utf-8').trim();
        }
    }
    else if (viewPos !== -1) {
        const htmlMethodMatch = content.substring(viewPos).match(/(?:static|public)?\s*html\s*\(\)\s*/);
        if (htmlMethodMatch && htmlMethodMatch.index !== undefined) {
            const braceStart = viewPos + htmlMethodMatch.index + htmlMethodMatch[0].length;
            const block = extractBalancedBlock(content, braceStart);
            if (block) {
                templateContent = block.body.replace(/<style>[\s\S]*?<\/style>/gi, '').trim();
            }
        }
    }
    if (!templateContent) {
        const templateTagMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        if (templateTagMatch) {
            templateContent = templateTagMatch[1].trim();
        }
    }
    const variables = {};
    const stateMatches = content.matchAll(/(?:@State|let|const|var)\s+(\w+)\s*=\s*([^;\n]+);/g);
    for (const match of stateMatches) {
        const [_, varName, varValue] = match;
        variables[varName] = varValue.trim();
    }
    const methods = {};
    const methodMatches = content.matchAll(/(\w+)\s*\(\)\s*\{([\s\S]*?)\}/g);
    for (const match of methodMatches) {
        const [_, methodName, methodBody] = match;
        if (methodName !== 'html' && methodName !== 'css' && methodName !== 'main') {
            methods[methodName] = methodBody.trim();
        }
    }
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1].trim() : '';
    return {
        selector,
        scriptContent,
        templateContent,
        styleContent,
        variables,
        methods
    };
}
