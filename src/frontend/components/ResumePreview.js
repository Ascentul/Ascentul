import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import ResumeTemplate from './ResumeTemplates';
import { Loader2 } from 'lucide-react';
import { exportResumeToPDF } from '@/utils/resumeExport';
import { useToast } from '@/hooks/use-toast';
export default function ResumePreview({ open, onOpenChange, resume, onDownloadPDF }) {
    const [isLoading, setIsLoading] = useState(false);
    const [templateStyle, setTemplateStyle] = useState('professional');
    const [zoomLevel, setZoomLevel] = useState(1);
    const { toast } = useToast();
    const handleZoomIn = () => {
        setZoomLevel(Math.min(zoomLevel + 0.1, 1.5));
    };
    const handleZoomOut = () => {
        setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
    };
    const handleResetZoom = () => {
        setZoomLevel(1);
    };
    const handlePrint = () => {
        window.print();
    };
    const handleDownload = async () => {
        try {
            setIsLoading(true);
            // Get reference to the current template in the DOM
            const resumePreviewElement = document.querySelector('.resume-template');
            if (!resumePreviewElement) {
                toast({
                    title: "Error",
                    description: "Could not find resume template to export",
                    variant: "destructive"
                });
                setIsLoading(false);
                return;
            }
            // Generate the filename
            const filename = `${resume?.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
            // Use our centralized export utility
            const success = await exportResumeToPDF(resumePreviewElement, {
                filename,
                showToast: false // We'll handle toasts ourselves for better loading state
            });
            if (success) {
                toast({
                    title: "Success",
                    description: "Your resume has been downloaded as a PDF",
                });
            }
            else {
                toast({
                    title: "Error",
                    description: "PDF generation failed. Try again.",
                    variant: "destructive"
                });
            }
            setIsLoading(false);
        }
        catch (error) {
            console.error("Error exporting resume to PDF:", error);
            toast({
                title: "Error",
                description: "Failed to export resume. Please try again.",
                variant: "destructive"
            });
            setIsLoading(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[900px] max-h-[90vh] p-4 md:p-6", children: [_jsxs(DialogHeader, { className: "pb-4 space-y-1", children: [_jsx(DialogTitle, { className: "text-xl font-semibold", children: resume?.name || 'Resume Preview' }), _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 pt-2", children: [_jsxs("div", { className: "flex space-x-2 items-center", children: [_jsx("span", { className: "text-sm font-medium mr-2", children: "Template:" }), _jsxs(Select, { value: templateStyle, onValueChange: (value) => setTemplateStyle(value), children: [_jsx(SelectTrigger, { className: "w-[140px] h-8", children: _jsx(SelectValue, { placeholder: "Select style" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "modern", children: "Modern" }), _jsx(SelectItem, { value: "classic", children: "Classic" }), _jsx(SelectItem, { value: "minimal", children: "Minimal" }), _jsx(SelectItem, { value: "professional", children: "Professional" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: handleZoomOut, disabled: zoomLevel <= 0.5, className: "h-8 w-8", children: _jsx(ZoomOut, { className: "h-4 w-4" }) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleResetZoom, className: "h-8", children: [_jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1" }), _jsxs("span", { className: "text-xs", children: [Math.round(zoomLevel * 100), "%"] })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: handleZoomIn, disabled: zoomLevel >= 1.5, className: "h-8 w-8", children: _jsx(ZoomIn, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex space-x-2", children: _jsx(Button, { variant: "default", size: "sm", onClick: handleDownload, disabled: isLoading, className: "h-8", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "h-4 w-4 mr-1" }), "Download PDF"] })) }) })] })] }), _jsx("div", { className: "relative overflow-auto py-4 flex-1 max-h-[70vh]", children: resume ? (_jsx(ResumeTemplate, { resume: resume, style: templateStyle, scale: zoomLevel })) : (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("p", { className: "text-neutral-500", children: "No resume data available" }) })) })] }) }));
}
