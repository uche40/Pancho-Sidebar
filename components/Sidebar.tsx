
import React, { useState, useEffect, createContext, useContext } from 'react';
import { SidebarSettings } from '../types';
import SidebarItem from './SidebarItem';
import Icon from './Icon';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Create a context to provide the sidebar's expanded state to child components (like SidebarItem).
// This avoids "prop drilling" the isExpanded state through multiple layers.
const SidebarContext = createContext({ isExpanded: false });

interface SidebarProps {
    settings: SidebarSettings;
    isMobile: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
}

/**
 * The main Sidebar component. It handles its own internal state (like open submenus)
 * and renders itself differently based on whether the view is mobile or desktop.
 */
const Sidebar: React.FC<SidebarProps> = ({
    settings,
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isExpanded,
    setIsExpanded
}) => {
    // State to track if the mouse is hovering over the sidebar.
    // This is only used on desktop when the sidebar is collapsed to enable the "hover-to-expand" feature.
    const [isHovering, setIsHovering] = useState(false);
    
    // State to keep track of which submenus are currently open.
    // It's initialized from localStorage to persist the user's choices across page loads.
    const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const savedSubmenus = localStorage.getItem("openSubmenus");
            return savedSubmenus ? new Set(JSON.parse(savedSubmenus)) : new Set();
        }
        return new Set();
    });

    // Effect to save the open submenus to localStorage whenever the state changes.
    useEffect(() => {
        localStorage.setItem("openSubmenus", JSON.stringify(Array.from(openSubmenus)));
    }, [openSubmenus]);

    // Toggles the open/closed state of a specific submenu.
    const toggleSubmenu = (path: string) => {
        setOpenSubmenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    // This variable determines if the sidebar's text content should be visible.
    // On mobile, it's always true (the sidebar is either fully visible or not at all).
    // On desktop, it's true if the sidebar is pinned open (`isExpanded`) OR if it's being hovered over.
    const isEffectivelyExpanded = isMobile ? true : (isExpanded || (isHovering && !isExpanded));

    // The shared JSX for the navigation items and the profile section.
    const sidebarContent = (
        <>
            <nav className="flex-1 px-3 overflow-y-auto overflow-x-hidden">
                {settings.navItems.map((item, index) => (
                    <SidebarItem
                        key={item.type === 'submenu' ? item.path : `${item.label}-${index}`}
                        item={item}
                        isOpen={item.type === 'submenu' ? openSubmenus.has(item.path) : false}
                        onToggle={item.type === 'submenu' ? () => toggleSubmenu(item.path) : undefined}
                    />
                ))}
            </nav>

            <div
                className="border-t border-border flex p-3 cursor-pointer hover:bg-muted"
                onClick={() => {
                    // Navigate to the profile page when clicked.
                    window.location.hash = settings.profile.href;
                    if (isMobile) setIsMobileMenuOpen(false); // Close mobile menu on navigation.
                }}
            >
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                    <Icon name={settings.profile.icon} className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className={`flex-1 ml-3 min-w-0 transition-opacity duration-200 ease-out ${isEffectivelyExpanded ? "opacity-100" : "opacity-0"}`}
                >
                    <div className="leading-4 whitespace-nowrap">
                        <h4 className="font-semibold text-sm text-primary whitespace-nowrap">{settings.profile.name}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{settings.profile.role}</span>
                    </div>
                </div>
            </div>
        </>
    );

    // --- Mobile Rendering ---
    // On mobile, the sidebar is a fixed-position overlay that slides in from the left.
    if (isMobile) {
        return (
            <SidebarContext.Provider value={{ isExpanded: true }}>
                {/* Backdrop overlay */}
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 md:hidden
                        ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    aria-hidden="true"
                />
                {/* Sidebar Panel */}
                <aside
                    className={`fixed top-0 left-0 h-full flex flex-col bg-white border-r border-border shadow-xl z-40 transition-transform duration-300 ease-in-out w-64 md:hidden
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
                    }
                >
                    <div className="p-4 pb-2 flex items-center justify-between">
                        <img
                            src={settings.logoUrl}
                            className="w-10"
                            alt="Logo"
                        />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-muted"
                            aria-label="Close menu"
                        >
                            <ChevronLeft size={20} className="text-secondary-foreground" />
                        </button>
                    </div>
                    {sidebarContent}
                </aside>
            </SidebarContext.Provider>
        );
    }

    // --- Desktop Rendering ---
    // On desktop, the sidebar is part of the main layout flow and can be collapsed or expanded.
    return (
        <SidebarContext.Provider value={{ isExpanded: isEffectivelyExpanded }}>
            <aside
                className={`h-full flex-col bg-white border-r border-border shadow-sm transition-[width] duration-300 ease-out ${isEffectivelyExpanded ? "w-64" : "w-16"} hidden md:flex overflow-x-hidden`}
                onMouseEnter={() => !isExpanded && setIsHovering(true)}
                onMouseLeave={() => !isExpanded && setIsHovering(false)}
            >
                <div className={`p-4 pb-2 flex items-center ${isEffectivelyExpanded ? "justify-between" : "justify-center"}`}>
                    <img
                        src={settings.logoUrl}
                        className={`overflow-hidden transition-[width] duration-300 ease-out ${isEffectivelyExpanded ? "w-10" : "w-0"}`}
                        alt="Logo"
                    />
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-muted"
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {isExpanded ? <ChevronLeft size={20} className="text-secondary-foreground" /> : <ChevronRight size={20} className="text-secondary-foreground" />}
                    </button>
                </div>
                {sidebarContent}
            </aside>
        </SidebarContext.Provider>
    );
};

/**
 * A custom hook to easily access the sidebar's context (i.e., its expanded state).
 */
export const useSidebar = () => useContext(SidebarContext);

export default Sidebar;
