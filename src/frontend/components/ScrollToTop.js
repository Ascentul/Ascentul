import { useEffect } from 'react';
import { useLocation } from 'wouter';
/**
 * ScrollToTop component that scrolls to the top of the page when the route changes
 * Place this component near the root of your application inside the Router component
 */
export function ScrollToTop() {
    const [location] = useLocation();
    useEffect(() => {
        // Scroll to top when the location changes
        window.scrollTo(0, 0);
    }, [location]);
    return null;
}
