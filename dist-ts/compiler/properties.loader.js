import fs from 'fs-extra';
import path from 'path';
export function loadApplicationProperties() {
    const candidatePaths = [
        path.resolve(process.cwd(), 'src/head.config.json'),
        path.resolve(process.cwd(), 'head.config.json'),
        path.resolve(process.cwd(), 'src/autumn.config.json'),
        path.resolve(process.cwd(), 'autumn.config.json'),
        path.resolve(process.cwd(), 'src/seo.config.json'),
        path.resolve(process.cwd(), 'seo.config.json'),
        path.resolve(process.cwd(), 'src/application.properties.json'),
        path.resolve(process.cwd(), 'application.properties.json')
    ];
    for (const propsPath of candidatePaths) {
        if (fs.existsSync(propsPath)) {
            try {
                return fs.readJsonSync(propsPath);
            }
            catch (e) {
                console.warn(`Warning: Error al leer archivo de configuración en ${propsPath}`);
            }
        }
    }
    return {};
}
