import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, CheckCircle2, Upload, FileText, BarChart, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
// Form schema for resume upload and analysis
const resumeAnalysisSchema = z.object({
    resumeText: z.string().min(100, "Resume text should be at least 100 characters long"),
    jobDescription: z.string().min(50, "Job description should be at least 50 characters long"),
});
const ResumeAnalysis = () => {
    const [activeTab, setActiveTab] = useState("upload");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [resumeContent, setResumeContent] = useState("");
    const [fileUploading, setFileUploading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    // Form for manual text input and job description
    const form = useForm({
        resolver: zodResolver(resumeAnalysisSchema),
        defaultValues: {
            resumeText: "",
            jobDescription: "",
        },
    });
    // Mutation for analyzing resume
    const analyzeResumeMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest({
                url: '/api/resumes/analyze',
                method: 'POST',
                data
            });
            return response;
        },
        onSuccess: (data) => {
            setAnalysis(data);
            setActiveTab("results");
            toast({
                title: "Analysis complete",
                description: "Your resume has been analyzed against the job description.",
            });
        },
        onError: (error) => {
            toast({
                title: "Analysis failed",
                description: error.message || "There was an error analyzing your resume. Please try again.",
                variant: "destructive",
            });
        }
    });
    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        const file = files[0];
        // Check if it's a PDF or Word document
        if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF or Word document.",
                variant: "destructive",
            });
            return;
        }
        setUploadedFile(file);
        setFileUploading(true);
        try {
            // Read the file as a data URL
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target) {
                    const fileDataUrl = event.target.result;
                    // Upload the file to the server
                    const uploadResponse = await apiRequest({
                        url: '/api/resumes/upload',
                        method: 'POST',
                        data: { fileDataUrl }
                    });
                    if (uploadResponse.success) {
                        // For now, we'll simulate text extraction
                        // In a real app, we'd use the server to extract text from the PDF or Word document
                        setExtractedText(`Sample resume text extracted from ${file.name}. 
            
In a production environment, we would parse the actual text content from your resume file. For now, please copy and paste your resume content into the text area below for analysis.`);
                        toast({
                            title: "File uploaded successfully",
                            description: "Please review or edit the extracted text before analysis.",
                        });
                        setActiveTab("extract");
                    }
                }
                setFileUploading(false);
            };
            reader.onerror = () => {
                toast({
                    title: "File reading failed",
                    description: "There was an error reading your file. Please try again.",
                    variant: "destructive",
                });
                setFileUploading(false);
            };
            reader.readAsDataURL(file);
        }
        catch (error) {
            toast({
                title: "Upload failed",
                description: "There was an error uploading your file. Please try again.",
                variant: "destructive",
            });
            setFileUploading(false);
        }
    };
    // Handle form submission
    const onSubmit = (values) => {
        analyzeResumeMutation.mutate(values);
    };
    // Handle analysis from extracted text
    const handleAnalyzeExtracted = () => {
        if (!resumeContent) {
            toast({
                title: "Missing resume content",
                description: "Please enter your resume content for analysis.",
                variant: "destructive",
            });
            return;
        }
        form.setValue("resumeText", resumeContent);
        setActiveTab("analyze");
    };
    return (_jsxs("div", { className: "container max-w-5xl mx-auto py-6 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Resume Analysis" }), _jsx("p", { className: "text-muted-foreground", children: "Upload your resume and paste a job description to get AI-powered analysis and improvement suggestions." }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-4", children: [_jsx(TabsTrigger, { value: "upload", children: "Upload Resume" }), _jsx(TabsTrigger, { value: "extract", children: "Extract Text" }), _jsx(TabsTrigger, { value: "analyze", children: "Analyze" }), _jsx(TabsTrigger, { value: "results", disabled: !analysis, children: "Results" })] }), _jsx(TabsContent, { value: "upload", className: "mt-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Upload Your Resume" }), _jsx(CardDescription, { children: "Upload your resume in PDF or Word format to analyze it against a job description." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-12 text-center", children: [_jsx(Upload, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsxs("div", { className: "mt-4 flex text-sm leading-6 text-gray-600", children: [_jsxs("label", { htmlFor: "file-upload", className: "relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80", children: [_jsx("span", { children: "Upload a file" }), _jsx(Input, { id: "file-upload", name: "file-upload", type: "file", className: "sr-only", accept: ".pdf,.doc,.docx", onChange: handleFileUpload, disabled: fileUploading })] }), _jsx("p", { className: "pl-1", children: "or drag and drop" })] }), _jsx("p", { className: "text-xs leading-5 text-gray-600", children: "PDF or Word up to 10MB" })] }), fileUploading && (_jsxs("div", { className: "flex flex-col items-center justify-center mt-4", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Uploading file..." })] })), uploadedFile && !fileUploading && (_jsxs("div", { className: "flex items-center space-x-2 bg-primary/10 p-4 rounded-md", children: [_jsx(FileText, { className: "h-6 w-6 text-primary" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: uploadedFile.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [Math.round(uploadedFile.size / 1024), " KB"] })] }), _jsx(CheckCircle2, { className: "h-5 w-5 text-green-500" })] }))] }), _jsx(CardFooter, { children: _jsxs(Button, { type: "button", className: "ml-auto", disabled: !uploadedFile || fileUploading, onClick: () => setActiveTab("extract"), children: ["Continue ", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] }) })] }) }), _jsx(TabsContent, { value: "extract", className: "mt-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Extract and Edit Resume Text" }), _jsx(CardDescription, { children: "Review or edit the extracted text before analysis." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Resume Text Extraction" }), _jsx(AlertDescription, { children: "In a production environment, we would automatically extract text from your resume. For now, please review, edit, or paste your resume content below." })] }), _jsx(Textarea, { placeholder: "Paste or edit your resume text here...", className: "min-h-[300px]", value: resumeContent || extractedText, onChange: (e) => setResumeContent(e.target.value) })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setActiveTab("upload"), children: "Back" }), _jsxs(Button, { type: "button", onClick: handleAnalyzeExtracted, disabled: !resumeContent && !extractedText, children: ["Continue ", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] })] })] }) }), _jsx(TabsContent, { value: "analyze", className: "mt-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Analyze Your Resume" }), _jsx(CardDescription, { children: "Enter a job description to analyze your resume against it." })] }), _jsx(CardContent, { children: _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "resumeText", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Resume Text" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Paste your resume text here...", className: "min-h-[200px]", ...field, defaultValue: resumeContent || field.value }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobDescription", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Paste the job description here...", className: "min-h-[200px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setActiveTab("extract"), children: "Back" }), _jsx(Button, { type: "submit", disabled: analyzeResumeMutation.isPending, children: analyzeResumeMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Analyzing..."] })) : (_jsxs(_Fragment, { children: ["Upload & Analyze", _jsx(BarChart, { className: "ml-2 h-4 w-4" })] })) })] })] }) }) })] }) }), _jsx(TabsContent, { value: "results", className: "mt-6", children: analysis && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Resume Analysis Results" }), _jsx(CardDescription, { children: "Here's how your resume compares to the job description." })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("p", { className: "text-sm font-medium", children: "Overall Match" }), _jsxs("p", { className: "text-sm font-medium", children: [analysis.overallScore, "%"] })] }), _jsx(Progress, { value: analysis.overallScore, className: "h-2" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("p", { className: "text-sm font-medium", children: "Keyword Match" }), _jsxs("p", { className: "text-sm font-medium", children: [analysis.keywordMatchScore, "%"] })] }), _jsx(Progress, { value: analysis.keywordMatchScore, className: "h-2" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("p", { className: "text-sm font-medium", children: "Experience Relevance" }), _jsxs("p", { className: "text-sm font-medium", children: [analysis.relevanceScore, "%"] })] }), _jsx(Progress, { value: analysis.relevanceScore, className: "h-2" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Strengths" }), _jsx("ul", { className: "space-y-2", children: analysis.strengths.map((strength, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-green-500 mr-2 mt-0.5" }), _jsx("span", { children: strength })] }, i))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Areas for Improvement" }), _jsx("ul", { className: "space-y-2", children: analysis.weaknesses.map((weakness, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-amber-500 mr-2 mt-0.5" }), _jsx("span", { children: weakness })] }, i))) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Missing Keywords" }), _jsx("div", { className: "flex flex-wrap gap-2", children: analysis.missingKeywords.map((keyword, i) => (_jsx("span", { className: "bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm", children: keyword }, i))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Improvement Suggestions" }), _jsx("ul", { className: "space-y-2", children: analysis.improvementSuggestions.map((suggestion, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mr-2 mt-0.5" }), _jsx("span", { children: suggestion })] }, i))) })] })] }), _jsxs(CardFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setActiveTab("analyze"), className: "mr-2", children: "Edit and Reanalyze" }), _jsx(Button, { onClick: () => {
                                                        // Reset the form and state for a new analysis
                                                        form.reset();
                                                        setUploadedFile(null);
                                                        setResumeContent("");
                                                        setExtractedText("");
                                                        setAnalysis(null);
                                                        setActiveTab("upload");
                                                    }, children: "Start New Analysis" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Technical Skills Assessment" }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: analysis.technicalSkillAssessment.map((assessment, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mr-2 mt-0.5" }), _jsx("span", { children: assessment })] }, i))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Soft Skills Assessment" }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: analysis.softSkillAssessment.map((assessment, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mr-2 mt-0.5" }), _jsx("span", { children: assessment })] }, i))) }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Formatting and Structure Feedback" }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: analysis.formattingFeedback.map((feedback, i) => (_jsxs("li", { className: "flex items-start", children: [_jsx(ChevronRight, { className: "h-5 w-5 text-primary mr-2 mt-0.5" }), _jsx("span", { children: feedback })] }, i))) }) })] })] })) })] })] }));
};
export default ResumeAnalysis;
