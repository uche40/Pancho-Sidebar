
import React, { useState, useEffect } from 'react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import { useLocation } from './hooks/useLocation';
import { NavItem, NavLink } from './types';
import { Menu } from 'lucide-react';

/**
 * Finds the most specific navigation item that matches the current URL hash.
 * This allows for "deep linking" where the browser URL can contain both the
 * application route and a hash for the iframe's internal routing.
 * For example, if href is `#/clientarea.html#details` and a navLink has href `#/clientarea.html`,
 * this function will correctly identify it as a match and return the remaining `#details` part.
 * 
 * @param navItems - The array of all navigation items from settings.
 * @param href - The current URL hash from the browser's address bar.
 * @returns An object containing the matched `navLink` and the leftover `iframeHash`, or undefined if no match is found.
 */
const findNavItemByHref = (navItems: NavItem[], href: string): { navLink: NavLink, iframeHash: string } | undefined => {
    let bestMatch: { navLink: NavLink, iframeHash:string } | undefined = undefined;

    // Helper to check a single NavLink item
    const checkItem = (item: NavLink) => {
        // Check if the current browser hash starts with the item's defined href.
        if (href.startsWith(item.href)) {
            // This check prevents partial matches (e.g., `/foo` matching `/foobar`).
            // A valid match is either exact or followed by a '#' for the iframe's hash.
            const nextChar = href[item.href.length];
            if (nextChar === undefined || nextChar === '#') {
                // If this match is more specific (longer) than a previous match, it's better.
                if (!bestMatch || item.href.length > bestMatch.navLink.href.length) {
                    const iframeHash = href.substring(item.href.length);
                    bestMatch = { navLink: item, iframeHash };
                }
            }
        }
    };
    
    // Iterate through all nav items, including those in submenus.
    for (const item of navItems) {
        if (item.type === 'link') {
            checkItem(item);
        }
        if (item.type === 'submenu') {
            for (const child of item.children) {
                checkItem(child);
            }
        }
    }
    return bestMatch;
};


/**
 * Finds the first available link in the navigation items to be used as the default page.
 * This is used when the user navigates to the root of the application (`#/`).
 * @param navItems - The array of all navigation items.
 * @returns The href of the first found linkable item, or a fallback.
 */
const findDefaultHref = (navItems: NavItem[]): string => {
    for (const item of navItems) {
        if (item.type === 'link') {
            return item.href;
        }
        if (item.type === 'submenu' && item.children.length > 0) {
            return item.children[0].href;
        }
    }
    return '#/'; // Fallback route
};

/**
 * A custom hook to monitor a CSS media query and return whether it matches.
 * This is used to detect mobile vs. desktop viewports.
 * @param query - The media query string (e.g., '(max-width: 767px)').
 * @returns `true` if the query matches, `false` otherwise.
 */
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
        
        // Add listener with backward compatibility for older browsers.
        try {
            mediaQuery.addEventListener('change', handler);
        } catch (e) {
            mediaQuery.addListener(handler); 
        }
        
        return () => {
            try {
                mediaQuery.removeEventListener('change', handler);
            } catch (e) {
                mediaQuery.removeListener(handler);
            }
        };
    }, [query]);

    return matches;
};


/**
 * PageContent is responsible for rendering the main content area, which is
 * typically an iframe pointing to a specific URL based on the current route.
 * It handles security checks, parameter pass-through, and loading states.
 */
