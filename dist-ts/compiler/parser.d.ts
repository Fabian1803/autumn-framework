export interface AtmComponentParsed {
    selector?: string;
    scriptContent: string;
    templateContent: string;
    styleContent: string;
    variables: Record<string, string>;
    methods: Record<string, string>;
}
export declare function extractBalancedBlock(text: string, startIndex: number): {
    body: string;
    startIndex: number;
    endIndex: number;
} | null;
export declare function parseAutumnComponent(content: string, filePath?: string): AtmComponentParsed;
