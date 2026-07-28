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
