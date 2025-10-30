
import { useState, useEffect } from 'react';

export const useLocation = () => {
    const [hash, setHash] = useState(window.location.hash || '#/');

    useEffect(() => {
        const handleHashChange = () => {
            setHash(window.location.hash || '#/');
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    return { hash };
};
