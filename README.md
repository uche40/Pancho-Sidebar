# Modern Dashboard Sidebar Application

## Overview

This project is a modern, responsive dashboard shell designed to act as a navigation frame for an existing web application, which is rendered inside an `<iframe>`. It features a beautifully redesigned, data-driven sidebar, dynamic theming capabilities, and a clean, component-based architecture using React, TypeScript, and Tailwind CSS.

The entire application, from navigation links to theme colors, is configured through a single `settings.json` file, making it incredibly flexible and easy to customize without touching the source code.

---

## Key Features

- **Data-Driven Configuration**: The entire UI, including navigation, profile links, and theme, is dynamically generated from `settings.json`.
- **Seamless Iframe Integration**: Acts as a smart host for another web application, securely rendering content in an iframe.
- **Advanced Routing**: Intelligently passes URL parameters (`?`) and hash fragments (`#`) from the browser's address bar directly to the embedded iframe, allowing for deep-linking into the hosted content.
- **Dynamic Theming & Branding**: The most powerful feature of this application. You can override theme colors and the main logo on-the-fly simply by providing URL query parameters. This is perfect for client demos, white-labeling, or testing different brand aesthetics.
- **Fully Responsive Design**: A collapsible desktop sidebar with hover-to-expand functionality and a sleek, slide-in overlay menu for mobile devices.
- **State Persistence**: The user's preference for the sidebar state (expanded/collapsed) and open submenus is saved in `localStorage`, providing a consistent experience across sessions.
- **Secure**: Implements a domain whitelist for iframe content to prevent unauthorized embedding.

---

## File Structure

The project is organized into a clean and logical structure:

```
.
├── public/
│   └── settings.json       # The single source of truth for all app configuration.
├── src/
│   ├── components/
│   │   ├── Icon.tsx        # Dynamically renders icons based on a string name.
│   │   ├── Sidebar.tsx     # The main sidebar component, handles responsive logic.
│   │   └── SidebarItem.tsx # Renders individual links, headers, and submenus.
│   ├── contexts/
│   │   └── SettingsContext.tsx # Manages fetching, storing, and overriding settings.
│   ├── hooks/
│   │   └── useLocation.ts  # A simple hook to track the URL hash for routing.
│   ├── App.tsx             # The main application component, orchestrates layout and content.
│   ├── index.tsx           # The entry point for the React application.
│   ├── constants.ts        # Maps icon names to their Lucide-React components.
│   └── types.ts            # TypeScript type definitions for the application.
├── index.html              # The HTML shell, includes Tailwind CSS configuration.
└── README.md               # This documentation file.
```

---

## Configuration (`settings.json`)

This file is the heart of the application. It controls everything from colors to navigation links.

### `theme`

An object containing key-value pairs for the application's color scheme. These are injected as CSS variables.

```json
"theme": {
  "primary": "hsl(220, 13%, 61%)",
  "primary-foreground": "hsl(210, 40%, 98%)",
  "secondary": "hsl(210, 40%, 96.1%)",
  // ... and so on
}
```

### `security`

Defines security policies for the application.

- `allowedIframeDomains`: An array of strings. The application will only load iframe content from these domains or their subdomains. This is a critical security feature to prevent your dashboard from being used to display arbitrary, potentially malicious content.

```json
"security": {
  "allowedIframeDomains": ["mypancho.com"]
}
```

### `sidebar`

This object configures the entire sidebar.

- `defaultState`: Can be `"expanded"` or `"collapsed"`. Sets the initial state of the sidebar on desktop for a first-time user.
- `logoUrl`: The URL for the logo displayed at the top of the sidebar.
- `profile`: An object defining the user profile link at the bottom of the sidebar.
- `navItems`: An array that defines the structure and content of the sidebar navigation. There are three types of items:
    1.  **`link`**: A standard clickable navigation link.
        - `href`: The unique hash route for this link (e.g., `"#/my-services.html"`).
        - `label`: The text displayed for the link.
        - `icon`: The name of the icon to display (must exist in `constants.ts`).
        - `iframeUrl`: The actual URL to load in the iframe when this link is clicked.
    2.  **`header`**: A non-clickable text label used to group sections of links (e.g., "Manage Account").
    3.  **`submenu`**: A collapsible group of links. It has a `label`, `icon`, `path` (a unique ID), and a `children` array containing `link` objects.

---

## Dynamic Theming & Branding via URL Parameters

This is the application's standout feature. It allows you to dynamically override values from `settings.json` by simply adding query parameters to the URL. The logic for this is handled in `SettingsContext.tsx`.

### How It Works

When the application loads, it fetches `settings.json`. Before storing the settings in its state, it inspects the current URL's query parameters. If it finds any parameters whose names **exactly match** keys within the `theme` object or the `logoUrl` key, it uses the parameter's value to override the value from the file.

### Supported Parameters

-   **Any key from the `theme` object**: `primary`, `primary-foreground`, `border`, etc.
-   **`logoUrl`**: The key for the sidebar logo.

### Examples

Let's assume your application is running at `https://mypancho.com/partners/`.

**1. Change the Primary Color**

To change the primary color to a bright red, you can construct the following URL. Note that special characters like `%` must be URL-encoded.

> `https://mypancho.com/partners/?primary=hsl(0, 100%25, 50%25)`

**2. Change the Logo**

To use a different logo, provide a new URL.

> `https://mypancho.com/partners/?logoUrl=https://example.com/new-logo.png`

**3. Combine Multiple Overrides**

You can combine multiple parameters to change several aspects at once.

> `https://mypancho.com/partners/?primary=hsl(260, 100%25, 60%25)&border=hsl(260, 50%25, 80%25)&logoUrl=https://example.com/purple-logo.svg`

This powerful feature allows for on-the-fly branding and personalization without needing separate deployments or configuration files.

---

## Extending the App

### Adding a New Icon

1.  Open `src/constants.ts`.
2.  Import the desired icon from the `lucide-react` library.
3.  Add the imported icon component to the `iconMap` object with a unique string key.
4.  You can now use this string key as the `icon` value for any navigation item in `settings.json`.