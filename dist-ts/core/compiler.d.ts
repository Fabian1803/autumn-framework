export interface AtmComponentParsed {
    scriptContent: string;
    templateContent: string;
    styleContent: string;
    variables: Record<string, string>;
}
export declare function parseAutumnComponent(content: string): AtmComponentParsed;
export declare function compileAutumn(filePath: string): void;
