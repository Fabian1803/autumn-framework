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
    rootController: any;
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
 * Al modificar su valor, notifica a la UI para actualizar el DOM.
 */
export declare function State(target: any, propertyKey: string): void;
/**
 * Decorador @Autowired: Inyecta automáticamente un Servicio o Store Singleton.
 */
export declare function Autowired(serviceClass?: any): any;
export declare function Controller(target: any): any;
export declare function Service(): any;
export declare function Injectable(): any;
/**
 * Decorador @Repository: Registra componentes/controladores hijos autorizados.
 */
export declare function Repository(...components: any[]): any;
export declare const repository: typeof Repository;
/**
 * Decorador @Store: Define una tienda de estado global.
 * Si persist: true, sincroniza automáticamente con localStorage.
 */
export declare function Store(options?: StoreOptions): any;
/**
 * Decoradores @View y @Style
 */
export declare function View(viewPathOrTemplate: string): any;
export declare function Style(stylePathOrCss: string): any;
/**
 * Decorador @AutumnApplication
 */
export declare function AutumnApplication(options: AutumnApplicationOptions): any;
export {};
