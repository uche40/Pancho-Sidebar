import React, { useState, useEffect, createContext, useContext } from 'react';
import { SidebarSettings } from '../types';
import SidebarItem from './SidebarItem';
import Icon from './Icon';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SidebarContext = createContext({ isExpanded: false });

interface SidebarProps {
    settings: SidebarSettings;
    isMobile: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    settings,
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isExpanded,
    setIsExpanded
}) => {
    // Hover state is only for desktop collapsed view
    const [isHovering, setIsHovering] = useState(false);
    
    const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const savedSubmenus = localStorage.getItem("openSubmenus");
            return savedSubmenus ? new Set(JSON.parse(savedSubmenus)) : new Set();
        }
        return new Set();
    });

    useEffect(() => {
        localStorage.setItem("openSubmenus", JSON.stringify(Array.from(openSubmenus)));
    }, [openSubmenus]);

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

    // Determines if text labels and other "expanded" content should be visible
    const isEffectivelyExpanded = isMobile ? true : (isExpanded || (isHovering && !isExpanded));

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
                    window.location.hash = settings.profile.href;
                    // Also close mobile menu if it's open
                    if (isMobile) setIsMobileMenuOpen(false);
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

    if (isMobile) {
        return (
            <SidebarContext.Provider value={{ isExpanded: true }}>
                {/* Overlay */}
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

    // Desktop Sidebar
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

export const useSidebar = () => useContext(SidebarContext);

export default Sidebar;