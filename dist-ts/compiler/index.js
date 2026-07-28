import fs from 'fs-extra';
import path from 'path';
import { loadApplicationProperties } from './properties.loader.js';
import { parseAutumnComponent } from './parser.js';
import { extractBalancedBlock, processControlFlow } from './control-flow.js';
import { generateFinalHtml } from './html-generator.js';
import { resolveIconSvg } from './icon-resolver.js';
export { loadApplicationProperties } from './properties.loader.js';
export { parseAutumnComponent } from './parser.js';
export { processControlFlow } from './control-flow.js';
export { generateFinalHtml } from './html-generator.js';
export { resolveIconSvg } from './icon-resolver.js';
export function resolveComponentWithRepositories(compPath, combinedVariables, combinedStyles) {
    if (!fs.existsSync(compPath))
        return '';
    const compContent = fs.readFileSync(compPath, 'utf-8');
    const compParsed = parseAutumnComponent(compContent, compPath);
    if (compParsed.styleContent) {
        combinedStyles.value += `\n${compParsed.styleContent}`;
    }
    Object.assign(combinedVariables, compParsed.variables);
    let html = compParsed.templateContent;
    const repoMatches = compContent.matchAll(/@repository\s*\(([\s\S]*?)\)|@Repository\s*\(([\s\S]*?)\)/g);
    for (const match of repoMatches) {
        const rawList = match[1] || match[2];
        const compNames = rawList.split(',').map(s => s.trim()).filter(Boolean);
        for (const subCompName of compNames) {
            // Buscar la ruta de importación (ej: 'react-icons/fa', 'react-icons/bi', etc.)
            const importRegex = new RegExp(`import\\s+\\{[^\\}]*\\b${subCompName}\\b[^\\}]*\\}\\s+from\\s+["']([^"']+)["']`);
            const importMatch = compContent.match(importRegex);
            const importPath = importMatch ? importMatch[1] : undefined;
            // 1. Traducir iconos de react-icons a SVG vectorial puro durante la compilación
            const iconSvg = resolveIconSvg(subCompName, importPath);
            if (iconSvg) {
                const tagNames = [subCompName, subCompName.toLowerCase(), `app-${subCompName.toLowerCase()}`];
                for (const tagName of tagNames) {
                    const tagRegex = new RegExp(`<${tagName}\\s*\\/?>|<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'gi');
                    if (html.match(tagRegex)) {
                        html = html.replace(tagRegex, iconSvg);
                    }
                }
                continue;
            }
            // 2. Resolver componentes Single File (.atm)
            if (importMatch && importPath && !importPath.startsWith('react-icons')) {
                const subPath = path.resolve(path.dirname(compPath), importPath);
                const subHtml = resolveComponentWithRepositories(subPath, combinedVariables, combinedStyles);
                const tagNames = [subCompName, subCompName.toLowerCase(), `app-${subCompName.toLowerCase()}`];
                for (const tagName of tagNames) {
                    const tagRegex = new RegExp(`<${tagName}\\s*\\/?>|<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'gi');
                    if (html.match(tagRegex)) {
                        html = html.replace(tagRegex, subHtml);
                    }
                }
            }
        }
    }
    return html;
}
export function loadApplicationRoutes(combinedVariables, combinedStyles) {
    const routesPath = path.resolve(process.cwd(), 'applicationRoutes.atm');
    const routesMap = {};
    if (!fs.existsSync(routesPath))
        return routesMap;
    const routesContent = fs.readFileSync(routesPath, 'utf-8');
    // Extraer las declaraciones dentro de @Router class ApplicationRoutes { ... }
    const routerClassMatch = routesContent.match(/@Router[\s\S]*?class\s+\w+\s*\{([\s\S]*)\}/);
    if (!routerClassMatch)
        return routesMap;
    const classBody = routerClassMatch[1];
    let pos = 0;
    while ((pos = classBody.indexOf('@mapping', pos)) !== -1) {
        const mapMatch = classBody.substring(pos).match(/^@mapping\s*\(\s*["']([^"']+)["']\s*\)[\s\S]*?(?:public|private)\s+component\s+(\w+)\s*\(\s*["']([^"']+)["']\s*\)/);
        if (!mapMatch) {
            pos += 8;
            continue;
        }
        const parentRoute = mapMatch[1];
        const parentCompPath = mapMatch[3];
        const absParentPath = path.resolve(process.cwd(), parentCompPath);
        let parentHtml = '';
        if (fs.existsSync(absParentPath)) {
            parentHtml = resolveComponentWithRepositories(absParentPath, combinedVariables, combinedStyles);
        }
        const braceStart = pos + mapMatch[0].length;
        const block = extractBalancedBlock(classBody, braceStart);
        const bodyContent = block ? block.body : '';
        if (bodyContent && bodyContent.includes('children')) {
            const childrenPos = bodyContent.indexOf('children');
            const childrenBlock = extractBalancedBlock(bodyContent, childrenPos);
            if (childrenBlock) {
                const childrenContent = childrenBlock.body;
                const childRegex = /@mapping\s*\(\s*["']([^"']+)["']\s*\)[\s\S]*?(?:public|private)\s+component\s+(\w+)\s*\(\s*["']([^"']+)["']\s*\)/g;
                let cMatch;
                while ((cMatch = childRegex.exec(childrenContent)) !== null) {
                    const childSubPath = cMatch[1];
                    const childCompPath = cMatch[3];
                    const absChildPath = path.resolve(process.cwd(), childCompPath);
                    if (fs.existsSync(absChildPath)) {
                        const childHtml = resolveComponentWithRepositories(absChildPath, combinedVariables, combinedStyles);
                        const isDefault = childSubPath === '/' || childSubPath === '';
                        let fullChildRoute = parentRoute;
                        if (!isDefault) {
                            fullChildRoute = (parentRoute.endsWith('/') ? parentRoute.slice(0, -1) : parentRoute) + (childSubPath.startsWith('/') ? childSubPath : '/' + childSubPath);
                        }
                        // Inyectar el HTML de la vista hija dentro de @RouterOutlet / <app-router-outlet> de la plantilla padre
                        let fullPageHtml = parentHtml;
                        if (fullPageHtml.includes('@RouterOutlet')) {
                            fullPageHtml = fullPageHtml.replace(/@RouterOutlet/gi, `<app-router-outlet>${childHtml}</app-router-outlet>`);
                        }
                        else if (fullPageHtml.includes('<app-router-outlet')) {
                            fullPageHtml = fullPageHtml.replace(/<app-router-outlet\s*\/?>|<app-router-outlet>[\s\S]*?<\/app-router-outlet>/gi, `<app-router-outlet>${childHtml}</app-router-outlet>`);
                        }
                        routesMap[fullChildRoute] = fullPageHtml;
                        routesMap[`__child__${fullChildRoute}`] = childHtml;
                    }
                }
            }
            pos = block ? block.endIndex : pos + mapMatch[0].length;
        }
        else {
            routesMap[parentRoute] = parentHtml;
            pos = block ? block.endIndex : pos + mapMatch[0].length;
        }
    }
    return routesMap;
}
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
    const combinedVariables = {};
    const combinedStylesObj = { value: '' };
    // 1. Resolver el controlador principal y todos sus componentes @repository recursivamente
    let rootHtml = resolveComponentWithRepositories(appFile, combinedVariables, combinedStylesObj);
    // 2. Cargar rutas declarativas desde applicationRoutes.atm
    const routes = loadApplicationRoutes(combinedVariables, combinedStylesObj);
    // Si "/" no está explícitamente mapeado en applicationRoutes, usar rootHtml
    if (!routes['/']) {
        routes['/'] = rootHtml;
    }
    const props = loadApplicationProperties();
    // 3. Procesar directivas de control de flujo en la vista raíz
    const initialRoot = routes['/'] || rootHtml;
    const processedRootHtml = processControlFlow(initialRoot, combinedVariables);
    // 4. Generar HTML final en ./dist/index.html
    generateFinalHtml(processedRootHtml, combinedStylesObj.value, combinedVariables, props, routes);
}
