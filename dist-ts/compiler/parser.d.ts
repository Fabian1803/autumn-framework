export interface AtmComponentParsed {
    selector?: string;
    scriptContent: string;
    templateContent: string;
    styleContent: string;
    variables: Record<string, string>;
    methods: Record<string, string>;
}
export declare function parseAutumnComponent(content: string, filePath?: string): AtmComponentParsed;
