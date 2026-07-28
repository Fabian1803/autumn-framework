import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const ICON_SVG_MAP = {
    FaUser: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>`,
    FaHome: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16h112a16 16 0 0 0 16-16V344h80v120a16 16 0 0 0 16 16h112a16 16 0 0 0 16-16V300.11l-184.37-151.85a16 16 0 0 0-21.26 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-60.94 0L4.4 251.47a12 12 0 0 0-1.6 16.9l25.5 31.07a12 12 0 0 0 16.9 1.6l235.2-193.75a16 16 0 0 1 21.2 0l235.2 193.75a12 12 0 0 0 16.9-1.6l25.5-31.07a12 12 0 0 0-1.6-16.9z"></path></svg>`,
    FaCog: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-15-2.2l-42.6 24.6c-17.9-15.4-38.6-27.3-61.1-35.1V20c0-5.7-4-10.7-9.6-11.8C274.2 1 237.8 1 202.2 8.2c-5.6 1.1-9.6 6.1-9.6 11.8v49.2c-22.5 7.8-43.2 19.7-61.1 35.1L88.9 80c-5-2.9-11.2-1.9-15 2.2-24.7 26.8-43.6 59-54.7 94.6-1.7 5.4.6 11.2 5.5 14l42.6 24.6c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 15 2.2l42.6-24.6c17.9 15.4 38.6 27.3 61.1 35.1V492c0 5.7 4 10.7 9.6 11.8 35.6 7.2 72 7.2 107.6 0 5.6-1.1 9.6-6.1 9.6-11.8v-49.2c22.5-7.8 43.2-19.7 61.1-35.1l42.6 24.6c5 2.9 11.2 1.9 15-2.2 24.7-26.8 43.6-59 54.7-94.6 1.7-5.4-.6-11.2-5.5-14zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path></svg>`,
    FaLock: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path></svg>`,
    FaBoxes: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M288 0L96 96v256l192 96 192-96V96L288 0zM128 320V128l128-64v192l-128 64zm192 64V192l128-64v192l-128 64z"></path></svg>`,
    FaTruck: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L534 150.1c-9-9-21.2-14.1-33.9-14.1H448V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-144H448V184h52.1l59.9 59.9V320z"></path></svg>`,
    FaArrowLeft: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path></svg>`,
    FaSignOutAlt: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M497 273L329 441c-9 9-25 9-34 0l-17-17c-9-9-9-25 0-34l100-100H160c-13 0-24-11-24-24v-24c0-13 11-24 24-24h218L278 118c-9-9-9-25 0-34l17-17c9-9 25-9 34 0l168 168c10 9 10 25 0 34zM160 416H96c-18 0-32-14-32-32V128c0-18 14-32 32-32h64c13 0 24-11 24-24V48c0-13-11-24-24-24H96C43 24 0 67 0 120v272c0 53 43 96 96 96h64c13 0 24-11 24-24v-24c0-13-11-24-24-24z"></path></svg>`,
    FaRocket: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M505.12 19.1a15.89 15.89 0 0 0-9.34-9.34C423.54-10.54 311.45-1.63 216.74 61.12 165.7 94.94 122.95 141.24 90.7 195.44C71.39 227.94 57.06 263.6 48 300.92l-42.5 17c-8 3.2-9 14.15-1.8 18.65L96 392.47v71.53c0 9.4 10.9 14.7 18.3 8.9l46.7-36.32 55.9 55.9c4.5 7.2 15.45 6.2 18.65-1.8l17-42.5c37.32-9.06 72.98-23.39 105.48-42.7 54.2-32.25 100.5-75 134.34-126.04 62.75-94.71 71.66-206.8 52.85-279.34zM352 192a48 48 0 1 1 48-48 48.05 48.05 0 0 1-48 48z"></path></svg>`
};
export function resolveIconSvg(iconName, importPath) {
    // 1. Si react-icons está instalado en node_modules, intentar resolver dinámicamente el SVG
    if (importPath && importPath.startsWith('react-icons/')) {
        try {
            const subFolder = importPath.split('/')[1]; // ej: 'fa', 'bi', 'tb', 'hi', 'ri'
            const reactIconsLib = require(`react-icons/${subFolder}/index.js`);
            const iconComp = reactIconsLib[iconName];
            if (iconComp) {
                if (typeof iconComp === 'function') {
                    const res = iconComp({});
                    if (res && res.props) {
                        const { attr, children } = res.props;
                        let svgStr = `<svg `;
                        if (attr) {
                            for (const [k, v] of Object.entries(attr)) {
                                svgStr += `${k}="${v}" `;
                            }
                        }
                        svgStr += `style="vertical-align:-0.125em; display:inline-block;" height="1em" width="1em">`;
                        if (Array.isArray(children)) {
                            for (const child of children) {
                                if (child && child.tag) {
                                    svgStr += `<${child.tag} `;
                                    if (child.attr) {
                                        for (const [ck, cv] of Object.entries(child.attr)) {
                                            svgStr += `${ck}="${cv}" `;
                                        }
                                    }
                                    svgStr += `></${child.tag}>`;
                                }
                            }
                        }
                        svgStr += `</svg>`;
                        return svgStr;
                    }
                }
            }
        }
        catch (e) {
            // Fallback si la subcarpeta no existe o react-icons no está instalado
        }
    }
    // 2. Fallback al mapa integrado de SVG si el paquete npm no está instalado aún
    if (ICON_SVG_MAP[iconName]) {
        return ICON_SVG_MAP[iconName];
    }
    return null;
}
