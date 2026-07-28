export { loadApplicationProperties } from './properties.loader.js';
export { parseAutumnComponent } from './parser.js';
export { processControlFlow } from './control-flow.js';
export { generateFinalHtml } from './html-generator.js';
export declare function resolveComponentWithRepositories(compPath: string, combinedVariables: Record<string, any>, combinedStyles: {
    value: string;
}): string;
export declare function loadApplicationRoutes(combinedVariables: Record<string, any>, combinedStyles: {
    value: string;
}): Record<string, string>;
export declare function compileAutumn(entryFile: string): void;
