import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
export function LinkedInFrame({ isOpen, onClose, jobUrl, onSelectJob }) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const iframeRef = useRef(null);
    // Reset state when URL changes
    useEffect(() => {
        if (jobUrl) {
            setLoading(true);
            setLoadError(false);
        }
    }, [jobUrl]);
    const handleIframeLoad = () => {
        setLoading(false);
    };
    const handleIframeError = () => {
        setLoading(false);
        setLoadError(true);
        // After a brief delay, automatically redirect to new tab since LinkedIn blocks iframe embedding
        setTimeout(() => {
            openInNewTab();
        }, 2000);
    };
    const openInNewTab = () => {
        window.open(jobUrl, '_blank', 'noopener,noreferrer');
    };
    // Handle selecting a job from the iframe (placeholder for future integration)
    const handleSelectCurrentJob = () => {
        if (onSelectJob) {
            // In a real implementation, we would try to extract job details from the iframe
            // For now, we'll just use the URL to construct basic info
            const urlParts = jobUrl.split('/');
            const jobTitle = urlParts.includes('keywords')
                ? decodeURIComponent(jobUrl.split('keywords=')[1]?.split('&')[0] || 'LinkedIn Job')
                : 'LinkedIn Job';
            onSelectJob({
                title: jobTitle,
                company: 'LinkedIn',
                description: 'To view the full job description, please click the "Open in LinkedIn" button.'
            });
            onClose();
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden", children: [_jsx(DialogHeader, { className: "p-4 border-b", children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("div", { children: [_jsx(DialogTitle, { className: "text-xl", children: "LinkedIn Job" }), _jsx(DialogDescription, { children: "View job details and apply directly through LinkedIn" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: openInNewTab, className: "flex items-center gap-1", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Open in New Tab"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleSelectCurrentJob, className: "flex items-center gap-1", children: "Select Job" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, className: "h-8 w-8", children: _jsx(X, { className: "h-4 w-4" }) })] })] }) }), _jsxs("div", { className: "relative flex-1 overflow-hidden", children: [loading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-50 z-10", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "h-8 w-8 rounded-full border-4 border-t-blue-500 animate-spin mb-4" }), _jsx("p", { className: "text-gray-500", children: "Loading LinkedIn job page..." })] }) })), loadError && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-50 z-10", children: _jsxs("div", { className: "max-w-md mx-auto", children: [_jsxs(Alert, { variant: "destructive", className: "mb-4", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), _jsx(AlertDescription, { children: "Unable to load LinkedIn content in the iframe. This might be due to LinkedIn's content security policy." })] }), _jsx("div", { className: "flex justify-center", children: _jsx(Button, { onClick: openInNewTab, children: "Open in New Tab Instead" }) })] }) })), _jsx("iframe", { ref: iframeRef, src: jobUrl, className: "w-full h-full border-0", onLoad: handleIframeLoad, onError: handleIframeError, title: "LinkedIn Job", sandbox: "allow-same-origin allow-scripts allow-popups allow-forms" })] })] }) }));
}
