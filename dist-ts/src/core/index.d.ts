declare global {
    namespace Reflect {
        function getMetadata(metadataKey: any, target: Object, propertyKey?: string | symbol): any;
    }
}
export interface StoreOptions {
    name?: string;
    persist?: boolean;
}
export interface AutumnApplicationOptions {
    rootController?: any;
    router?: any;
}
declare class IoCContainer {
    private instances;
    get<T>(targetClass: new (...args: any[]) => T): T;
    register<T>(targetClass: new (...args: any[]) => T, instance: T): void;
}
export declare const container: IoCContainer;
type Listener = () => void;
export declare function subscribeToState(listener: Listener): () => void;
export declare function notifyStateChange(): void;
/**
 * Decorador @State: Marca una propiedad como reactiva.
 */
export declare function State(target: any, propertyKey: string): void;
/**
 * Decorador @Autowired: Inyecta automáticamente un Servicio o Store.
 */
export declare function Autowired(serviceClass?: any): any;
/**
 * Decorador @UrlParam: Captura parámetros dinámicos de URL (ej: /user/:id)
 */
export declare function UrlParam(paramName?: string): any;
export declare function Controller(target: any): any;
export declare function Service(): any;
export declare function Injectable(): any;
export declare function Repository(...components: any[]): any;
export declare const repository: typeof Repository;
/**
 * Decorador @Router y @mapping para enrutamiento
 */
export declare function Router(target: any): any;
export declare function mapping(path: string): any;
export declare const Mapping: typeof mapping;
/**
 * Interceptores base para Seguridad y Logs
 */
export declare class AuthInterceptor {
    static canActivate(): boolean;
}
export declare class LoggingInterceptor {
    static intercept(req: any): void;
}
/**
 * Decorador @Store
 */
export declare function Store(options?: StoreOptions): any;
/**
 * Decoradores @View y @Style
 */
export declare function View(viewPathOrTemplate?: string): any;
export declare function Style(stylePathOrCss?: string): any;
/**
 * Decorador @AutumnApplication
 */
export declare function AutumnApplication(options: AutumnApplicationOptions): any;
export {};
