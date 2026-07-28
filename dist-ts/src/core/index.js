// Servicio Nativo de Cookies y Seguridad (AutumnCookie)
export class AutumnCookie {
    static get(name) {
        if (typeof document === 'undefined')
            return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2)
            return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        return null;
    }
    static set(name, value, days = 1) {
        if (typeof document === 'undefined')
            return;
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }
    static remove(name) {
        if (typeof document === 'undefined')
            return;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}
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
            console.error('Error en listener de reactividad Autumn:', e);
        }
    }
}
// Decoradores de Propiedad y Clase (@State, @Autowired, @UrlParam)
/**
 * Decorador @State: Marca una propiedad como reactiva.
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
 * Decorador @Autowired: Inyecta automáticamente un Servicio o Store.
 */
export function Autowired(serviceClass) {
    return function (target, propertyKey) {
        Object.defineProperty(target, propertyKey, {
            get() {
                const targetType = serviceClass || (typeof Reflect !== 'undefined' && Reflect.getMetadata ? Reflect.getMetadata('design:type', target, propertyKey) : null);
                if (!targetType) {
                    throw new Error(`@Autowired no pudo determinar la clase para '${propertyKey}'. Pasa la clase explícitamente: @Autowired(MiServicio).`);
                }
                return container.get(targetType);
            },
            enumerable: true,
            configurable: true
        });
    };
}
/**
 * Decorador @UrlParam: Captura parámetros dinámicos de URL (ej: /user/:id)
 */
export function UrlParam(paramName) {
    return function (target, propertyKey) {
        if (propertyKey) {
            target[propertyKey] = paramName;
        }
        else {
            target.prototype.__urlParam = paramName;
        }
    };
}
// Decoradores de Clase (@Controller, @Service, @Injectable, @Store, @Repository, @Router, @mapping)
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
 * Decorador @Router y @mapping para enrutamiento
 */
export function Router(target) {
    target.prototype.__isAutumnRouter = true;
    return target;
}
export function mapping(path) {
    return function (target, propertyKey, descriptor) {
        if (!target.__routes) {
            target.__routes = [];
        }
        target.__routes.push({ path, method: propertyKey });
    };
}
export const Mapping = mapping;
/**
 * Interceptores base para Seguridad y Logs
 */
export class AuthInterceptor {
    static canActivate() {
        return Boolean(AutumnCookie.get('autumn_token'));
    }
}
export class LoggingInterceptor {
    static intercept(req) {
        console.log('Route Access Logged');
    }
}
/**
 * Decorador @Store
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
                        console.warn(`Error al restaurar store '${storeName}' de localStorage`);
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
        target.__router = options.router;
        return target;
    };
}
