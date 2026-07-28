# Autumn Framework 🍁

Next-Generation Enterprise Web Framework for TypeScript based on Single File Components, Reactive State, Declarative Routing, Native Cookie Security, and Built-in SEO.

---

## ⚡ Quick Start

### 1. Initialize a Project
```bash
npx autumn-framework init my-app
cd my-app
```

### 2. Start Development Server
```bash
npx autumn-framework dev
```
Open your browser at `http://localhost:3200`.

### 3. Production Build
```bash
npx autumn-framework build
```
Generates an optimized static bundle at `./dist/index.html`.

---

## 📂 Project Structure

```text
my-app/
├── app/
│   ├── app.controller.atm     # Main Component Controller
│   ├── app.html                # Component Template
│   └── app.css                 # Component Styles
├── head.config.json            # SEO & Head Metadata Config
├── applicationRoutes.atm       # Declarative SPA Router Config
├── main.html                   # HTML Shell Shell (<app-component-scan />)
└── favicon.ico                 # App Icon
```

---

## 📑 Decorators & Annotations Reference

### Core Component Decorators
- **`@Controller`**: Marks a class as a Single File Component or View Controller in Autumn IoC container.
- **`@View(pathOrTemplate?)`**: Defines the HTML template for the component. Can link to an external file (e.g. `@View('./app.html')`) or decorate a method `html()`.
- **`@Style(pathOrCss?)`**: Defines the CSS styles for the component. Can link to an external file (e.g. `@Style('./app.css')`) or decorate a method `css()`.
- **`@repository(...components)`**: Registers child components or imported `react-icons` for use inside the HTML template.

### State & Dependency Injection Decorators
- **`@State`**: Declares a reactive property. When its value changes, all bound DOM elements (`{this.prop}` or `data-autumn-bind`) update automatically.
- **`@Service()`**: Marks a class as a injectable business logic service within the IoC container.
- **`@Autowired(ServiceClass?)`**: Injects a Service or Store dependency into a controller or service class.
- **`@Store(options?)`**: Declares a reactive state store with optional `persist: true` for automatic `localStorage` synchronization.

### Routing Decorators
- **`@Router`**: Marks a class as the declarative application router configuration.
- **`@mapping(path)`**: Maps a URL path to a target component controller (e.g., `@mapping("/dashboard")`).
- **`@UrlParam(paramName?)`**: Captures dynamic URL parameters from the path (e.g., `/user/:id`).

---

## 🔁 Template Control Flow Directives

- **`@if (condition) { ... } @else { ... }`**: Renders blocks conditionally based on state expressions.
- **`@for (item of list; track item) { ... } @empty { ... }`**: Loops over iterable data lists and renders an optional fallback block if the list is empty.
- **`@this.property && { ... }`**: Renders a block via short-circuit evaluation when a boolean or list length expression is truthy.
- **`@RouterOutlet`**: Defines the outlet container inside a persistent parent layout where nested child routes (`children`) are swapped dynamically.

---

## 🎨 React-Icons Vector Translator

Imports from `react-icons` (`react-icons/fa`, `react-icons/bi`, `react-icons/tb`, etc.) registered inside `@repository(...)` are automatically translated into **pure inline SVG elements** at compile time with zero JavaScript runtime overhead.

```typescript
import { Controller, View, Style, repository } from 'autumn-js';
import { FaHome, FaUser } from 'react-icons/fa';

@Controller
export class AsideController {
    @repository(FaHome, FaUser)
    @View('./aside.html')
    @Style('./aside.css')
}
```

---

## 🛡️ Security & Cookie API (`AutumnCookie`)

- **`AutumnCookie.set(name, value, days)`**: Sets a session cookie with `SameSite=Lax` and expiration.
- **`AutumnCookie.get(name)`**: Reads a cookie value by key.
- **`AutumnCookie.remove(name)`**: Deletes a session cookie on logout.
- **`AuthInterceptor`**: Security guard used in `private component` route declarations to block unauthorized access to private views.

---

## 🌐 Head Metadata (`head.config.json`)

Configures 7 master categories of `<head>` tags:
1. **Standard**: Title, Charset, Viewport.
2. **SEO**: Description, Keywords, Author, Robots, Canonical URL.
3. **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`.
4. **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
5. **Visual Identity**: Favicon, Apple Touch Icon, Manifest.
6. **Resource Hints**: `dns-prefetch`, `preconnect`.
7. **CSS**: Embedded styles.

---

## 🛠️ CLI Commands Reference

| Command | Description |
| :--- | :--- |
| `npx autumn-framework init <name>` | Interactively creates a new clean project structure |
| `npx autumn-framework dev` | Starts the hot-reloading development server on port 3200 |
| `npx autumn-framework build` | Compiles the static production bundle into `./dist/index.html` |

---

## 📄 License
Distributed under the ISC License. Built with ❤️ for modern TypeScript developers.
