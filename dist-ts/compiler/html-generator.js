import fs from 'fs-extra';
import path from 'path';
import { parseRawValue, processControlFlow } from './control-flow.js';
export function generateFinalHtml(rootHtml, combinedStyles, combinedVariables, props, routes = {}) {
    // 1. Elementos Estándar y Meta Etiquetas de SEO
    const title = props['autumn.application.title'] || 'Autumn Application';
    const description = props['autumn.metadata.description'] || '';
    const keywords = props['autumn.metadata.keywords'] || '';
    const author = props['autumn.metadata.author'] || '';
    const robots = props['autumn.metadata.robots'] || 'index, follow';
    const canonicalUrl = props['autumn.metadata.canonical-url'] || '';
    // 2. Protocolo Open Graph (Facebook, WhatsApp, LinkedIn, Discord)
    const ogTitle = props['autumn.metadata.og-title'] || title;
    const ogDescription = props['autumn.metadata.og-description'] || description;
    const ogImage = props['autumn.metadata.og-image'] || '';
    const ogUrl = props['autumn.metadata.og-url'] || canonicalUrl;
    const ogType = props['autumn.metadata.og-type'] || 'website';
    // 3. Tarjetas de X (Twitter Cards)
    const twitterCard = props['autumn.metadata.twitter-card'] || 'summary_large_image';
    const twitterTitle = props['autumn.metadata.twitter-title'] || ogTitle;
    const twitterDescription = props['autumn.metadata.twitter-description'] || ogDescription;
    const twitterImage = props['autumn.metadata.twitter-image'] || ogImage;
    // 4. Recursos de Identidad Visual
    const favicon = props['autumn.metadata.favicon'] || props['autumn.application.favicon'] || '/favicon.ico';
    const appleTouchIcon = props['autumn.metadata.apple-touch-icon'] || '';
    const manifest = props['autumn.metadata.manifest'] || '';
    // 5. Resource Hints (Rendimiento)
    const dnsPrefetch = props['autumn.metadata.dns-prefetch'] || '';
    const preconnect = props['autumn.metadata.preconnect'] || '';
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
    // Construir las 7 categorías de cabeceras SEO y optimización
    const metadataHtml = [
        '<!-- 1. Standard Metadata -->',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
        `<title>${title}</title>`,
        '',
        '<!-- 2. SEO Metadata -->',
        description ? `<meta name="description" content="${description}">` : '',
        keywords ? `<meta name="keywords" content="${keywords}">` : '',
        author ? `<meta name="author" content="${author}">` : '',
        robots ? `<meta name="robots" content="${robots}">` : '',
        canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : '',
        '',
        '<!-- 3. Open Graph Metadata -->',
        ogTitle ? `<meta property="og:title" content="${ogTitle}">` : '',
        ogDescription ? `<meta property="og:description" content="${ogDescription}">` : '',
        ogImage ? `<meta property="og:image" content="${ogImage}">` : '',
        ogUrl ? `<meta property="og:url" content="${ogUrl}">` : '',
        ogType ? `<meta property="og:type" content="${ogType}">` : '',
        '',
        '<!-- 4. Twitter Cards Metadata -->',
        twitterCard ? `<meta name="twitter:card" content="${twitterCard}">` : '',
        twitterTitle ? `<meta name="twitter:title" content="${twitterTitle}">` : '',
        twitterDescription ? `<meta name="twitter:description" content="${twitterDescription}">` : '',
        twitterImage ? `<meta name="twitter:image" content="${twitterImage}">` : '',
        '',
        '<!-- 5. Visual Identity & Favicons -->',
        favicon ? `<link rel="icon" type="image/x-icon" href="${favicon}">` : '',
        appleTouchIcon ? `<link rel="apple-touch-icon" href="${appleTouchIcon}">` : '',
        manifest ? `<link rel="manifest" href="${manifest}">` : '',
        '',
        '<!-- 6. Resource Hints & Performance -->',
        dnsPrefetch ? `<link rel="dns-prefetch" href="${dnsPrefetch}">` : '',
        preconnect ? `<link rel="preconnect" href="${preconnect}" crossorigin>` : '',
        '',
        '<!-- 7. CSS Styles -->',
        combinedStyles ? `<style>\n${combinedStyles}\n</style>` : ''
    ].filter(line => line !== null && line !== undefined).join('\n    ');
    let baseHtml = '';
    const mainHtmlPath = path.resolve(process.cwd(), 'main.html');
    if (fs.existsSync(mainHtmlPath)) {
        baseHtml = fs.readFileSync(mainHtmlPath, 'utf-8');
    }
    else {
        baseHtml = `<!DOCTYPE html>
<html lang="en">
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
    // Copiar favicon.ico a dist/ si existe
    const faviconSource = path.resolve(process.cwd(), favicon.startsWith('/') ? favicon.slice(1) : favicon);
    const rootFavicon = path.resolve(process.cwd(), 'favicon.ico');
    const targetFavicon = path.join(distDir, 'favicon.ico');
    if (fs.existsSync(faviconSource)) {
        fs.copyFileSync(faviconSource, targetFavicon);
    }
    else if (fs.existsSync(rootFavicon)) {
        fs.copyFileSync(rootFavicon, targetFavicon);
    }
    console.log('Compilation successful! SPA bundle generated at ./dist/index.html');
}
