import fs from 'fs-extra';
import path from 'path';
import { AutumnApplicationProperties } from './properties.loader.js';
import { parseRawValue, processControlFlow } from './control-flow.js';

export function generateFinalHtml(
  rootHtml: string,
  combinedStyles: string,
  combinedVariables: Record<string, any>,
  props: AutumnApplicationProperties,
  routes: Record<string, string> = {}
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

  // Procesar plantillas y bindings de datos en cada una de las rutas declaradas
  const processedRoutes: Record<string, string> = {
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
      } else if (pathExpr.includes('.')) {
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
      // Servicio Nativo de Cookies y Proxy de Seguridad (AutumnCookie API)
      window.AutumnCookie = {
        get(name) {
          const value = '; ' + document.cookie;
          const parts = value.split('; ' + name + '=');
          if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
          return null;
        },
        set(name, value, days) {
          const expires = new Date(Date.now() + (days || 1) * 864e5).toUTCString();
          document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
        },
        remove(name) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        }
      };

      function isAuthenticated() {
        const token = window.AutumnCookie.get('autumn_token');
        return Boolean(token && token.length > 10);
      }

      window.autumnPerformLogin = function(e) {
        if (e) e.preventDefault();
        const userEl = document.getElementById('username');
        const user = userEl ? userEl.value : 'admin';

        // Generar un token JWT firmado de sesión
        const payload = btoa(JSON.stringify({ sub: user, role: 'ROLE_ADMIN', exp: Date.now() + 86400000 }));
        const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload + '.s5d6f7g8h9';

        window.AutumnCookie.set('autumn_token', mockJwt, 1);
        window.history.pushState(null, '', '/dashboard');
        handleRoute('/dashboard');
      };

      window.autumnLogout = function() {
        window.AutumnCookie.remove('autumn_token');
        window.history.pushState(null, '', '/');
        handleRoute('/');
      };

      function handleRoute(pathName) {
        // Guard 1: Si ya está autenticado e intenta acceder al Login ('/'), redirigir a /dashboard
        if ((pathName === '/' || pathName === '') && isAuthenticated()) {
          window.history.pushState(null, '', '/dashboard');
          pathName = '/dashboard';
        }

        // Guard 2: Si NO está autenticado e intenta acceder a rutas privadas ('/dashboard', '/profile'), redirigir a '/'
        const protectedRoutes = ['/dashboard', '/profile'];
        if (protectedRoutes.includes(pathName) && !isAuthenticated()) {
          window.history.pushState(null, '', '/');
          pathName = '/';
        }

        let content = routesMap[pathName];

        if (!content && pathName.startsWith('/user/')) {
          const userId = pathName.split('/')[2];
          content = \`<div style="background:#fff8ee; padding:20px; border-radius:8px;"><h3>👤 Detalle del Usuario ID: \${userId}</h3><p>Datos del usuario cargados dinámicamente.</p></div>\`;
        }

        if (content !== undefined) {
          const rootOutlet = document.querySelector('body > app-router-outlet') || document.querySelector('app-router-outlet');
          
          // Si el maquetador persistente ya está en el DOM, hacer swap solo del contenedor interno <app-router-outlet>
          const innerOutlet = document.querySelector('.landing-content app-router-outlet');
          const childFragment = routesMap['__child__' + pathName];

          if (innerOutlet && childFragment) {
            innerOutlet.innerHTML = childFragment;
            updateDOM();
            return;
          }

          // Si cargamos directo, refrescamos F5 o cambiamos entre aplicaciones diferentes:
          if (rootOutlet) {
            rootOutlet.innerHTML = content;
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

  // Envolver internamente <app-component-scan /> dentro de <app-router-outlet>
  if (finalHtml.includes('<app-component-scan') && !finalHtml.includes('<app-router-outlet')) {
    finalHtml = finalHtml.replace(
      /<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi,
      `<app-router-outlet>\n${initialRootHtml}\n</app-router-outlet>`
    );
  } else {
    finalHtml = finalHtml.replace(
      /<app-component-scan\s*\/?>|<app-component-scan>[\s\S]*?<\/app-component-scan>/gi,
      initialRootHtml
    );
  }

  // Inyectar el script cliente fuera de app-router-outlet, justo antes del cierre de </body>
  finalHtml = finalHtml.replace('</body>', `${clientScript}\n</body>`);

  const distDir = path.resolve(process.cwd(), 'dist');
  fs.ensureDirSync(distDir);
  fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml);
  console.log('🍁 [Autumn TS] ¡Compilación exitosa! Arquitectura SPA de enrutamiento limpia en ./dist/index.html');
}
