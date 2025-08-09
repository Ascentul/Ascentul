import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Copy, CheckCircle2, Lightbulb, FileText, MessageSquareText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export function ApplicationAssistant({ isOpen, onClose, jobTitle = '', companyName = '', jobDescription = '', }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assistanceData, setAssistanceData] = useState(null);
    const [copiedItems, setCopiedItems] = useState({});
    // Reset state when props change
    useEffect(() => {
        if (isOpen) {
            setAssistanceData(null);
            setError(null);
            setCopiedItems({});
            // Only auto-generate if we have at least job title and company
            if (jobTitle && companyName && jobDescription) {
                generateSuggestions();
            }
        }
    }, [isOpen, jobTitle, companyName, jobDescription]);
    const generateSuggestions = async () => {
        if (!jobTitle || !companyName || !jobDescription) {
            setError('Job information is incomplete. Please provide the job title, company, and description.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/jobs/ai-assist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobTitle,
                    companyName,
                    jobDescription,
                }),
            });
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            setAssistanceData(data);
        }
        catch (err) {
            console.error('Error generating application suggestions:', err);
            setError('Failed to generate application suggestions. Please try again later.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCopyText = (text, id) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedItems({ ...copiedItems, [id]: true });
            setTimeout(() => {
                setCopiedItems((prevState) => ({ ...prevState, [id]: false }));
            }, 2000);
        }, (err) => {
            console.error('Failed to copy text: ', err);
        });
    };
    // Mock data for when the real API response isn't available
    const mockAssistanceData = {
        suggestions: {
            resumeBulletPoints: [
                "Developed and implemented responsive web applications using React, TypeScript, and Node.js",
                "Led a team of 5 developers in delivering features on-time with 98% test coverage",
                "Reduced API response time by 40% through optimizing database queries and implementing caching",
                "Collaborated with UI/UX designers to implement design systems that improved user engagement by 25%",
                "Implemented CI/CD pipelines that reduced deployment time from hours to minutes"
            ],
            shortResponses: [
                {
                    question: "What interests you about working at our company?",
                    response: "I'm particularly drawn to your company's innovative approach to solving [specific problem]. Your commitment to [company value] aligns perfectly with my professional values, and I'm excited about the opportunity to contribute to projects like [specific project/product]. Additionally, I admire how your team has [recent company achievement]."
                },
                {
                    question: "Describe a challenging project you worked on",
                    response: "I led the migration of a legacy system to a modern microservices architecture while ensuring zero downtime. The challenge involved coordinating with multiple teams, creating a phased approach, and implementing comprehensive testing. Despite initial resistance and technical hurdles, we completed the migration ahead of schedule, resulting in a 35% improvement in system performance and significantly enhanced maintainability."
                },
                {
                    question: "How do you handle tight deadlines?",
                    response: "When facing tight deadlines, I first assess the scope and break it down into manageable tasks with clear priorities. I focus on delivering the most critical functionality first using an MVP approach. I maintain open communication with stakeholders about progress and potential obstacles, and I'm not afraid to ask for additional resources when necessary. For example, on a recent project, this approach allowed us to deliver key features on time while negotiating a short extension for less critical components."
                }
            ],
            coverLetterSnippets: [
                {
                    title: "Introduction",
                    content: "I am writing to express my interest in the [Job Title] position at [Company Name]. With [X] years of experience in [relevant field], I have developed a strong foundation in [key skills], and I am excited about the opportunity to bring my expertise to your team where innovation and quality are clearly valued."
                },
                {
                    title: "Experience Highlight",
                    content: "In my current role at [Current/Previous Company], I have successfully [key achievement with metrics]. This experience has strengthened my skills in [relevant skills], which I believe would be valuable for [specific responsibility or challenge mentioned in job description]."
                },
                {
                    title: "Conclusion",
                    content: "I am particularly drawn to [Company Name] because of your commitment to [company value or initiative]. I am excited about the possibility of contributing to your team and helping to [achieve specific goal]. Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills align with your needs."
                }
            ]
        }
    };
    // Use mock data if real data is not available and we're not loading
    const displayData = assistanceData ? assistanceData : (!loading ? mockAssistanceData : null);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] flex flex-col overflow-hidden", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "text-xl flex items-center gap-2", children: [_jsx(Lightbulb, { className: "h-5 w-5 text-yellow-500" }), "AI Application Assistant"] }), _jsx(DialogDescription, { children: "Get personalized suggestions to improve your job application" })] }), !jobTitle || !companyName || !jobDescription ? (_jsxs("div", { className: "p-6", children: [_jsxs(Alert, { className: "mb-4 bg-yellow-50 border-yellow-200 text-yellow-800", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Incomplete Job Information" }), _jsxs(AlertDescription, { children: ["Please provide job details to get personalized application suggestions. You need to have:", _jsxs("ul", { className: "list-disc ml-6 mt-2", children: [_jsx("li", { children: "Job title" }), _jsx("li", { children: "Company name" }), _jsx("li", { children: "Job description" })] })] })] }), _jsx("div", { className: "flex justify-center", children: _jsx(Button, { onClick: onClose, children: "Close" }) })] })) : loading ? (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-6", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary mb-4" }), _jsx("p", { className: "text-center text-muted-foreground", children: "Analyzing job details and generating personalized suggestions..." })] })) : error ? (_jsxs("div", { className: "p-6", children: [_jsxs(Alert, { variant: "destructive", className: "mb-4", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Close" }), _jsx(Button, { onClick: generateSuggestions, children: "Try Again" })] })] })) : (_jsx("div", { className: "flex-1 overflow-auto p-1", children: _jsxs(Tabs, { defaultValue: "resume", className: "w-full", children: [_jsxs(TabsList, { className: "w-full mb-4", children: [_jsxs(TabsTrigger, { value: "resume", className: "flex items-center gap-1", children: [_jsx(FileText, { className: "h-4 w-4" }), "Resume Points"] }), _jsxs(TabsTrigger, { value: "responses", className: "flex items-center gap-1", children: [_jsx(MessageSquareText, { className: "h-4 w-4" }), "Response Templates"] }), _jsxs(TabsTrigger, { value: "cover", className: "flex items-center gap-1", children: [_jsx(FileText, { className: "h-4 w-4" }), "Cover Letter"] })] }), _jsx(TabsContent, { value: "resume", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Resume Bullet Points" }), _jsx(CardDescription, { children: "Tailored bullet points to highlight your relevant skills for this position" })] }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-4", children: displayData?.suggestions.resumeBulletPoints.map((point, index) => (_jsxs("li", { className: "flex justify-between border p-3 rounded-md", children: [_jsx("span", { className: "flex-1", children: point }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleCopyText(point, `resume-${index}`), children: copiedItems[`resume-${index}`] ? (_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" })) : (_jsx(Copy, { className: "h-4 w-4" })) })] }, `resume-${index}`))) }) })] }) }), _jsx(TabsContent, { value: "responses", className: "space-y-4", children: displayData?.suggestions.shortResponses.map((item, index) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: item.question }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-gray-700", children: item.response }) }), _jsx(CardFooter, { className: "flex justify-end", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleCopyText(item.response, `response-${index}`), className: "flex items-center gap-1", children: copiedItems[`response-${index}`] ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }), "Copied!"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "h-4 w-4" }), "Copy Response"] })) }) })] }, `response-${index}`))) }), _jsx(TabsContent, { value: "cover", className: "space-y-4", children: displayData?.suggestions.coverLetterSnippets.map((snippet, index) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: snippet.title }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-gray-700", children: snippet.content }) }), _jsx(CardFooter, { className: "flex justify-end", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleCopyText(snippet.content, `cover-${index}`), className: "flex items-center gap-1", children: copiedItems[`cover-${index}`] ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "h-4 w-4 text-green-500" }), "Copied!"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "h-4 w-4" }), "Copy Snippet"] })) }) })] }, `cover-${index}`))) })] }) })), _jsxs(CardFooter, { className: "flex justify-between border-t pt-4 mt-auto", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "\uD83D\uDCA1 Suggestions are AI-generated and should be customized to your experience" }), _jsx(Button, { variant: "default", onClick: onClose, children: "Close" })] })] }) }));
}
