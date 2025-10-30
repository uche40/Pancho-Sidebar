
import React from 'react';
import { NavItem } from '../types';
import { useSidebar } from './Sidebar';
import { useLocation } from '../hooks/useLocation';
import Icon from './Icon';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItemProps {
    item: NavItem;
    isOpen?: boolean;   // For submenus, is it currently open?
    onToggle?: () => void; // Function to call to toggle a submenu
}

/**
 * Renders a single item in the sidebar. This component is polymorphic and can render
 * a header, a direct link, or a collapsible submenu based on the `item.type` prop.
 */
const SidebarItem: React.FC<SidebarItemProps> = ({ item, isOpen, onToggle }) => {
    // `isExpanded` is consumed from the Sidebar's context. This determines if text labels should be visible.
    const { isExpanded } = useSidebar();
    // `hash` is the current URL hash, used to determine if a link is active.
    const { hash } = useLocation();

    // --- Render a Header ---
    if (item.type === 'header') {
        return (
            <h3 className={`
                text-xs font-semibold uppercase text-muted-foreground
                transition-all duration-300 ease-out
                ${isExpanded ? 'opacity-100 pl-3 mt-4 mb-2' : 'opacity-0 h-0'}
            `}>
                {item.label}
            </h3>
        );
    }
    
    // --- Render a simple Link ---
    if (item.type === 'link') {
        const isActive = hash === item.href;
        return (
            <a
                href={item.href}
                className={`
                    relative flex items-center p-2 my-2.5 font-medium rounded-md cursor-pointer
                    transition-colors group
                    ${isActive
                        ? 'bg-primary/10 text-primary' // Active state styles
                        : 'hover:bg-muted text-secondary-foreground/80 hover:text-secondary-foreground' // Default state styles
                    }
                `}
            >
                <Icon name={item.icon} size={20} className="flex-shrink-0" />
                <span className={`whitespace-nowrap ml-3 transition-opacity duration-200 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    {item.label}
                </span>
                {/* Tooltip for collapsed desktop sidebar */}
                {!isExpanded && (
                    <div className={`
                        absolute left-full rounded-md px-2 py-1 ml-2
                        bg-primary text-primary-foreground text-sm
                        invisible opacity-20 -translate-x-3 transition-all
                        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                        z-10 whitespace-nowrap
                    `}>
                        {item.label}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-primary rotate-45" />
                    </div>
                )}
            </a>
        );
    }

    // --- Render a Submenu ---
    if (item.type === 'submenu') {
        // A submenu is considered "active" if any of its child links are active.
        const isChildActive = item.children.some(child => child.href === hash);
        return (
            <>
                <div
                    onClick={onToggle}
                    className={`
                        relative flex items-center p-2 my-2.5 font-medium rounded-md cursor-pointer
                        transition-colors group
                        ${isChildActive
                            ? 'text-primary'
                            : 'hover:bg-muted text-secondary-foreground/80 hover:text-secondary-foreground'
                        }
                    `}
                >
                    <Icon name={item.icon} size={20} className="flex-shrink-0" />
                    <span className={`flex-1 whitespace-nowrap ml-3 transition-opacity duration-200 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        {item.label}
                    </span>
                    {/* Animated chevron icon using Framer Motion */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="ml-auto"
                          initial={false}
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                     {/* Tooltip for collapsed desktop sidebar */}
                     {!isExpanded && (
                        <div className={`
                            absolute left-full rounded-md px-2 py-1 ml-2
                            bg-primary text-primary-foreground text-sm
                            invisible opacity-20 -translate-x-3 transition-all
                            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                            z-10 whitespace-nowrap
                        `}>
                            {item.label}
                            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-primary rotate-45" />
                        </div>
                    )}
                </div>
                {/* Collapsible content for the submenu */}
                <AnimatePresence>
                    {isOpen && isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-5"
                        >
                            {item.children.map(child => {
                                const isActive = hash === child.href;
                                return (
                                    <a
                                        key={child.href}
                                        href={child.href}
                                        className={`
                                            flex items-center p-2 my-0.5 text-sm font-medium rounded-md cursor-pointer
                                            transition-colors group relative
                                            ${isActive
                                                ? 'text-primary'
                                                : 'hover:bg-muted text-secondary-foreground/70 hover:text-secondary-foreground'
                                            }
                                        `}
                                    >
                                        {/* Active indicator bar */}
                                        <div className={`absolute left-0 h-full w-0.5 ${isActive ? 'bg-primary' : ''}`} />
                                        <Icon name={child.icon} size={16} className="mr-3 flex-shrink-0"/>
                                        <span>{child.label}</span>
                                    </a>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }
    return null;
};

export default SidebarItem;
