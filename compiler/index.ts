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

export function resolveComponentWithRepositories(compPath: string, combinedVariables: Record<string, any>, combinedStyles: { value: string }): string {
  if (!fs.existsSync(compPath)) return '';

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
      const importRegex = new RegExp(`import\\s+\\{\\s*${subCompName}\\s*\\}\\s+from\\s+["']([^"']+)["']`);
      const importMatch = compContent.match(importRegex);

      if (importMatch) {
        const relPath = importMatch[1];
        const subPath = path.resolve(path.dirname(compPath), relPath);
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

export function loadApplicationRoutes(combinedVariables: Record<string, any>, combinedStyles: { value: string }): Record<string, string> {
  const routesPath = path.resolve(process.cwd(), 'applicationRoutes.atm');
  const routesMap: Record<string, string> = {};

  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf-8');
    const mappingMatches = routesContent.matchAll(/@mapping\s*\(\s*["']([^"']+)["']\s*\)[\s\S]*?(?:public|private)\s+component\s+(\w+)\s*\(\s*["']([^"']+)["']\s*\)/g);

    for (const match of mappingMatches) {
      const routePath = match[1];
      const relCompPath = match[3];
      const absCompPath = path.resolve(process.cwd(), relCompPath);

      if (fs.existsSync(absCompPath)) {
        routesMap[routePath] = resolveComponentWithRepositories(absCompPath, combinedVariables, combinedStyles);
      }
    }
  }

  return routesMap;
}

export function compileAutumn(entryFile: string): void {
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

  const combinedVariables: Record<string, any> = {};
  const combinedStylesObj = { value: '' };

  // 1. Resolver el controlador principal y todos sus componentes @repository recursivamente
  let rootHtml = resolveComponentWithRepositories(appFile, combinedVariables, combinedStylesObj);

  // 2. Cargar rutas declarativas desde applicationRoutes.atm
  const routes = loadApplicationRoutes(combinedVariables, combinedStylesObj);

  // Garantizar que la ruta raíz '/' siempre use la plantilla rootHtml con componentes resueltos
  routes['/'] = rootHtml;

  const props = loadApplicationProperties();

  // 3. Procesar directivas de control de flujo (@if, @for, @empty, cortocircuitos &&)
  rootHtml = processControlFlow(rootHtml, combinedVariables);

  // 4. Generar HTML final en ./dist/index.html
  generateFinalHtml(rootHtml, combinedStylesObj.value, combinedVariables, props, routes);
}
