import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
const JobDescriptionInput = ({ value, onChange, required = true, className = '', id = 'jobDescription', minLength = 100, isAnalyzing = false, placeholder = "Paste the job description here to compare with your resume...", }) => {
    const [jobDescQuality, setJobDescQuality] = useState('empty');
    const [charCount, setCharCount] = useState(0);
    // Update quality rating and character count when value changes
    useEffect(() => {
        const trimmedValue = value.trim();
        setCharCount(trimmedValue.length);
        if (!trimmedValue) {
            setJobDescQuality('empty');
        }
        else if (trimmedValue.length < 50) {
            setJobDescQuality('poor');
        }
        else if (trimmedValue.length < minLength) {
            setJobDescQuality('fair');
        }
        else {
            setJobDescQuality('good');
        }
    }, [value, minLength]);
    const handleChange = (e) => {
        onChange(e.target.value);
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "flex justify-between items-center", children: jobDescQuality === 'good' && !isAnalyzing && (_jsxs("div", { className: "flex items-center text-green-600 text-xs", children: [_jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }), _jsxs("span", { children: ["Good length (", charCount, " characters)"] })] })) }), _jsx(Textarea, { id: id, placeholder: placeholder, className: `resize-y border-2 mb-4 ${jobDescQuality === 'good' ? 'border-green-200 focus:border-green-300' :
                    jobDescQuality === 'fair' ? 'border-amber-200 focus:border-amber-300' :
                        jobDescQuality === 'poor' ? 'border-red-200 focus:border-red-300' :
                            'border-primary/20 focus:border-primary/40'} ${className}`, value: value, onChange: handleChange, disabled: isAnalyzing }), isAnalyzing && (_jsxs("div", { className: "flex items-center space-x-2 text-primary/80 mb-4", children: [_jsx(Loader2, { className: "animate-spin h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Analyzing with AI..." })] })), !isAnalyzing && jobDescQuality === 'poor' && (_jsxs(Alert, { variant: "destructive", className: "py-2 mb-4", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { className: "text-sm font-medium", children: "Job Description Too Short" }), _jsx(AlertDescription, { className: "text-xs", children: "Please provide a more detailed job description (at least 50 characters) for accurate analysis." })] })), !isAnalyzing && jobDescQuality === 'fair' && (_jsxs(Alert, { className: "bg-amber-50 border-amber-200 py-2 mb-4", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-amber-600" }), _jsx(AlertTitle, { className: "text-sm font-medium text-amber-700", children: "Job Description Could Be Better" }), _jsxs(AlertDescription, { className: "text-xs text-amber-700", children: ["For accurate AI analysis, a more detailed job description (", minLength, "+ characters) with specific skills, responsibilities, and requirements is recommended."] })] }))] }));
};
export default JobDescriptionInput;