const PageContent: React.FC = () => {
    const { hash } = useLocation(); // Gets the current URL hash (e.g., "#/my-services.html")
    const { settings } = useSettings(); // Accesses the loaded application settings.
    const [finalIframeUrl, setFinalIframeUrl] = useState<string | null>(null);
    const [securityError, setSecurityError] = useState<string | null>(null);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    // Find the active navigation item based on the current URL hash.
    const navItems = settings!.sidebar.navItems;
    const defaultHref = findDefaultHref(navItems);
    const targetHash = hash === '#/' ? defaultHref : hash;
    const match = findNavItemByHref(navItems, targetHash);
    const activeItem = match?.navLink;
    const iframeHash = match?.iframeHash ?? ''; // The part of the hash to pass to the iframe
    const iframeUrl = activeItem?.iframeUrl; // The base URL for the iframe from settings.json


    // This effect runs whenever the iframe URL or its hash changes.
    // It constructs the final, secure URL and handles all logic related to it.
    useEffect(() => {
        if (!iframeUrl) {
            setFinalIframeUrl(null);
            setSecurityError(null);
            setIsIframeLoading(false);
            return;
        }

        setIsIframeLoading(true);

        const isRelative = iframeUrl.startsWith('/') || iframeUrl.startsWith('./');
        let finalUrl: URL;

        try {
            finalUrl = new URL(iframeUrl, window.location.origin);
        } catch (error) {
            setSecurityError('The configured iframe URL is invalid.');
            setFinalIframeUrl(null);
            setIsIframeLoading(false);
            return;
        }

        // **Security Check**: For absolute URLs, ensure the hostname is in the allowed list.
        if (!isRelative) {
            const allowedDomains = settings?.security?.allowedIframeDomains ?? [];
            const hostname = finalUrl.hostname;
            const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

            if (!isAllowed) {
                setSecurityError('For security reasons, only content from configured domains can be displayed.');
                setFinalIframeUrl(null);
                setIsIframeLoading(false);
                return;
            }
        }

        // **Parameter Pass-through**: Append all query params from the main browser URL to the iframe URL.
        const mainPageParams = new URLSearchParams(window.location.search);
        mainPageParams.forEach((value, key) => {
            finalUrl.searchParams.append(key, value);
        });

        // Append the specific hash fragment for the iframe.
        if (iframeHash) {
            finalUrl.hash = iframeHash;
        }

        setFinalIframeUrl(finalUrl.toString());
        setSecurityError(null);

    }, [iframeUrl, iframeHash, settings?.security?.allowedIframeDomains]);


    if (securityError) {
         return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Content Blocked</h1>
                <p className="mt-4 text-muted-foreground">{securityError}</p>
            </div>
        );
    }

    if (finalIframeUrl) {
        return (
            <div className="w-full h-full relative">
                {isIframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 backdrop-blur-sm z-10">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <iframe
                    key={finalIframeUrl} // The key ensures the iframe re-mounts when the URL changes
                    src={finalIframeUrl}
                    className={`w-full h-full border-none transition-opacity duration-300 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                    title={activeItem?.label || 'Content'}
                    allowFullScreen
                    onLoad={() => setIsIframeLoading(false)}
                ></iframe>
            </div>
        );
    }
    
    // Default content shown when no page is selected or the selected page has no iframeUrl.
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-primary">Welcome to your Dashboard</h1>
            <p className="mt-4 text-muted-foreground">Select a menu item to view its content.</p>
             <p className="mt-2 text-sm text-muted-foreground">Current route: <code>{hash}</code></p>
        </div>
    );
}

/**
 * AppLayout is the main component that orchestrates the entire application layout.
 * It manages the sidebar's state and responsiveness, applies the theme, and renders
 * the main content area.
 */
const AppLayout: React.FC = () => {
    const { settings, loading } = useSettings();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { hash } = useLocation();

    // The sidebar's expanded/collapsed state is "lifted" to this parent component.
    // This allows the main content's layout to be adjusted when the sidebar changes width on desktop.
    const [isExpanded, setIsExpanded] = useState(false);

    // Effect to initialize the sidebar state from localStorage or settings.json.
    // This runs only once when settings are loaded and respects the device type (mobile vs. desktop).
    useEffect(() => {
        if (loading || !settings) return;
        
        const savedState = localStorage.getItem("sidebarState");
        const initialState = savedState
            ? savedState === 'expanded'
            : settings.sidebar.defaultState === 'expanded';

        if (!isMobile) {
            setIsExpanded(initialState);
        } else {
            setIsExpanded(false); // On mobile, the sidebar is an overlay and doesn't affect layout.
        }
    }, [loading, settings, isMobile]);

    // Effect to persist the sidebar state to localStorage whenever it changes on desktop.
    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem("sidebarState", isExpanded ? 'expanded' : 'collapsed');
        }
    }, [isExpanded, isMobile]);

    // Effect to apply the theme colors from settings as CSS custom properties on the root element.
    // This makes the theme globally available to the Tailwind CSS configuration.
    useEffect(() => {
        if (settings?.theme) {
            const root = document.documentElement;
            Object.entries(settings.theme).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value as string);
            });
        }
    }, [settings]);

    // Effect to automatically close the mobile menu overlay when the user navigates to a new page.
    useEffect(() => {
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    }, [hash, isMobile]);
    
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-secondary">
                <p className="text-secondary-foreground">Loading settings...</p>
            </div>
        );
    }
    
    if (!settings) {
        return (
            <div className="flex h-screen items-center justify-center bg-secondary">
                <p className="text-red-500 font-semibold">Error: Failed to load settings.</p>
                <p className="text-sm text-muted-foreground mt-2">Please ensure <code>settings.json</code> is present and correctly formatted.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-secondary">
            {/* The Sidebar component receives all necessary state and settings as props. */}
            <Sidebar
                settings={settings.sidebar}
                isMobile={isMobile}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
            <div className="relative flex flex-col flex-1 w-full transition-all duration-300 ease-in-out">
                 {/* The mobile header with the hamburger menu is only rendered on mobile screens. */}
                 {isMobile && (
                    <header className="absolute top-0 left-0 right-0 flex items-center justify-end p-4 z-10">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Open menu">
                            <Menu size={24} className="text-gray-500"/>
                        </button>
                    </header>
                )}
                <main className={`flex-1 overflow-y-auto`}>
                    <PageContent />
                </main>
            </div>
        </div>
    );
};


/**
 * The root App component. It wraps the entire application with the SettingsProvider
 * to make the settings and loading state available to all child components.
 */
const App: React.FC = () => {
    return (
        <SettingsProvider>
            <AppLayout />
        </SettingsProvider>
    );
};

export default App;
