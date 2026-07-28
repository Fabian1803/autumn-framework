import fs from 'fs-extra';
import path from 'path';
import { AutumnApplicationProperties } from './properties.loader.js';
import { parseRawValue } from './control-flow.js';

export function generateFinalHtml(
  rootHtml: string,
  combinedStyles: string,
  combinedVariables: Record<string, any>,
  props: AutumnApplicationProperties
): void {
  const title = props['autumn.application.title'] || 'Autumn Application 🍁';
  const description = props['autumn.metadata.description'] || '';
  const keywords = props['autumn.metadata.keywords'] || '';
  const ogImage = props['autumn.metadata.og-image'] || '';

  const initialStateJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(combinedVariables).map(([k, v]) => {
        return [k, parseRawValue(v)];
      })
    )
  );

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
          let current = (window.state && window.state[parts[0]] !== undefined) ? window.state : window;
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

  // 1. Reemplazar eventos primero (ej: onclick={this.incrementar})
  processedTemplate = processedTemplate.replace(/onclick=\{(?:this\.)?(\w+)\}/g, (match, methodName) => {
    return `onclick="autumnIncrement()"`;
  });

  // 2. Reemplazar expresiones {this.count}, {this.cartService.totalItems} y {this.notifications.length}
  processedTemplate = processedTemplate.replace(/\{\s*(?:this\.)?([\w.]+)\s*\}/g, (match, pathExpr) => {
    let initialVal = '0';
    if (combinedVariables[pathExpr] !== undefined) {
      initialVal = String(parseRawValue(combinedVariables[pathExpr]));
    } else if (pathExpr.includes('.')) {
      const parts = pathExpr.split('.');
      const varVal = parseRawValue(combinedVariables[parts[0]]);
      if (Array.isArray(varVal) && parts[1] === 'length') {
        initialVal = String(varVal.length);
      }
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
  } else {
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

  let finalHtml = baseHtml.replace(
    /<app-context-metadata\s*\/?>|<app-context-metadata>[\s\S]*?<\/app-context-metadata>/gi,
    metadataHtml
  );

  finalHtml = finalHtml.replace(
    /<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi,
    `${processedTemplate}\n${clientScript}`
  );

  const distDir = path.resolve(process.cwd(), 'dist');
  fs.ensureDirSync(distDir);
  fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
  console.log('🍁 [Autumn TS] ¡Compilación exitosa! Expresiones .length enlazadas en ./dist/index.html');
}
