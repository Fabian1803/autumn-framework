import fs from 'fs-extra';
import path from 'path';

export interface AtmComponentParsed {
  selector?: string;
  scriptContent: string;
  templateContent: string;
  styleContent: string;
  variables: Record<string, string>;
  methods: Record<string, string>;
}

export function parseAutumnComponent(content: string, filePath?: string): AtmComponentParsed {
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
  } else if (styleTagMatch) {
    styleContent = styleTagMatch[1].trim();
  }

  let templateContent = '';
  const viewFileMatch = content.match(/@View(?:\s+url)?\s*\(\s*["']([^"']+)["']\s*\)/);
  const viewMatch = content.match(/@View[\s\S]*?(?:static|public)?\s+html\s*\(\)\s*\{([\s\S]*?)\}\s*(?=@Style|@Controller|$)/);
  const templateTagMatch = content.match(/<template>([\s\S]*?)<\/template>/);

  if (viewFileMatch) {
    const relPath = viewFileMatch[1];
    const absPath = path.resolve(dirPath, relPath);
    if (fs.existsSync(absPath)) {
      templateContent = fs.readFileSync(absPath, 'utf-8').trim();
    }
  } else if (viewMatch) {
    templateContent = viewMatch[1].replace(/<style>[\s\S]*?<\/style>/gi, '').trim();
  } else if (templateTagMatch) {
    templateContent = templateTagMatch[1].trim();
  }

  const variables: Record<string, string> = {};
  const stateMatches = content.matchAll(/(?:@State|let|const|var)\s+(\w+)\s*=\s*([^;\n]+);/g);
  for (const match of stateMatches) {
    const [_, varName, varValue] = match;
    variables[varName] = varValue.trim();
  }

  const methods: Record<string, string> = {};
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
