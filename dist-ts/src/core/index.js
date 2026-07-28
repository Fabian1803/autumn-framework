// 🍁 Autumn Framework Core Runtime (autumn-js)
// ---------------------------------------------------------------------------
// Contenedor IoC (Inversion of Control)
// ---------------------------------------------------------------------------
class IoCContainer {
    instances = new Map();
    get(targetClass) {
        if (!this.instances.has(targetClass)) {
            const instance = new targetClass();
            this.instances.set(targetClass, instance);
        }
        return this.instances.get(targetClass);
    }
    register(targetClass, instance) {
        this.instances.set(targetClass, instance);
    }
}
export const container = new IoCContainer();
const listeners = new Set();
export function subscribeToState(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function notifyStateChange() {
    for (const listener of listeners) {
        try {
            listener();
        }
        catch (e) {
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
export function State(target, propertyKey) {
    const privateKey = `__state_${propertyKey}`;
    Object.defineProperty(target, propertyKey, {
        get() {
            return this[privateKey];
        },
        set(newValue) {
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
export function Autowired(serviceClass) {
    return function (target, propertyKey) {
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
export function Controller(target) {
    target.prototype.__isAutumnController = true;
    return target;
}
export function Service() {
    return function (target) {
        target.prototype.__isAutumnService = true;
        return target;
    };
}
export function Injectable() {
    return Service();
}
/**
 * Decorador @Repository: Registra componentes/controladores hijos autorizados.
 */
export function Repository(...components) {
    return function (target, propertyKey) {
        if (propertyKey) {
            target[propertyKey] = components;
        }
        else {
            target.prototype.__repositories = components;
        }
    };
}
export const repository = Repository;
/**
 * Decorador @Store: Define una tienda de estado global.
 * Si persist: true, sincroniza automáticamente con localStorage.
 */
export function Store(options = {}) {
    return function (target) {
        target.prototype.__isAutumnStore = true;
        target.prototype.__storeOptions = options;
        if (options.persist && typeof window !== 'undefined' && window.localStorage) {
            const storeName = options.name || target.name;
            const savedData = localStorage.getItem(`autumn_store_${storeName}`);
            const originalConstructor = target;
            const newConstructor = function (...args) {
                const instance = new originalConstructor(...args);
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        Object.assign(instance, parsed);
                    }
                    catch (e) {
                        console.warn(`🍁 Error al restaurar store '${storeName}' de localStorage`);
                    }
                }
                subscribeToState(() => {
                    try {
                        localStorage.setItem(`autumn_store_${storeName}`, JSON.stringify(instance));
                    }
                    catch (e) { }
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
export function View(viewPathOrTemplate) {
    return function (target, propertyKey) {
        if (propertyKey) {
            target[propertyKey] = viewPathOrTemplate;
        }
        else {
            target.prototype.__viewTemplate = viewPathOrTemplate;
        }
    };
}
export function Style(stylePathOrCss) {
    return function (target, propertyKey) {
        if (propertyKey) {
            target[propertyKey] = stylePathOrCss;
        }
        else {
            target.prototype.__styleCss = stylePathOrCss;
        }
    };
}
/**
 * Decorador @AutumnApplication
 */
export function AutumnApplication(options) {
    return function (target) {
        target.__rootController = options.rootController;
        return target;
    };
}
