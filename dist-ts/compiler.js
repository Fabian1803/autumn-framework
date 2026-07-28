import fs from 'fs-extra';
import path from 'path';
export function loadApplicationProperties() {
    const propsPath = path.resolve(process.cwd(), 'src/application.properties.json');
    if (fs.existsSync(propsPath)) {
        try {
            return fs.readJsonSync(propsPath);
        }
        catch (e) {
            console.warn('🍁 Warning: Error al leer src/application.properties.json');
        }
    }
    return {};
}
export function parseAutumnComponent(content, filePath) {
    const dirPath = filePath ? path.dirname(filePath) : process.cwd();
    const selectorMatch = content.match(/selector\s*:\s*["']([^"']+)["']/);
    const selector = selectorMatch ? selectorMatch[1] : undefined;
    let styleContent = '';
    const styleFileMatch = content.match(/@Style(?:\s+url)?\s*\(\s*["']([^"']+)["']\s*\)/);
    const styleTagMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    if (styleFileMatch) {
        const relPath = styleFileMatch[1];
        const absPath = path.resolve(dirPath, relPath);
        if (fs.existsSync(absPath)) {
            styleContent = fs.readFileSync(absPath, 'utf-8').trim();
        }
    }
    else if (styleTagMatch) {
        styleContent = styleTagMatch[1].trim();
    }
    let templateContent = '';
    const viewFileMatch = content.match(/@View(?:\s+url)?\s*\(\s*["']([^"']+)["']\s*\)/);
    const viewMatch = content.match(/@View[\s\S]*?(?:static|public)?\s+html\s*\(\)\s*\{([\s\S]*?)\n\s*\}/);
    const templateTagMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    if (viewFileMatch) {
        const relPath = viewFileMatch[1];
        const absPath = path.resolve(dirPath, relPath);
        if (fs.existsSync(absPath)) {
            templateContent = fs.readFileSync(absPath, 'utf-8').trim();
        }
    }
    else if (viewMatch) {
        templateContent = viewMatch[1].replace(/<style>[\s\S]*?<\/style>/gi, '').trim();
    }
    else if (templateTagMatch) {
        templateContent = templateTagMatch[1].trim();
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
    const title = props['autumn.application.title'] || 'Autumn Application 🍁';
    const description = props['autumn.metadata.description'] || '';
    const keywords = props['autumn.metadata.keywords'] || '';
    const ogImage = props['autumn.metadata.og-image'] || '';
    const initialStateJson = JSON.stringify(Object.fromEntries(Object.entries(combinedVariables).map(([k, v]) => {
        try {
            return [k, JSON.parse(v)];
        }
        catch {
            return [k, v.replace(/^["']|["']$/g, '')];
        }
    })));
    const clientScript = `
  <script>
    (function() {
      const stateData = ${initialStateJson};

      window.cartService = {
        items: [],
        get totalItems() {
          return this.items.length;
        },
        agregarProducto(item) {
          this.items.push(item);
        }
      };

      window.state = new Proxy(stateData, {
        set(target, prop, value) {
          target[prop] = value;
          updateDOM();
          return true;
        }
      });

      function getValueByPath(pathStr) {
        if (pathStr.includes('.')) {
          const parts = pathStr.split('.');
          let current = window;
          for (const part of parts) {
            if (current && current[part] !== undefined) {
              current = typeof current[part] === 'function' ? current[part]() : current[part];
            } else {
              return 0;
            }
          }
          return current;
        }
        return window.state[pathStr] !== undefined ? window.state[pathStr] : 0;
      }

      function updateDOM() {
        document.querySelectorAll('[data-autumn-bind]').forEach(el => {
          const key = el.getAttribute('data-autumn-bind');
          if (key) {
            const val = getValueByPath(key);
            el.textContent = val;
          }
        });
      }

      window.autumnIncrement = function() {
        if (window.state.count !== undefined) {
          window.state.count++;
        }
        if (window.cartService) {
          window.cartService.agregarProducto('Item ' + window.state.count);
        }
        updateDOM();
      };

      document.addEventListener('DOMContentLoaded', () => {
        updateDOM();
      });
    })();
  </script>
  `;
    let processedTemplate = rootHtml;
    processedTemplate = processedTemplate.replace(/onclick=\{(?:this\.)?(\w+)\}/g, (match, methodName) => {
        return `onclick="autumnIncrement()"`;
    });
    processedTemplate = processedTemplate.replace(/\{\s*(?:this\.)?([\w.]+)\s*\}/g, (match, pathExpr) => {
        let initialVal = '0';
        if (combinedVariables[pathExpr] !== undefined) {
            initialVal = combinedVariables[pathExpr].replace(/^["']|["']$/g, '');
        }
        return `<span data-autumn-bind="${pathExpr}">${initialVal}</span>`;
    });
    const metadataHtml = [
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        `<title>${title}</title>`,
        description ? `<meta name="description" content="${description}">` : '',
        keywords ? `<meta name="keywords" content="${keywords}">` : '',
        ogImage ? `<meta property="og:image" content="/assets/logo-corporate.png">` : '',
        combinedStyles ? `<style>\n${combinedStyles}\n</style>` : ''
    ].filter(Boolean).join('\n    ');
    let baseHtml = '';
    const mainHtmlPath = path.resolve(process.cwd(), 'main.html');
    if (fs.existsSync(mainHtmlPath)) {
        baseHtml = fs.readFileSync(mainHtmlPath, 'utf-8');
    }
    else {
        baseHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <app-context-metadata />
</head>
<body>
    <app-component-scan />
</body>
</html>`;
    }
    let finalHtml = baseHtml.replace(/<app-context-metadata\s*\/?>|<app-context-metadata>[\s\S]*?<\/app-context-metadata>/gi, metadataHtml);
    finalHtml = finalHtml.replace(/<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi, `${processedTemplate}\n${clientScript}`);
    const distDir = path.resolve(process.cwd(), 'dist');
    fs.ensureDirSync(distDir);
    fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
    console.log('🍁 [Autumn TS] ¡Compilación exitosa! Árbol con @repository generado en ./dist/index.html');
}
