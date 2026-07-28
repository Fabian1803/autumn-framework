export interface AutumnApplicationProperties {
    'server.port'?: number;
    'autumn.application.title'?: string;
    'autumn.metadata.description'?: string;
    'autumn.metadata.keywords'?: string;
    'autumn.metadata.og-image'?: string;
    [key: string]: any;
}
export declare function loadApplicationProperties(): AutumnApplicationProperties;
