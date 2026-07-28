export interface AtmComponentParsed {
    selector?: string;
    scriptContent: string;
    templateContent: string;
    styleContent: string;
    variables: Record<string, string>;
    methods: Record<string, string>;
}
export interface AutumnApplicationProperties {
    'server.port'?: number;
    'autumn.application.title'?: string;
    'autumn.metadata.description'?: string;
    'autumn.metadata.keywords'?: string;
    'autumn.metadata.og-image'?: string;
    [key: string]: any;
}
export declare function loadApplicationProperties(): AutumnApplicationProperties;
export declare function parseAutumnComponent(content: string, filePath?: string): AtmComponentParsed;
export declare function compileAutumn(entryFile: string): void;
