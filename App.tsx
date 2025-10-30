import React, { useState, useEffect } from 'react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import { useLocation } from './hooks/useLocation';
import { NavItem, NavLink } from './types';
import { Menu } from 'lucide-react';

// Helper function to find the navigation item by href, allowing for extra hash values
const findNavItemByHref = (navItems: NavItem[], href: string): { navLink: NavLink, iframeHash: string } | undefined => {
    let bestMatch: { navLink: NavLink, iframeHash:string } | undefined = undefined;

    const checkItem = (item: NavLink) => {
        if (href.startsWith(item.href)) {
            // Ensure this is not a partial match of a path segment (e.g. /foo matching /foobar)
            // A valid match is either exact, or is followed by a '#' for the iframe's internal routing.
            const nextChar = href[item.href.length];
            if (nextChar === undefined || nextChar === '#') {
                // If we found a potential match, check if it's better than any previous one.
                // A "better" match is a longer, more specific one.
                if (!bestMatch || item.href.length > bestMatch.navLink.href.length) {
                    const iframeHash = href.substring(item.href.length);
                    bestMatch = { navLink: item, iframeHash };
                }
            }
        }
    };
    
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


// Helper function to find the first available linkable href from nav items.
const findDefaultHref = (navItems: NavItem[]): string => {
    for (const item of navItems) {
        if (item.type === 'link') {
            return item.href;
        }
        if (item.type === 'submenu' && item.children.length > 0) {
            return item.children[0].href;
        }
    }
    return '#/'; // Fallback if no link is found
};

// A hook to check for a media query match, used for responsive logic.
const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
        
        try {
            mediaQuery.addEventListener('change', handler);
        } catch (e) {
            mediaQuery.addListener(handler); // For older browsers
        }
        
        return () => {
            try {
                mediaQuery.removeEventListener('change', handler);
            } catch (e) {
                mediaQuery.removeListener(handler); // For older browsers
            }
        };
    }, [query]);

    return matches;
};


const PageContent: React.FC = () => {
    const { hash } = useLocation();
    const { settings } = useSettings();
    const [finalIframeUrl, setFinalIframeUrl] = useState<string | null>(null);
    const [securityError, setSecurityError] = useState<string | null>(null);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    // settings are guaranteed to be loaded by AppLayout
    const navItems = settings!.sidebar.navItems;
    const match = findNavItemByHref(navItems, hash === '#/' ? findDefaultHref(navItems) : hash);
    const activeItem = match?.navLink;
    const iframeHash = match?.iframeHash ?? '';
    const iframeUrl = activeItem?.iframeUrl;


    useEffect(() => {
        if (!iframeUrl) {
            setFinalIframeUrl(null);
            setSecurityError(null);
            setIsIframeLoading(false);
            return;
        }

        setIsIframeLoading(true); // Start loading indicator immediately

        const isRelative = iframeUrl.startsWith('/') || iframeUrl.startsWith('./');
        let finalUrl: URL;

        try {
            // Create a full URL object, using the window's origin as a base for relative URLs
            finalUrl = new URL(iframeUrl, window.location.origin);
        } catch (error) {
            console.error("Invalid iframe URL in settings.json:", iframeUrl, error);
            setSecurityError('The configured iframe URL is invalid.');
            setFinalIframeUrl(null);
            setIsIframeLoading(false);
            return;
        }

        // Security Check: Only applies to absolute URLs
        if (!isRelative) {
            const allowedDomains = settings?.security?.allowedIframeDomains ?? [];
            const hostname = finalUrl.hostname;

            const isAllowed = allowedDomains.some(domain =>
                hostname === domain || hostname.endsWith(`.${domain}`)
            );

            if (!isAllowed) {
                setSecurityError('For security reasons, only content from configured domains can be displayed.');
                setFinalIframeUrl(null);
                setIsIframeLoading(false);
                return;
            }
        }

        // Parameter Pass-through: Append query params from main URL
        const mainPageParams = new URLSearchParams(window.location.search);
        mainPageParams.forEach((value, key) => {
            finalUrl.searchParams.append(key, value);
        });

        // Append hash fragment from main URL to the iframe URL
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
                    key={finalIframeUrl} // Add key to force re-render on URL change
                    src={finalIframeUrl}
                    className={`w-full h-full border-none transition-opacity duration-300 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                    title={activeItem?.label || 'Content'}
                    allowFullScreen
                    onLoad={() => setIsIframeLoading(false)}
                ></iframe>
            </div>
        );
    }
    
    // Default content if no iframeUrl is specified
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-primary">Welcome to your Dashboard</h1>
            <p className="mt-4 text-muted-foreground">Select a menu item to view its content.</p>
             <p className="mt-2 text-sm text-muted-foreground">Current route: <code>{hash}</code></p>
        </div>
    );
}

const AppLayout: React.FC = () => {
    const { settings, loading } = useSettings();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { hash } = useLocation();

    // Lift sidebar expanded state to manage layout from the top level
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (loading || !settings) return;

        // Set initial state from localStorage or settings, but only on desktop
        const savedState = localStorage.getItem("sidebarState");
        const initialState = savedState
            ? savedState === 'expanded'
            : settings.sidebar.defaultState === 'expanded';

        if (!isMobile) {
            setIsExpanded(initialState);
        } else {
            setIsExpanded(false); // Sidebar is never "expanded" in the layout flow on mobile
        }
    }, [loading, settings, isMobile]);

    // Update local storage when isExpanded changes on desktop
    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem("sidebarState", isExpanded ? 'expanded' : 'collapsed');
        }
    }, [isExpanded, isMobile]);

    // Dynamically apply theme colors from settings
    useEffect(() => {
        if (settings?.theme) {
            const root = document.documentElement;
            Object.entries(settings.theme).forEach(([key, value]) => {
                // FIX: The value from Object.entries on a JSON-derived object can be inferred
                // as 'unknown'. Cast to string to ensure compatibility with setProperty.
                root.style.setProperty(`--color-${key}`, value as string);
            });
        }
    }, [settings]);

    // Close mobile menu on navigation
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
            <Sidebar
                settings={settings.sidebar}
                isMobile={isMobile}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
            <div className="relative flex flex-col flex-1 w-full transition-all duration-300 ease-in-out">
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


const App: React.FC = () => {
    return (
        <SettingsProvider>
            <AppLayout />
        </SettingsProvider>
    );
};

export default App;