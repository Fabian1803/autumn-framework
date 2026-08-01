# Autumn Framework Support 🍁

Soporte oficial para **Autumn Framework** en Visual Studio Code. Esta extensión proporciona coloreado de sintaxis, snippets rápidos e íconos personalizados para archivos `.atm`.

---

##  Características

### 1. Íconos Tematizados por Archivo
- **`*.controller.atm`**: Ícono exclusivo de controladores Autumn.
- **`*.service.atm` / `*.services.atm`**: Ícono exclusivo de servicios.
- **`*.atm`**: Ícono general de hoja Autumn.

### 2. Resaltado de Sintaxis
Reconocimiento y resaltado de decoradores y palabras clave de Autumn Framework:
- Decoradores: `@Controller`, `@Service`, `@Injectable`, `@Store`, `@Router`, `@AutumnApplication`, `@Autowired`, `@State`, `@repository`, `@View`, `@Style`, `@mapping`, `@Bean`.
- Salidas y etiquetas: `@RouterOutlet`, etiquetas HTML `<... />`.
- Palabras clave: `component`, `children`, `url`, `public`, `private`.
- Sintaxis TypeScript nativa integrada.

### 3. Snippets Rápidos
- **`ccm`**: Genera la estructura de un componente/controlador monolítico (HTML y CSS integrados).
- **`ccn`**: Genera la estructura de un componente/controlador distribuido (`@View public ("./app.html");` y `@Style public ("./App.css");`).

---

## 📦 Instalación

1. Descarga el paquete `.vsix` generado.
2. En VS Code, abre la pestaña de **Extensiones** (`Ctrl + Shift + X`).
3. Haz clic en `...` en la esquina superior derecha y selecciona **Instalar desde VSIX...**.
4. Selecciona el archivo `.vsix`.

---

## 🛠️ Publicación en VS Code Marketplace

Para publicar esta extensión en el VS Code Marketplace usando `vsce`:

```bash
npx vsce publish
```
*(Requiere un Personal Access Token de Azure DevOps configurado).*
