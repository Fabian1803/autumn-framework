import fs from 'fs-extra';
import path from 'path';

export interface AutumnApplicationProperties {
  'server.port'?: number;
  'autumn.application.title'?: string;
  'autumn.metadata.description'?: string;
  'autumn.metadata.keywords'?: string;
  'autumn.metadata.og-image'?: string;
  [key: string]: any;
}

export function loadApplicationProperties(): AutumnApplicationProperties {
  const propsPath = path.resolve(process.cwd(), 'src/application.properties.json');
  if (fs.existsSync(propsPath)) {
    try {
      return fs.readJsonSync(propsPath);
    } catch (e) {
      console.warn('🍁 Warning: Error al leer src/application.properties.json');
    }
  }
  return {};
}
