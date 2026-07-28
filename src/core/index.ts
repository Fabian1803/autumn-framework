// 🍁 Autumn Framework Core Runtime (autumn-js)

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

// ---------------------------------------------------------------------------
// Contenedor IoC (Inversion of Control)
// ---------------------------------------------------------------------------
class IoCContainer {
  private instances = new Map<any, any>();

  public get<T>(targetClass: new (...args: any[]) => T): T {
    if (!this.instances.has(targetClass)) {
      const instance = new targetClass();
      this.instances.set(targetClass, instance);
    }
    return this.instances.get(targetClass);
  }

  public register<T>(targetClass: new (...args: any[]) => T, instance: T): void {
    this.instances.set(targetClass, instance);
  }
}

export const container = new IoCContainer();

// ---------------------------------------------------------------------------
// Sistema de Reactividad
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyStateChange(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.error('🍁 Error en listener de reactividad Autumn:', e);
    }
  }
}

// ---------------------------------------------------------------------------
// Decoradores de Propiedad (@State, @Autowired)
// ---------------------------------------------------------------------------

/**
 * Decorador @State: Marca una propiedad como reactiva.
 * Al modificar su valor, notifica a la UI para actualizar el DOM.
 */
export function State(target: any, propertyKey: string): void {
  const privateKey = `__state_${propertyKey}`;

  Object.defineProperty(target, propertyKey, {
    get() {
      return this[privateKey];
    },
    set(newValue: any) {
      const oldValue = this[privateKey];
      if (oldValue !== newValue) {
        this[privateKey] = newValue;
        notifyStateChange();
      }
    },
    enumerable: true,
    configurable: true
  });
}

/**
 * Decorador @Autowired: Inyecta automáticamente un Servicio o Store Singleton.
 */
export function Autowired(serviceClass?: any): any {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        const targetType = serviceClass || (typeof Reflect !== 'undefined' && Reflect.getMetadata ? Reflect.getMetadata('design:type', target, propertyKey) : null);
        if (!targetType) {
          throw new Error(`🍁 @Autowired no pudo determinar la clase para '${propertyKey}'. Pasa la clase explícitamente: @Autowired(MiServicio).`);
        }
        return container.get(targetType);
      },
      enumerable: true,
      configurable: true
    });
  };
}

// ---------------------------------------------------------------------------
// Decoradores de Clase (@Controller, @Service, @Injectable, @Store, @Repository, @AutumnApplication)
// ---------------------------------------------------------------------------

export function Controller(target: any): any {
  target.prototype.__isAutumnController = true;
  return target;
}

export function Service(): any {
  return function (target: any) {
    target.prototype.__isAutumnService = true;
    return target;
  };
}

export function Injectable(): any {
  return Service();
}

/**
 * Decorador @Repository: Registra componentes/controladores hijos autorizados.
 */
export function Repository(...components: any[]): any {
  return function (target: any, propertyKey?: string) {
    if (propertyKey) {
      target[propertyKey] = components;
    } else {
      target.prototype.__repositories = components;
    }
  };
}

export const repository = Repository;

/**
 * Decorador @Store: Define una tienda de estado global.
 * Si persist: true, sincroniza automáticamente con localStorage.
 */
export function Store(options: StoreOptions = {}): any {
  return function (target: any) {
    target.prototype.__isAutumnStore = true;
    target.prototype.__storeOptions = options;

    if (options.persist && typeof window !== 'undefined' && window.localStorage) {
      const storeName = options.name || target.name;
      const savedData = localStorage.getItem(`autumn_store_${storeName}`);
      
      const originalConstructor = target;
      const newConstructor: any = function (...args: any[]) {
        const instance = new originalConstructor(...args);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            Object.assign(instance, parsed);
          } catch (e) {
            console.warn(`🍁 Error al restaurar store '${storeName}' de localStorage`);
          }
        }
        
        subscribeToState(() => {
          try {
            localStorage.setItem(`autumn_store_${storeName}`, JSON.stringify(instance));
          } catch (e) {}
        });

        return instance;
      };

      newConstructor.prototype = originalConstructor.prototype;
      return newConstructor;
    }

    return target;
  };
}

/**
 * Decoradores @View y @Style
 */
export function View(viewPathOrTemplate: string): any {
  return function (target: any, propertyKey?: string) {
    if (propertyKey) {
      target[propertyKey] = viewPathOrTemplate;
    } else {
      target.prototype.__viewTemplate = viewPathOrTemplate;
    }
  };
}

export function Style(stylePathOrCss: string): any {
  return function (target: any, propertyKey?: string) {
    if (propertyKey) {
      target[propertyKey] = stylePathOrCss;
    } else {
      target.prototype.__styleCss = stylePathOrCss;
    }
  };
}

/**
 * Decorador @AutumnApplication
 */
export function AutumnApplication(options: AutumnApplicationOptions): any {
  return function (target: any) {
    target.__rootController = options.rootController;
    return target;
  };
}
