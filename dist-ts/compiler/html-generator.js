import fs from 'fs-extra';
import path from 'path';
import { parseRawValue, processControlFlow } from './control-flow.js';
export function generateFinalHtml(rootHtml, combinedStyles, combinedVariables, props, routes = {}) {
    const title = props['autumn.application.title'] || 'Autumn Application 🍁';
    const description = props['autumn.metadata.description'] || '';
    const keywords = props['autumn.metadata.keywords'] || '';
    const ogImage = props['autumn.metadata.og-image'] || '';
    const initialStateJson = JSON.stringify(Object.fromEntries(Object.entries(combinedVariables).map(([k, v]) => {
        return [k, parseRawValue(v)];
    })));
    // Procesar plantillas y bindings de datos en cada una de las rutas declaradas
    const processedRoutes = {
        ...routes,
        '/': rootHtml
    };
    for (const rPath in processedRoutes) {
        let tpl = processedRoutes[rPath];
        tpl = processControlFlow(tpl, combinedVariables);
        tpl = tpl.replace(/onclick=\{(?:this\.)?(\w+)\}/g, 'onclick="autumnIncrement()"');
        tpl = tpl.replace(/\{\s*(?:this\.)?([\w.]+)\s*\}/g, (match, pathExpr) => {
            let initialVal = '0';
            if (combinedVariables[pathExpr] !== undefined) {
                initialVal = String(parseRawValue(combinedVariables[pathExpr]));
            }
            else if (pathExpr.includes('.')) {
                const parts = pathExpr.split('.');
                const varVal = parseRawValue(combinedVariables[parts[0]]);
                if (Array.isArray(varVal) && parts[1] === 'length') {
                    initialVal = String(varVal.length);
                }
            }
            return `<span data-autumn-bind="${pathExpr}">${initialVal}</span>`;
        });
        processedRoutes[rPath] = tpl;
    }
    const routesJson = JSON.stringify(processedRoutes);
    const initialRootHtml = processedRoutes['/'] || rootHtml;
    const clientScript = `
  <script>
    (function() {
      const stateData = ${initialStateJson};
      const routesMap = ${routesJson};

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

      function handleRoute(pathName) {
        let content = routesMap[pathName];
        if (!content && pathName.startsWith('/user/')) {
          const userId = pathName.split('/')[2];
          content = \`<div style="background:#fff8ee; padding:20px; border-radius:8px;"><h3>👤 Detalle del Usuario ID: \${userId}</h3><p>Datos del usuario cargados dinámicamente.</p></div>\`;
        }

        if (content !== undefined) {
          // Sub-enrutamiento para Layouts Persistentes (Header/Aside fijos, cambia solo el main)
          const innerOutlet = document.querySelector('.landing-content app-router-outlet') || document.querySelector('.landing-content');
          if (innerOutlet && (pathName === '/landing' || pathName === '/landing/perfil')) {
            if (pathName === '/landing') {
              const homeContent = \`<section class="page-card"><h2>🏠 Inicio de la Landing</h2><p>Bienvenido al módulo principal de la Landing Page construida con componentes reactivos de Autumn.</p></section>\`;
              innerOutlet.innerHTML = homeContent;
            } else {
              innerOutlet.innerHTML = content;
            }
            updateDOM();
            return;
          }

          const outlet = document.querySelector('app-router-outlet') || document.querySelector('main');
          if (outlet) {
            outlet.innerHTML = content;
            updateDOM();
          }
        }
      }

      document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href]');
        if (anchor && anchor.getAttribute('href').startsWith('/')) {
          e.preventDefault();
          const targetUrl = anchor.getAttribute('href');
          window.history.pushState(null, '', targetUrl);
          handleRoute(targetUrl);
        }
      });

      window.addEventListener('popstate', () => {
        handleRoute(window.location.pathname);
      });

      document.addEventListener('DOMContentLoaded', () => {
        handleRoute(window.location.pathname);
        updateDOM();
      });
    })();
  </script>
  `;
    const metadataHtml = [
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        `<title>${title}</title>`,
        description ? `<meta name="description" content="${description}">` : '',
        keywords ? `<meta name="keywords" content="${keywords}">` : '',
        ogImage ? `<meta property="og:image" content="${ogImage}">` : '',
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
    // Envolver internamente <app-component-scan /> dentro de <app-router-outlet>
    if (finalHtml.includes('<app-component-scan') && !finalHtml.includes('<app-router-outlet')) {
        finalHtml = finalHtml.replace(/<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi, `<app-router-outlet>\n${initialRootHtml}\n</app-router-outlet>`);
    }
    else {
        finalHtml = finalHtml.replace(/<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi, initialRootHtml);
    }
    // Inyectar el script cliente fuera de app-router-outlet, justo antes del cierre de </body>
    finalHtml = finalHtml.replace('</body>', `${clientScript}\n</body>`);
    const distDir = path.resolve(process.cwd(), 'dist');
    fs.ensureDirSync(distDir);
    fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
    console.log('🍁 [Autumn TS] ¡Compilación exitosa! Sub-enrutamiento persistente en ./dist/index.html');
}
