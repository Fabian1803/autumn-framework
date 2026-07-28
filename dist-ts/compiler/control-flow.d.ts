export declare function parseRawValue(raw: string | undefined): any;
/**
 * Extrae un bloque de llaves { ... } balanceando llaves de apertura y cierre anidadas.
 */
export declare function extractBalancedBlock(text: string, startIndex: number): {
    body: string;
    startIndex: number;
    endIndex: number;
} | null;
export declare function processControlFlow(html: string, variables: Record<string, any>): string;
