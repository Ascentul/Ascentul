import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Upload, Check, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
export default function PdfTestPage() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                setError('Please select a PDF file');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type !== 'application/pdf') {
                setError('Please drop a PDF file');
                return;
            }
            setFile(droppedFile);
            setError(null);
            setResult(null);
        }
    };
    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }
        setIsUploading(true);
        setError(null);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('pdfFile', file);
            const response = await fetch('/test-pdf-extract', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setResult(data);
        }
        catch (err) {
            console.error('Error uploading PDF:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
        finally {
            setIsUploading(false);
        }
    };
    const resetForm = () => {
        setFile(null);
        setError(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "PDF Extraction Test Tool" }), error && (_jsxs(Alert, { variant: "destructive", className: "mb-6", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Upload PDF" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors", onDragOver: handleDragOver, onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "application/pdf", className: "hidden" }), _jsx(Upload, { className: "mx-auto h-12 w-12 text-gray-400 mb-4" }), _jsx("p", { className: "text-lg font-semibold", children: "Drag and drop or click to upload" }), _jsx("p", { className: "text-sm text-gray-500", children: "Only PDF files are accepted" })] }), file && (_jsxs("div", { className: "mt-4 p-3 bg-blue-50 rounded-md flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 text-blue-600 mr-2" }), _jsxs("div", { className: "flex-1 truncate", children: [_jsx("p", { className: "font-medium truncate", children: file.name }), _jsxs("p", { className: "text-sm text-gray-500", children: [(file.size / 1024).toFixed(2), " KB"] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: resetForm, children: "Change" })] })), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Button, { onClick: handleUpload, disabled: !file || isUploading, className: "w-full", children: isUploading ? 'Testing PDF...' : 'Test PDF Extraction' }) })] })] }), result && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [result.success ? (_jsx(Check, { className: "h-5 w-5 text-green-600 mr-2" })) : (_jsx(AlertCircle, { className: "h-5 w-5 text-red-600 mr-2" })), "Test Result: ", result.success ? 'Success' : 'Failed'] }) }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: "summary", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "summary", children: "Summary" }), _jsx(TabsTrigger, { value: "pdflib", children: "PDF-Lib" }), _jsx(TabsTrigger, { value: "pdfparse", children: "PDF-Parse" })] }), _jsx(TabsContent, { value: "summary", children: _jsxs("div", { className: "space-y-4 mt-4", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "File" }), _jsx("p", { className: "text-sm", children: result.file.filename }), _jsxs("p", { className: "text-sm text-gray-500", children: [(result.file.size / 1024).toFixed(2), " KB - ", result.file.mimetype] })] }), _jsxs("div", { className: `p-3 rounded-md ${result.pdfLib.success ? 'bg-green-50' : 'bg-red-50'}`, children: [_jsx("p", { className: "font-medium", children: result.pdfLib.success ? (_jsx("span", { className: "text-green-700", children: "PDF-Lib: Success" })) : (_jsx("span", { className: "text-red-700", children: "PDF-Lib: Failed" })) }), _jsx("p", { className: "text-sm", children: result.pdfLib.message }), result.pdfLib.pageCount && (_jsxs("p", { className: "text-sm", children: ["Pages: ", result.pdfLib.pageCount] }))] }), _jsxs("div", { className: `p-3 rounded-md ${result.pdfParse.success ? 'bg-green-50' : 'bg-red-50'}`, children: [_jsx("p", { className: "font-medium", children: result.pdfParse.success ? (_jsx("span", { className: "text-green-700", children: "PDF-Parse: Success" })) : (_jsx("span", { className: "text-red-700", children: "PDF-Parse: Failed" })) }), _jsx("p", { className: "text-sm", children: result.pdfParse.message }), result.pdfParse.textLength && (_jsxs("p", { className: "text-sm", children: ["Extracted text: ", result.pdfParse.textLength, " characters"] }))] })] }) }), _jsx(TabsContent, { value: "pdflib", children: _jsx("div", { className: "space-y-4 mt-4", children: _jsxs("div", { className: "bg-gray-50 p-4 rounded-md", children: [_jsxs("p", { className: "font-medium", children: ["Status: ", result.pdfLib.success ? 'Success' : 'Failed'] }), _jsx("p", { children: result.pdfLib.message }), result.pdfLib.pageCount && (_jsxs("div", { className: "mt-2", children: [_jsx(Label, { children: "Page Count" }), _jsx("p", { children: result.pdfLib.pageCount })] })), result.pdfLib.error && (_jsxs("div", { className: "mt-4", children: [_jsx(Label, { className: "text-red-600", children: "Error" }), _jsx("pre", { className: "text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap", children: result.pdfLib.error })] })), result.pdfLib.stack && (_jsxs("div", { className: "mt-2", children: [_jsx(Label, { className: "text-red-600", children: "Stack Trace" }), _jsx("pre", { className: "text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap", children: result.pdfLib.stack })] }))] }) }) }), _jsx(TabsContent, { value: "pdfparse", children: _jsx("div", { className: "space-y-4 mt-4", children: _jsxs("div", { className: "bg-gray-50 p-4 rounded-md", children: [_jsxs("p", { className: "font-medium", children: ["Status: ", result.pdfParse.success ? 'Success' : 'Failed'] }), _jsx("p", { children: result.pdfParse.message }), result.pdfParse.success && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mt-3 grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Page Count" }), _jsx("p", { children: result.pdfParse.numpages })] }), _jsxs("div", { children: [_jsx(Label, { children: "Rendered Pages" }), _jsx("p", { children: result.pdfParse.numrender })] })] }), result.pdfParse.textPreview && (_jsxs("div", { className: "mt-4", children: [_jsx(Label, { children: "Text Preview" }), _jsx("pre", { className: "text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-40 whitespace-pre-wrap", children: result.pdfParse.textPreview })] })), result.pdfParse.info && (_jsxs("div", { className: "mt-4", children: [_jsx(Label, { children: "Document Info" }), _jsx("pre", { className: "text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-40 whitespace-pre-wrap", children: JSON.stringify(result.pdfParse.info, null, 2) })] }))] })), result.pdfParse.error && (_jsxs("div", { className: "mt-4", children: [_jsxs(Label, { className: "text-red-600", children: ["Error (", result.pdfParse.errorName, ")"] }), _jsx("pre", { className: "text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap", children: result.pdfParse.error })] })), result.pdfParse.errorStack && (_jsxs("div", { className: "mt-2", children: [_jsx(Label, { className: "text-red-600", children: "Stack Trace" }), _jsx("pre", { className: "text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-40 whitespace-pre-wrap", children: result.pdfParse.errorStack })] }))] }) }) })] }) })] }))] })] }));
}
