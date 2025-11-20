'use client';

import { useState, useEffect } from 'react';

export default function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        isMobile: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        function handleResize() {
            const width = window.innerWidth;
            setWindowSize({
                width: width,
                isMobile: width <= 767
            });
        }

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);

    }, []);

    return windowSize;
}