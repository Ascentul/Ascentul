import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export function EmbeddedApplyFrame({ isOpen, onClose, jobTitle, companyName, applyUrl, }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isFrameBlocked, setIsFrameBlocked] = useState(false);
    const [frameHeight, setFrameHeight] = useState(600);
    // Check if frame can be loaded or if it's blocked by the target site
    useEffect(() => {
        if (!isOpen)
            return;
        setIsLoading(true);
        setIsFrameBlocked(false);
        const timeoutId = setTimeout(() => {
            // If loading takes too long, assume the frame is blocked
            if (isLoading) {
                setIsFrameBlocked(true);
            }
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, [isOpen, applyUrl]);
    // Handle iframe load success
    const handleIframeLoad = () => {
        setIsLoading(false);
    };
    // Handle iframe load error
    const handleIframeError = () => {
        setIsLoading(false);
        setIsFrameBlocked(true);
    };
    // Handle opening the application in a new tab
    const openInNewTab = () => {
        window.open(applyUrl, '_blank');
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden", children: [_jsxs(DialogHeader, { className: "p-6 pb-2", children: [_jsxs(DialogTitle, { children: ["Apply: ", jobTitle] }), _jsxs(DialogDescription, { children: ["Complete your application for ", companyName] })] }), _jsxs("div", { className: "relative", children: [isLoading && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary mb-4" }), _jsx("p", { className: "text-muted-foreground", children: "Loading application form..." })] })), isFrameBlocked ? (_jsxs("div", { className: "p-6 flex flex-col items-center justify-center min-h-[400px]", children: [_jsx(AlertTriangle, { className: "h-12 w-12 text-orange-500 mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "Unable to load application form" }), _jsx("p", { className: "text-center text-muted-foreground mb-6 max-w-md", children: "This website doesn't allow their application form to be embedded. You'll need to apply directly on their website." }), _jsxs(Button, { onClick: openInNewTab, className: "flex items-center gap-2", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Apply on ", companyName, "'s website"] })] })) : (_jsxs("div", { className: "px-6 min-h-[400px]", children: [_jsx(Alert, { className: "mb-4 bg-amber-50 border-amber-200", children: _jsx(AlertDescription, { className: "text-amber-700", children: "Some job sites may block embedding. If the form doesn't load, use the \"Open Original\" button below." }) }), _jsx("iframe", { src: applyUrl, className: "w-full border rounded-md", style: { height: `${frameHeight}px`, minHeight: '400px' }, onLoad: handleIframeLoad, onError: handleIframeError })] }))] }), _jsx(DialogFooter, { className: "p-6 pt-4", children: _jsxs("div", { className: "flex justify-between w-full", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Close" }), !isFrameBlocked && (_jsxs(Button, { variant: "outline", onClick: openInNewTab, className: "flex items-center gap-2", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Open Original"] }))] }) })] }) }));
}
