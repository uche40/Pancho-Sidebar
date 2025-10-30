import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppSettings } from '../types';

// Define the shape of the context's state.
interface SettingsContextType {
  settings: AppSettings | null; // Holds the application settings, or null if not yet loaded.
  loading: boolean;              // True while fetching settings, false otherwise.
}

// Create the React Context with a default value.
const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
});

/**
 * The SettingsProvider is a component that wraps the entire application.
 * Its primary responsibility is to fetch the `settings.json` file, process any
 * dynamic overrides from URL parameters, and provide the final settings object
 * and loading state to all components that need it via the SettingsContext.
 */
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // This useEffect hook runs once when the component mounts.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/settings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AppSettings = await response.json();

        // --- DYNAMIC SETTINGS OVERRIDE LOGIC ---
        // This is a powerful feature that allows for on-the-fly branding and theming.
        // It correctly parses parameters from the URL's hash fragment (e.g., #/page?logoUrl=...).
        const hash = window.location.hash;
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryString);

        // 1. Override theme settings
        // If the settings file has a 'theme' object, iterate over its keys.
        if (data.theme) {
            Object.keys(data.theme).forEach(key => {
                // Check if a URL parameter exists with the *exact same name* as the theme key (e.g., 'primary').
                if (params.has(key)) {
                    // If it exists, update the theme object with the value from the URL.
                    // decodeURIComponent is used to correctly handle special characters like '%' in HSL color values.
                    data.theme![key] = decodeURIComponent(params.get(key)!);
                }
            });
        }

        // 2. Override the sidebar logo URL
        // Check if the URL has a 'logoUrl' parameter.
        if (data.sidebar && params.has('logoUrl')) {
            data.sidebar.logoUrl = decodeURIComponent(params.get('logoUrl')!);
        }
        
        // After processing overrides, store the final settings object in the state.
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        // Set loading to false regardless of whether the fetch succeeded or failed.
        setLoading(false);
      }
    };

    fetchSettings();
  }, []); // The empty dependency array ensures this effect runs only once.

  // The provider makes the 'settings' and 'loading' state available to all descendant components.
  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * A custom hook `useSettings` that provides a convenient way for components
 * to access the settings context. It also includes an error check to ensure
 * it's used within a SettingsProvider tree.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};