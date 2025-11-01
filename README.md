# Modern Dashboard Sidebar Application

## Overview

This project provides a sophisticated, modern, and responsive dashboard shell, meticulously engineered to serve as a navigation frame for an existing web application rendered within an `<iframe>`. It features a beautifully redesigned, data-driven sidebar, powerful dynamic theming capabilities, and a clean, scalable architecture built on React, TypeScript, and Tailwind CSS.

The application's core philosophy is configuration-driven development. The entire user interface—from navigation links and user profile details to the complete color scheme—is dynamically generated from a single `settings.json` file. This makes the dashboard incredibly flexible and easy to customize for various branding or white-labeling needs without ever touching the source code.

---

## Key Features

-   **100% Data-Driven Configuration**: The entire UI is dynamically generated from `settings.json`. Modify navigation, add submenus, change the logo, or redefine the entire color palette by editing a single JSON file.

-   **Seamless Iframe Integration**: Acts as an intelligent host for another web application. It securely renders content in an iframe and establishes a clean separation between the navigation shell and the core application content.

-   **Advanced Routing & Deep-Linking**: The application intelligently parses the browser's URL hash (`#`) and passes both query parameters (`?`) and internal hash fragments directly to the embedded iframe. This enables seamless deep-linking into specific states or pages of the hosted application (e.g., `/#/my-services.html?id=123#details`).

-   **Dynamic Theming & On-the-Fly Branding**: This is the application's most powerful feature. You can override theme colors and the main logo in real-time simply by providing URL query parameters. This is perfect for client demos, A/B testing different brand aesthetics, or deploying white-labeled instances of your application.

-   **Fully Responsive & Accessible Design**:
    -   **Desktop**: A collapsible sidebar with an elegant hover-to-expand feature, maximizing screen real estate.
    -   **Mobile**: A sleek, slide-in overlay menu, providing a native-app-like experience.
    -   ARIA attributes are used to ensure accessibility.

-   **State Persistence**: User preferences, such as the sidebar's expanded/collapsed state and which submenus are open, are saved to `localStorage`. This provides a consistent and personalized user experience across sessions.

-   **Secure by Design**: A configurable domain whitelist for iframe content prevents the dashboard from being used to embed unauthorized or malicious websites, mitigating clickjacking risks.

---

## How It Works: A Technical Deep Dive

The application follows a modern component-based architecture with a clear data flow.

1.  **Settings Provider**: On startup, the `SettingsContext` fetches `/settings.json`.
2.  **Dynamic Overrides**: Before storing the settings, it scans the URL for specific query parameters (e.g., `?primary=...&logoUrl=...`) and merges them into the configuration. This allows for on-the-fly customization.
3.  **Theme Injection**: The finalized theme colors are injected as CSS Custom Properties (variables) into the root HTML element, making them globally available to Tailwind CSS.
4.  **Component Rendering**: The `AppLayout` component consumes the settings to render the `Sidebar` and `PageContent`.
5.  **Routing**: The `useLocation` hook listens for `hashchange` events. When the URL hash changes, the `PageContent` component finds the corresponding navigation item in the settings.
6.  **Iframe Update**: It constructs the secure `iframeUrl`, appends any necessary parameters or hashes from the main URL, and updates the `<iframe>`'s `src` attribute, triggering the content to load.

---

## File Structure

The project is organized for clarity and maintainability:

```
.
├── public/
│   └── settings.json       # The single source of truth for all app configuration.
├── src/
│   ├── components/
│   │   ├── Icon.tsx        # Dynamically renders Lucide icons based on a string name.
│   │   ├── Sidebar.tsx     # The main sidebar component, handles responsive logic and state.
│   │   └── SidebarItem.tsx # Renders individual links, headers, and submenus.
│   ├── contexts/
│   │   └── SettingsContext.tsx # Fetches, stores, overrides, and provides settings globally.
│   ├── hooks/
│   │   └── useLocation.ts  # A simple hook to track the URL hash for client-side routing.
│   ├── App.tsx             # The main application component, orchestrates layout and content.
│   ├── index.tsx           # The entry point for the React application.
│   ├── constants.ts        # Maps icon string names to their Lucide-React components.
│   └── types.ts            # TypeScript type definitions for the entire application.
├── index.html              # The HTML shell, includes Tailwind CSS configuration via CDN.
├── CONTEXT.md              # In-depth guide for converting this app to Vanilla JS.
└── README.md               # This documentation file.
```

---

## Configuration (`settings.json`)

This file is the heart of the application. Below is a detailed breakdown.

### `theme`

An object defining the application's color scheme using HSL values. These are injected as CSS variables (e.g., `--color-primary`).

```json
"theme": {
  "primary": "hsl(220, 13%, 61%)",         // Main interactive elements
  "primary-foreground": "hsl(210, 40%, 98%)", // Text on primary elements
  "secondary": "hsl(210, 40%, 96.1%)",       // Background colors
  // ... and so on
}
```

### `security`

Defines security policies.

-   `allowedIframeDomains`: An array of strings. The application will **only** load iframe content from these domains or their subdomains. This is a critical security feature.

```json
"security": {
  "allowedIframeDomains": ["mypancho.com"]
}
```

### `sidebar`

Configures the entire sidebar's appearance and behavior.

-   `defaultState`: `"expanded"` or `"collapsed"`. The initial sidebar state for a first-time user on a desktop device.
-   `logoUrl`: URL for the logo at the top of the sidebar.
-   `profile`: Defines the user profile link at the bottom of the sidebar.
-   `navItems`: An array defining the sidebar's navigation structure. It supports three item types:
    1.  **`link`**: A standard clickable navigation link.
        -   `href`: The unique hash route (e.g., `"#/my-services.html"`).
        -   `label`: The display text.
        -   `icon`: The name of the icon from `constants.ts`.
        -   `iframeUrl`: The URL to load in the iframe for this link.
    2.  **`header`**: A non-clickable text label to group sections of links.
    3.  **`submenu`**: A collapsible group of `link` items.
        - `path`: A unique string ID for remembering its open/closed state.

---

## Dynamic Theming & Branding via URL Parameters

Leverage the dynamic override system for powerful on-the-fly customizations.

### How It Works

The `SettingsContext` automatically parses query parameters from the URL. If a parameter name **exactly matches** a key within the `theme` object (e.g., `primary`) or the special `logoUrl` key, it will use the parameter's value instead of the one from `settings.json`.

### Examples

Assume your app is at `https://app.example.com/`.

**1. Change the Primary Color to a vibrant purple:**
*Note: Special characters must be URL-encoded. `hsl(260, 100%, 60%)` becomes `hsl(260, 100%25, 60%25)`.*

> `https://app.example.com/?primary=hsl(260, 100%25, 60%25)`

**2. Use a different logo for a specific client:**

> `https://app.example.com/?logoUrl=https://clientsite.com/logo.svg`

**3. Combine multiple overrides for a complete re-brand:**

> `https://app.example.com/?primary=hsl(10, 80%25, 50%25)&border=hsl(10, 30%25, 85%25)&logoUrl=https://another-brand.com/logo.png`

This feature is ideal for sales demonstrations, providing personalized client portals, or internal testing.

---

## Extending the App

### Adding a New Icon

1.  Open `src/constants.ts`.
2.  Import the desired icon from the `lucide-react` library (e.g., `import { Zap } from 'lucide-react'`).
3.  Add the imported icon component to the `iconMap` object (e.g., `Zap`).
4.  You can now use the string `"Zap"` as an `icon` value in `settings.json`.
