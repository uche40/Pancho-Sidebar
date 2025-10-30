// FIX: Replaced placeholder content with type definitions.
// This resolves module loading errors in components that import these types.

export type IconName = string;

export interface NavLink {
    type: 'link';
    href: string;
    label: string;
    icon: IconName;
    iframeUrl?: string;
}

export interface NavHeader {
    type: 'header';
    label: string;
}

export interface NavSubmenu {
    type: 'submenu';
    path: string;
    label: string;
    icon: IconName;
    children: NavLink[];
}

export type NavItem = NavLink | NavHeader | NavSubmenu;

export interface ProfileSettings {
    href: string;
    name: string;
    role: string;
    icon: IconName;
}

export interface SidebarSettings {
    defaultState: 'expanded' | 'collapsed';
    logoUrl: string;
    navItems: NavItem[];
    profile: ProfileSettings;
}

export interface SecuritySettings {
    allowedIframeDomains?: string[];
}

export interface AppSettings {
    sidebar: SidebarSettings;
    security?: SecuritySettings;
    // FIX: Add 'theme' property to AppSettings to support dynamic themeing and fix type errors in App.tsx.
    theme?: { [key: string]: string };
}