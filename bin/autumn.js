#!/usr/bin/env node
import path from 'path';
import fs from 'fs-extra';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2] || 'dev';

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function run() {
  const distDevPath = path.resolve(__dirname, '../dist-ts/dev.js');
  const distCompilerPath = path.resolve(__dirname, '../dist-ts/compiler.js');

  if (command === 'init' || command === 'create') {
    let projectName = process.argv[3];

    if (!projectName) {
      projectName = await askQuestion('What is your project name? (e.g., my-autumn-app): ');
    }

    if (!projectName) {
      projectName = 'my-autumn-app';
    }

    const targetDir = projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName);
    fs.ensureDirSync(targetDir);

    console.log(`\nCreating Autumn project structure at: ${targetDir}\n`);

    // 1. Create /app directory
    const appDir = path.join(targetDir, 'app');
    fs.ensureDirSync(appDir);

    // app/app.controller.atm
    const appControllerPath = path.join(appDir, 'app.controller.atm');
    if (!fs.existsSync(appControllerPath)) {
      fs.writeFileSync(appControllerPath, `import { Controller, View, Style } from 'autumn-js';

@Controller
export class AppController {
    @View('./app.html')
    @Style('./app.css')
}
`);
      console.log('  [CREATED] /app/app.controller.atm');
    }

    // app/app.html
    const appHtmlPath = path.join(appDir, 'app.html');
    if (!fs.existsSync(appHtmlPath)) {
      fs.writeFileSync(appHtmlPath, `<div class="autumn-hero">
    <div class="hero-card">
        <div class="brand-header">
            <img src="/favicon.ico" class="app-logo" alt="Autumn Logo" />
            <h1>Autumn Framework</h1>
        </div>
        <p class="tagline">Next-Generation Single File Component Framework for TypeScript</p>
        <div class="hero-actions">
            <a href="https://autumnframework.dev" target="_blank" class="btn btn-primary">Documentation</a>
            <a href="https://github.com" target="_blank" class="btn btn-secondary">GitHub Repository</a>
        </div>
        <div class="features-grid">
            <div class="feature-card">
                <h3>Ultra-Fast SPA</h3>
                <p>Lightning-quick client-side routing with persistent layout swapping.</p>
            </div>
            <div class="feature-card">
                <h3>Single File Architecture</h3>
                <p>Declarative Controller, View and Style definitions in TypeScript.</p>
            </div>
            <div class="feature-card">
                <h3>Native Token Auth</h3>
                <p>Built-in Cookie management and route interceptor guards.</p>
            </div>
        </div>
    </div>
</div>
`);
      console.log('  [CREATED] /app/app.html');
    }

    // app/app.css
    const appCssPath = path.join(appDir, 'app.css');
    if (!fs.existsSync(appCssPath)) {
      fs.writeFileSync(appCssPath, `body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.autumn-hero {
    width: 100%;
    max-width: 900px;
    padding: 40px 20px;
    box-sizing: border-box;
}

.hero-card {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 50px 40px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.brand-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 12px;
}

.app-logo {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 4px 12px rgba(230, 126, 34, 0.4));
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
}

.brand-header h1 {
    font-size: 36px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.tagline {
    font-size: 18px;
    color: #94a3b8;
    margin-top: 0;
    margin-bottom: 32px;
}

.hero-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 48px;
}

.btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    text-decoration: none;
    transition: all 0.2s ease;
}

.btn-primary {
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(234, 88, 12, 0.5);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    text-align: left;
}

.feature-card {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 14px;
    padding: 24px;
    transition: border-color 0.2s ease;
}

.feature-card:hover {
    border-color: rgba(249, 115, 22, 0.4);
}

.feature-card h3 {
    margin-top: 0;
    font-size: 16px;
    color: #f1f5f9;
    margin-bottom: 8px;
}

.feature-card p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
}
`);
      console.log('  [CREATED] /app/app.css');
    }

    // 2. Create head.config.json
    const headConfigPath = path.join(targetDir, 'head.config.json');
    if (!fs.existsSync(headConfigPath)) {
      fs.writeFileSync(headConfigPath, `{
    "autumn.application.title": "${projectName}",
    "autumn.metadata.description": "Professional web application built with Autumn Framework.",
    "autumn.metadata.keywords": "autumn, typescript, sfc, reactive",
    "autumn.metadata.favicon": "/favicon.ico"
}
`);
      console.log('  [CREATED] head.config.json');
    }

    // 3. Create applicationRoutes.atm
    const routesPath = path.join(targetDir, 'applicationRoutes.atm');
    if (!fs.existsSync(routesPath)) {
      fs.writeFileSync(routesPath, `import { Router, mapping } from 'autumn-js';

@Router
export class ApplicationRoutes {
    @mapping("/")
    public component AppController('./app/app.controller.atm') {};
}
`);
      console.log('  [CREATED] applicationRoutes.atm');
    }

    // 4. Create main.html
    const mainHtmlPath = path.join(targetDir, 'main.html');
    if (!fs.existsSync(mainHtmlPath)) {
      fs.writeFileSync(mainHtmlPath, `<!DOCTYPE html>
<html lang="en">
<head>
    <app-context-metadata />
</head>
<body>
    <app-component-scan />
</body>
</html>
`);
      console.log('  [CREATED] main.html');
    }

    // 5. Create favicon.ico
    const faviconPath = path.join(targetDir, 'favicon.ico');
    if (!fs.existsSync(faviconPath)) {
      const rootFavicon = path.resolve(process.cwd(), 'favicon.ico');
      if (fs.existsSync(rootFavicon)) {
        fs.copyFileSync(rootFavicon, faviconPath);
      } else {
        fs.writeFileSync(faviconPath, '');
      }
      console.log('  [CREATED] favicon.ico');
    }

    // 6. Create package.json
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      fs.writeFileSync(packageJsonPath, JSON.stringify({
        name: projectName,
        version: "1.0.0",
        type: "module",
        scripts: {
          "dev": "autumn dev",
          "build": "autumn build"
        },
        dependencies: {
          "autumn-framework": "^1.0.0"
        }
      }, null, 2));
      console.log('  [CREATED] package.json');
    }

    console.log(`\nProject '${projectName}' created successfully!\n`);
    console.log(`  cd ${projectName}`);
    console.log(`  npx autumn dev\n`);
    return;
  }

  if (command === 'build') {
    console.log('Starting Autumn Framework production build...');
    if (fs.existsSync(distCompilerPath)) {
      const { compileAutumn, getEntryFile } = await import(`file://${distCompilerPath}`);
      const entryFile = getEntryFile ? getEntryFile() : path.resolve(process.cwd(), 'app/app.controller.atm');
      compileAutumn(entryFile);
    } else {
      console.error('Error: Compiled build module not found at dist-ts/compiler.js. Run npm run build first.');
    }
    return;
  }

  // Default command: dev
  if (fs.existsSync(distDevPath)) {
    const { startDevServer } = await import(`file://${distDevPath}`);
    startDevServer();
  } else {
    try {
      const { startDevServer } = await import('../dev.js');
      startDevServer();
    } catch (err) {
      console.error('Error starting Autumn development server:', err);
    }
  }
}

run();