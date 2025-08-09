import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Mail, Download, Copy, Trash2, Edit, FileText, Sparkles, BarChart4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CoverLetterForm from "@/components/CoverLetterForm";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
export default function CoverLetter() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [previewLetter, setPreviewLetter] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Fetch user's cover letters
    const { data: coverLetters = [], isLoading } = useQuery({
        queryKey: ["/api/cover-letters"]
    });
    // AI generation form fields
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [userExperience, setUserExperience] = useState("");
    const [userSkills, setUserSkills] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    // Analysis form fields
    const [analyzeJobDescription, setAnalyzeJobDescription] = useState("");
    const [analyzeCoverLetterText, setAnalyzeCoverLetterText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const deleteCoverLetterMutation = useMutation({
        mutationFn: async (letterId) => {
            return apiRequest("DELETE", `/api/cover-letters/${letterId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Cover Letter Deleted",
                description: "Your cover letter has been deleted successfully"
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to delete cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const duplicateCoverLetterMutation = useMutation({
        mutationFn: async (letter) => {
            const newLetter = {
                ...letter,
                name: `${letter.name} (Copy)`
            };
            delete newLetter.id;
            delete newLetter.createdAt;
            delete newLetter.updatedAt;
            return apiRequest("POST", "/api/cover-letters", newLetter);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Cover Letter Duplicated",
                description: "A copy of your cover letter has been created"
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to duplicate cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const generateCoverLetterMutation = useMutation({
        mutationFn: async () => {
            const skillsArray = userSkills.split(",").map((skill) => skill.trim());
            const res = await apiRequest("POST", "/api/cover-letters/generate", {
                jobTitle,
                companyName,
                jobDescription,
                userExperience,
                userSkills: skillsArray
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Cover Letter Generated",
                description: "AI has generated a cover letter for you"
            });
            setGeneratedContent(data.content);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to generate cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const analyzeCoverLetterMutation = useMutation({
        mutationFn: async () => {
            if (!analyzeJobDescription || !analyzeCoverLetterText) {
                throw new Error("Both job description and cover letter are required");
            }
            const res = await apiRequest("POST", "/api/cover-letters/analyze", {
                coverLetter: analyzeCoverLetterText,
                jobDescription: analyzeJobDescription
            });
            return res.json();
        },
        onSuccess: (data) => {
            setAnalysisResult(data);
            toast({
                title: "Analysis Complete",
                description: "Your cover letter has been analyzed successfully"
            });
        },
        onError: (error) => {
            toast({
                title: "Analysis Failed",
                description: `Error analyzing cover letter: ${error.message}`,
                variant: "destructive"
            });
        }
    });
    const handleDeleteLetter = (letterId) => {
        if (confirm("Are you sure you want to delete this cover letter?")) {
            deleteCoverLetterMutation.mutate(letterId);
        }
    };
    const handleSaveGenerated = () => {
        if (!generatedContent)
            return;
        // Create a new letter with the generated content
        const newLetter = {
            name: `${jobTitle} at ${companyName}`,
            template: "standard",
            content: {
                header: {
                    fullName: "",
                    email: "",
                    phone: "",
                    location: "",
                    date: new Date().toLocaleDateString()
                },
                recipient: {
                    name: "",
                    company: companyName,
                    position: "Hiring Manager",
                    address: ""
                },
                body: generatedContent,
                closing: "Sincerely,"
            }
        };
        // Create a new cover letter with the mutation
        apiRequest("POST", "/api/cover-letters", newLetter)
            .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Cover Letter Saved",
                description: "Your generated cover letter has been saved"
            });
            setGeneratedContent("");
            setJobTitle("");
            setCompanyName("");
            setJobDescription("");
            setUserExperience("");
            setUserSkills("");
        })
            .catch((error) => {
            toast({
                title: "Error",
                description: `Failed to save cover letter: ${error.message}`,
                variant: "destructive"
            });
        });
    };
    const filteredLetters = () => {
        if (!coverLetters)
            return [];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return coverLetters.filter((letter) => letter.name.toLowerCase().includes(query));
        }
        return coverLetters;
    };
    const generateCoverLetter = () => {
        if (!jobTitle ||
            !companyName ||
            !jobDescription ||
            !userExperience ||
            !userSkills) {
            toast({
                title: "Missing Information",
                description: "Please fill out all fields to generate a cover letter",
                variant: "destructive"
            });
            return;
        }
        generateCoverLetterMutation.mutate();
    };
    const handleAnalyzeCoverLetter = () => {
        if (!analyzeJobDescription || !analyzeCoverLetterText) {
            toast({
                title: "Missing Information",
                description: "Please provide both a job description and cover letter to analyze",
                variant: "destructive"
            });
            return;
        }
        analyzeCoverLetterMutation.mutate();
    };
    const handleSaveOptimizedCoverLetter = () => {
        if (!analysisResult?.optimizedCoverLetter)
            return;
        // Create a new letter with the optimized content
        const newLetter = {
            name: `Optimized Cover Letter ${new Date().toLocaleDateString()}`,
            template: "standard",
            content: {
                header: {
                    fullName: "",
                    email: "",
                    phone: "",
                    location: "",
                    date: new Date().toLocaleDateString()
                },
                recipient: {
                    name: "",
                    company: "",
                    position: "Hiring Manager",
                    address: ""
                },
                body: analysisResult.optimizedCoverLetter,
                closing: "Sincerely,"
            }
        };
        // Create a new cover letter with the mutation
        apiRequest("POST", "/api/cover-letters", newLetter)
            .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/cover-letters"] });
            toast({
                title: "Optimized Cover Letter Saved",
                description: "Your optimized cover letter has been saved"
            });
            setAnalysisResult(null);
            setAnalyzeJobDescription("");
            setAnalyzeCoverLetterText("");
        })
            .catch((error) => {
            toast({
                title: "Error",
                description: `Failed to save optimized cover letter: ${error.message}`,
                variant: "destructive"
            });
        });
    };
    // Function to download cover letter as PDF
    const handleDownloadPDF = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) {
            toast({
                title: "Error",
                description: "Could not find the cover letter content to download",
                variant: "destructive"
            });
            return;
        }
        // Create a filename based on letter name or default
        const letterName = previewLetter?.name || "cover-letter";
        const filename = `${letterName
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}.pdf`;
        // Clone the element to modify it for PDF generation
        const clonedElement = element.cloneNode(true);
        clonedElement.style.padding = "20px";
        clonedElement.style.border = "none";
        // Create the print window
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast({
                title: "Error",
                description: "Unable to open print window. Please check your popup settings.",
                variant: "destructive"
            });
            return;
        }
        // Setup the print document
        printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 0; }
            .cover-letter-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
            h2 { margin-top: 0; }
            p { margin: 0 0 8px; line-height: 1.5; }
            @media print {
              body { padding: 0; margin: 0; }
              .cover-letter-container { width: 100%; max-width: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="cover-letter-container">
            ${clonedElement.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };
    // Animation variants - optimized for performance
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
    };
    const subtleUp = {
        hidden: { opacity: 0, y: 8 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };
    const cardAnimation = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };
    const staggeredContainer = {
        hidden: { opacity: 1 }, // Start with opacity 1 for container
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05, // Stagger children animations
                delayChildren: 0.1 // Small delay before starting animations
            }
        }
    };
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", variants: subtleUp, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold font-poppins", children: "Cover Letters" }), _jsx("p", { className: "text-neutral-500", children: "Create targeted cover letters for your job applications" })] }), _jsxs(Button, { className: "mt-4 md:mt-0", onClick: () => {
                            setSelectedLetter(null);
                            setIsAddLetterOpen(true);
                        }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Cover Letter"] })] }), _jsxs(Tabs, { defaultValue: "letters", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsx(TabsTrigger, { value: "letters", children: "My Cover Letters" }), _jsx(TabsTrigger, { value: "generator", children: "AI Generator" }), _jsx(TabsTrigger, { value: "analyze", children: "Analyze" })] }), _jsxs(TabsContent, { value: "letters", className: "space-y-6", children: [_jsxs("div", { className: "relative max-w-md", children: [_jsx(Input, { placeholder: "Search cover letters...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" }), _jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }) })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : coverLetters &&
                                Array.isArray(coverLetters) &&
                                coverLetters.length > 0 ? (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", variants: staggeredContainer, children: filteredLetters().map((letter, i) => (_jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: "translateZ(0)" }, children: _jsxs(Card, { className: "overflow-hidden group hover:shadow-md transition-shadow duration-200", children: [_jsx(CardContent, { className: "p-0", children: _jsxs("div", { className: "bg-primary/5 p-6 flex items-center", children: [_jsx(Mail, { className: "h-10 w-10 text-primary mr-4" }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: letter.name }), _jsxs("p", { className: "text-sm text-neutral-500", children: [letter.template.charAt(0).toUpperCase() +
                                                                            letter.template.slice(1), " ", "Template"] }), _jsxs("p", { className: "text-xs text-neutral-400 mt-1", children: ["Last updated:", " ", new Date(letter.updatedAt).toLocaleDateString()] })] })] }) }), _jsxs(CardFooter, { className: "p-4 flex justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPreviewLetter(letter), children: "Preview" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => {
                                                                    setSelectedLetter(letter);
                                                                    setIsAddLetterOpen(true);
                                                                }, children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => duplicateCoverLetterMutation.mutate(letter), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleDeleteLetter(letter.id), children: _jsx(Trash2, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-primary hover:text-primary/80", onClick: () => {
                                                                    // Create a hidden div for the cover letter content
                                                                    const hiddenDiv = document.createElement("div");
                                                                    hiddenDiv.id = `temp-letter-${letter.id}`;
                                                                    hiddenDiv.style.position = "absolute";
                                                                    hiddenDiv.style.left = "-9999px";
                                                                    hiddenDiv.style.top = "-9999px";
                                                                    // Add cover letter content to the hidden div
                                                                    hiddenDiv.innerHTML = `
                              <div class="bg-white p-6">
                                <!-- Header with contact info -->
                                <div class="mb-6">
                                  <h2 class="text-xl font-bold">
                                    ${letter.content.header.fullName}
                                  </h2>
                                  <!-- Job title -->
                                  <div class="text-lg text-neutral-800 mt-1">
                                    ${letter.content.header.jobTitle ||
                                                                        letter.content.recipient.position ||
                                                                        ""}
                                  </div>
                                  <!-- Contact info in single line with separators -->
                                  <div class="text-sm text-neutral-600 mt-2">
                                    ${letter.content.header.email
                                                                        ? `${letter.content.header.email}`
                                                                        : ""}
                                    ${letter.content.header.linkedin
                                                                        ? ` | ${letter.content.header.linkedin}`
                                                                        : ""}
                                    ${letter.content.header.phone
                                                                        ? ` | ${letter.content.header.phone}`
                                                                        : ""}
                                  </div>
                                </div>
                                
                                <!-- Date -->
                                <div class="mb-3">
                                  <p>${letter.content.header.date}</p>
                                </div>
                                
                                <!-- Company -->
                                <div class="mb-6">
                                  <p>${letter.content.recipient.company || ""}</p>
                                </div>
                                
                                <!-- Greeting -->
                                <div class="mb-6">
                                  <p>Dear ${letter.content.recipient.name ||
                                                                        "Hiring Manager"},</p>
                                </div>
                                
                                <!-- Body -->
                                <div class="mb-6 whitespace-pre-line">
                                  ${letter.content.body}
                                </div>
                                
                                <!-- Closing -->
                                <div>
                                  <p>${letter.content.closing || "Sincerely,"}</p>
                                  <p class="mt-6">${letter.content.header.fullName}</p>
                                </div>
                              </div>
                            `;
                                                                    // Append the hidden div to the document
                                                                    document.body.appendChild(hiddenDiv);
                                                                    // Download the cover letter
                                                                    handleDownloadPDF(`temp-letter-${letter.id}`);
                                                                    // Remove the hidden div after a delay
                                                                    setTimeout(() => {
                                                                        document.body.removeChild(hiddenDiv);
                                                                    }, 2000);
                                                                }, children: _jsx(Download, { className: "h-4 w-4" }) })] })] })] }) }, letter.id))) })) : (_jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow-sm", children: [_jsx(Mail, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Cover Letters Created Yet" }), _jsx("p", { className: "text-neutral-500 mb-4", children: "Start by creating your first professional cover letter" }), _jsxs(Button, { onClick: () => {
                                            setSelectedLetter(null);
                                            setIsAddLetterOpen(true);
                                        }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create First Cover Letter"] })] }))] }), _jsx(TabsContent, { value: "analyze", className: "space-y-6", children: _jsx("div", { className: "bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden p-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(BarChart4, { className: "h-5 w-5 text-primary" }), _jsx("h3", { className: "text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent", children: "Cover Letter Analysis" })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 text-sm leading-relaxed", children: "Get AI-powered feedback on your cover letter and suggestions to improve it for a specific job opportunity." }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-primary", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }), _jsx("path", { d: "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" }), _jsx("path", { d: "M12 11h4" }), _jsx("path", { d: "M12 16h4" }), _jsx("path", { d: "M8 11h.01" }), _jsx("path", { d: "M8 16h.01" })] }), "Job Description"] }), _jsx(Textarea, { placeholder: "Paste the job description here...", value: analyzeJobDescription, onChange: (e) => setAnalyzeJobDescription(e.target.value), className: "min-h-[120px] rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-primary", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), _jsx("polyline", { points: "14 2 14 8 20 8" }), _jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), _jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), _jsx("line", { x1: "10", y1: "9", x2: "8", y2: "9" })] }), "Your Cover Letter"] }), _jsx(Textarea, { placeholder: "Paste your cover letter text here...", value: analyzeCoverLetterText, onChange: (e) => setAnalyzeCoverLetterText(e.target.value), className: "min-h-[200px] rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsx(Button, { className: "px-5 py-2 rounded-md text-sm font-medium shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors", onClick: handleAnalyzeCoverLetter, disabled: analyzeCoverLetterMutation.isPending, children: analyzeCoverLetterMutation.isPending ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Analyzing..."] })) : (_jsxs(_Fragment, { children: [_jsx(BarChart4, { className: "mr-2 h-4 w-4" }), "Analyze Cover Letter"] })) })] })] }), _jsxs("div", { className: "border-l border-gray-200 dark:border-gray-800 pl-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Sparkles, { className: "h-5 w-5 text-blue-500" }), _jsx("h3", { className: "text-lg font-semibold text-gray-800 dark:text-gray-200", children: "Analysis Results" })] }), !analysisResult ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-[400px] py-12 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800", children: [_jsx(Sparkles, { className: "h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm max-w-md", children: "Submit your cover letter and job description to see AI-powered analysis and suggestions." }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-xs mt-3 max-w-xs", children: "Our AI will analyze your cover letter for job fit, clarity, and persuasiveness" })] })) : (_jsxs("div", { className: "space-y-5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 max-h-[600px] overflow-y-auto", children: [_jsxs("div", { className: "grid grid-cols-4 gap-3", children: [_jsxs("div", { className: "flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("span", { className: "text-xl font-bold text-blue-600", children: Math.round(analysisResult.overallScore) }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Overall" })] }), _jsxs("div", { className: "flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("span", { className: "text-xl font-bold text-blue-600", children: Math.round(analysisResult.alignment) }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Alignment" })] }), _jsxs("div", { className: "flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("span", { className: "text-xl font-bold text-blue-600", children: Math.round(analysisResult.persuasiveness) }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Persuasive" })] }), _jsxs("div", { className: "flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("span", { className: "text-xl font-bold text-blue-600", children: Math.round(analysisResult.clarity) }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Clarity" })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-green-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" }), _jsx("path", { d: "m9 12 2 2 4-4" })] }), "Strengths"] }), _jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm", children: analysisResult.strengths.map((strength, index) => (_jsx("li", { className: "text-gray-700 dark:text-gray-300", children: strength }, index))) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-amber-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }), _jsx("path", { d: "M12 9v4" }), _jsx("path", { d: "M12 17h.01" })] }), "Areas to Improve"] }), _jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm", children: analysisResult.weaknesses.map((weakness, index) => (_jsx("li", { className: "text-gray-700 dark:text-gray-300", children: weakness }, index))) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "m15 9-6 6" }), _jsx("path", { d: "m9 9 6 6" })] }), "Improvement Suggestions"] }), _jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm", children: analysisResult.improvementSuggestions.map((suggestion, index) => (_jsx("li", { className: "text-gray-700 dark:text-gray-300", children: suggestion }, index))) })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm", children: [_jsxs("h4", { className: "text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-indigo-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 20h9" }), _jsx("path", { d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" })] }), "Optimized Cover Letter"] }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-y-auto", children: _jsx("p", { className: "whitespace-pre-line text-sm text-gray-700 dark:text-gray-300", children: analysisResult.optimizedCoverLetter }) }), _jsxs(Button, { className: "w-full mt-3 px-5 py-2 rounded-md text-sm font-medium shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors", onClick: handleSaveOptimizedCoverLetter, children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Save Optimized Version"] })] })] }))] })] }) }) }), _jsx(TabsContent, { value: "generator", children: _jsx("div", { className: "bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden p-6 max-w-[1200px] mx-auto", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-blue-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M9.663 17h4.673M12 11v9M5 9l3-3 4 2 3-3 4 2v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm0 4h2m10 0h2" }) }), _jsx("h3", { className: "text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Generate Cover Letter Content" })] }), _jsxs("div", { className: "bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }), _jsx("path", { d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9Z" }), _jsx("path", { d: "M12 13h4" }), _jsx("path", { d: "M12 17h4" }), _jsx("path", { d: "M12 9h4" })] }), "Job Title"] }), _jsx(Input, { placeholder: "e.g., Software Engineer", value: jobTitle, onChange: (e) => setJobTitle(e.target.value), className: "rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }) }), "Company Name"] }), _jsx(Input, { placeholder: "e.g., Acme Inc.", value: companyName, onChange: (e) => setCompanyName(e.target.value), className: "rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }), _jsx("path", { d: "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" }), _jsx("path", { d: "M12 11h4" }), _jsx("path", { d: "M12 16h4" }), _jsx("path", { d: "M8 11h.01" }), _jsx("path", { d: "M8 16h.01" })] }), "Job Description"] }), _jsx(Textarea, { placeholder: "Paste the job description here...", value: jobDescription, onChange: (e) => setJobDescription(e.target.value), className: "min-h-[100px] rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 12h-1a4 4 0 0 0 0 8h1" }), _jsx("path", { d: "M18 8h-5a4 4 0 0 0-4 4h9" }), _jsx("path", { d: "M18 12v6" }), _jsx("path", { d: "M21 18h-8" }), _jsx("path", { d: "M2 8h8" }), _jsx("path", { d: "M10 8a5 5 0 0 0-5-5" }), _jsx("path", { d: "M7 8a2 2 0 0 1 0-4" })] }), "Your Relevant Experience"] }), _jsx(Textarea, { placeholder: "Briefly describe your relevant experience for this position...", value: userExperience, onChange: (e) => setUserExperience(e.target.value), className: "min-h-[100px] rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.95 1 4.8a7.86 7.86 0 0 0 .13 4.04" }), _jsx("path", { d: "M19.79 16.95a3.07 3.07 0 0 0-2.241-2.15 3.33 3.33 0 0 0-2.23 0c-.95.386-1.92 1.151-2.74 1.85a3.33 3.33 0 0 0-2.23 0 3.07 3.07 0 0 0-2.24 2.15" })] }), "Your Skills (comma separated)"] }), _jsx(Input, { placeholder: "e.g., JavaScript, React, Project Management", value: userSkills, onChange: (e) => setUserSkills(e.target.value), className: "rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 flex space-x-3", children: [_jsx(Button, { className: "px-5 py-2 rounded-md text-sm font-medium shadow-sm border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white transition-colors", variant: "outline", onClick: () => {
                                                                    setJobTitle("");
                                                                    setCompanyName("");
                                                                    setJobDescription("");
                                                                    setUserExperience("");
                                                                    setUserSkills("");
                                                                }, disabled: generateCoverLetterMutation.isPending, children: "Get Suggestions" }), _jsx(Button, { className: "px-5 py-2 rounded-md text-sm font-medium shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-lg", onClick: generateCoverLetter, disabled: generateCoverLetterMutation.isPending, children: generateCoverLetterMutation.isPending ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Generating..."] })) : (_jsxs("span", { className: "flex items-center", children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "Generate Full Letter"] })) })] })] })] }), _jsxs("div", { className: "border-l border-gray-200 dark:border-gray-800 pl-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" }), _jsx("path", { d: "M3 4h18v4H3z" }), _jsx("path", { d: "M12 12v6" }), _jsx("path", { d: "M8 12h8" })] }), "AI-Generated Content"] }), generatedContent && (_jsxs(Button, { variant: "outline", size: "sm", onClick: handleSaveGenerated, className: "rounded-md text-sm flex items-center gap-1 border border-gray-300 hover:border-gray-400 transition-colors bg-white", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-blue-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }), _jsx("polyline", { points: "17 21 17 13 7 13 7 21" }), _jsx("polyline", { points: "7 3 7 8 15 8" })] }), "Save to Library"] }))] }), _jsx("div", { className: "bg-blue-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-[400px] shadow-sm", children: generatedContent ? (_jsxs("div", { className: "prose prose-sm max-w-none", id: "generatedContent", children: [_jsx("pre", { className: "whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300", children: generatedContent }), generatedContent && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700", children: _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: ["Generated at ", new Date().toLocaleTimeString(), " \u2022 AI-powered content"] }) }))] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center h-full py-12 text-center", children: [_jsx(FileText, { className: "h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Fill out the form and generate a professional cover letter" }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-xs mt-2 max-w-md", children: "Our AI will craft a personalized cover letter based on the job description and your skills" })] })) })] })] }) }) })] }), _jsx(Dialog, { open: isAddLetterOpen, onOpenChange: setIsAddLetterOpen, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: selectedLetter ? "Edit Cover Letter" : "Create Cover Letter" }) }), _jsx(CoverLetterForm, { initialData: selectedLetter, onSubmit: async (data) => {
                                try {
                                    const response = await fetch(selectedLetter
                                        ? `/api/cover-letters/${selectedLetter.id}`
                                        : "/api/cover-letters", {
                                        method: selectedLetter ? "PUT" : "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(data)
                                    });
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || "Failed to save cover letter");
                                    }
                                    await queryClient.invalidateQueries({
                                        queryKey: ["/api/cover-letters"]
                                    });
                                    setIsAddLetterOpen(false);
                                    toast({
                                        title: `Cover Letter ${selectedLetter ? "Updated" : "Created"}`,
                                        description: `Your cover letter has been ${selectedLetter ? "updated" : "created"} successfully`
                                    });
                                }
                                catch (error) {
                                    toast({
                                        title: "Error",
                                        description: `Failed to ${selectedLetter ? "update" : "create"} cover letter: ${error.message}`,
                                        variant: "destructive"
                                    });
                                }
                            } })] }) }), previewLetter && (_jsx(Dialog, { open: !!previewLetter, onOpenChange: () => setPreviewLetter(null), children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: previewLetter.name }) }), _jsxs("div", { className: "mt-4 border rounded-lg p-6", id: "cover-letter-preview", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-bold", children: previewLetter.content.header.fullName || "[Your Full Name]" }), _jsxs("div", { className: "text-sm text-neutral-600", children: [previewLetter.content.header.location && (_jsx("div", { children: previewLetter.content.header.location })), previewLetter.content.header.phone && (_jsx("div", { children: previewLetter.content.header.phone })), previewLetter.content.header.email && (_jsx("div", { children: previewLetter.content.header.email }))] })] }), _jsx("div", { className: "mb-6", children: _jsx("p", { children: previewLetter.content.header.date ||
                                            new Date().toLocaleDateString() }) }), _jsxs("div", { className: "mb-6", children: [previewLetter.content.recipient.name && (_jsx("p", { children: previewLetter.content.recipient.name })), previewLetter.content.recipient.position && (_jsx("p", { children: previewLetter.content.recipient.position })), previewLetter.content.recipient.company && (_jsx("p", { children: previewLetter.content.recipient.company })), previewLetter.content.recipient.address && (_jsx("p", { children: previewLetter.content.recipient.address }))] }), _jsx("div", { className: "mb-6", children: _jsxs("p", { children: ["Dear", " ", previewLetter.content.recipient.name || "Hiring Manager", ","] }) }), _jsx("div", { className: "mb-6 whitespace-pre-line", children: previewLetter.content.body }), _jsxs("div", { children: [_jsx("p", { children: previewLetter.content.closing || "Sincerely," }), _jsx("p", { className: "mt-6", children: previewLetter.content.header.fullName || "[Your Name]" })] })] }), _jsxs("div", { className: "flex justify-end mt-4", children: [_jsxs(Button, { variant: "outline", className: "mr-2", onClick: () => {
                                        setSelectedLetter(previewLetter);
                                        setPreviewLetter(null);
                                        setIsAddLetterOpen(true);
                                    }, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit"] }), _jsxs(Button, { onClick: () => handleDownloadPDF("cover-letter-preview"), children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Download PDF"] })] })] }) }))] }));
}
