import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, FileText, Download, Copy, Trash2, Edit, ArrowRight, ArrowLeft, Save, Loader2, BarChart4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ResumeForm from '@/components/ResumeForm';
import ResumeAnalyzer from '@/components/ResumeAnalyzer';
import ResumePreview from '@/components/ResumePreview';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useCareerData } from '@/hooks/use-career-data';
import ResumeAnalysisResults from '@/components/ResumeAnalysisResults';
import { exportResumeToPDF } from '@/utils/resumeExport';
// Animation constants
const subtleUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
const staggeredContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};
const cardAnimation = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};
export default function Resume() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddResumeOpen, setIsAddResumeOpen] = useState(false);
    const [selectedResume, setSelectedResume] = useState(null);
    const [previewResume, setPreviewResume] = useState(null);
    const [generatedResume, setGeneratedResume] = useState(null);
    const [isGeneratedResumeOpen, setIsGeneratedResumeOpen] = useState(false);
    const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
    const [optimizedCareerData, setOptimizedCareerData] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [shouldUpdateProfile, setShouldUpdateProfile] = useState(true);
    const [extractedResumeText, setExtractedResumeText] = useState('');
    const [isExtractionComplete, setIsExtractionComplete] = useState(false);
    const [extractionJobDescription, setExtractionJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isSavingResume, setIsSavingResume] = useState(false);
    // Always make design studio accessible without a toggle
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Fetch user's resumes with authentication
    const { data: resumes = [], isLoading } = useQuery({
        queryKey: ['/api/resumes'],
        placeholderData: [],
        retry: 3, // Retry 3 times in case of failures
        refetchOnWindowFocus: true, // Refetch when window gets focus
    });
    // Job description for AI suggestions
    const [jobDescription, setJobDescription] = useState('');
    const [userWorkHistory, setUserWorkHistory] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    // Get user's career data
    const { careerData, isLoading: isCareerDataLoading, refetch: refetchCareerData } = useCareerData();
    // Fetch user's work history with authentication (keeping this for backward compatibility)
    const { data: workHistoryData = [] } = useQuery({
        queryKey: ['/api/work-history'],
        placeholderData: [],
        retry: 3, // Retry 3 times in case of failures
        refetchOnWindowFocus: true, // Refetch when window gets focus
    });
    // Fetch suggestions
    const getSuggestionsMutation = useMutation({
        mutationFn: async () => {

            const res = await apiRequest('POST', '/api/resumes/suggestions', {
                jobDescription,
                workHistory: userWorkHistory,
            });
            const responseData = await res.json();

            return responseData;
        },
        onSuccess: (data) => {
            toast({
                title: 'Suggestions Generated',
                description: 'AI-powered suggestions for your resume are ready',
            });
            // Store the suggestions data and make it visible
            setShowSuggestions(true);
            // Log the received data for debugging

            // If analysis completed successfully, switch to the suggestions tab
            const tabsElement = document.querySelector("[role='tablist']");
            if (tabsElement) {
                // Find the suggestions tab and click it
                const suggestionsTab = Array.from(tabsElement.children).find((tab) => tab.textContent?.includes('Optimize with AI'));
                if (suggestionsTab) {
                    suggestionsTab.click();
                }
            }
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to generate suggestions: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // State to track when we're generating from optimization
    const [isGeneratingFromOptimize, setIsGeneratingFromOptimize] = useState(false);
    // Generate full resume
    const generateResumeMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest('POST', '/api/resumes/generate', {
                jobDescription,
                workHistory: userWorkHistory,
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: 'Resume Generated',
                description: 'Your AI-tailored resume is ready to view and customize',
            });
            // Always store the generated resume data
            setGeneratedResume(data);
            // Check if we're in the optimization flow
            if (isGeneratingFromOptimize) {
                // When called from optimization flow, automatically save the resume
                saveGeneratedResume(data);
                // Reset the flag
                setIsGeneratingFromOptimize(false);
            }
            else {
                // Regular flow - show the modal
                setIsGeneratedResumeOpen(true);
            }
        },
        onError: (error) => {
            // Reset the flag on error too
            setIsGeneratingFromOptimize(false);
            toast({
                title: 'Error',
                description: `Failed to generate resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Helper function to save the generated resume
    const saveGeneratedResume = (resumeData) => {
        // Create a new resume using the generated content
        const newResume = {
            name: `Resume for ${jobDescription.split(' ').slice(0, 3).join(' ')}...`,
            template: 'modern',
            content: {
                personalInfo: resumeData.personalInfo || {},
                summary: resumeData.summary || '',
                skills: resumeData.skills || [],
                experience: resumeData.experience || [],
                education: resumeData.education || [],
                projects: [],
                certifications: resumeData.certifications || []
            }
        };
        // Show saving state
        setIsSavingResume(true);
        // Save the resume directly using the API
        apiRequest('POST', '/api/resumes', newResume)
            .then(() => {
            // Invalidate the resumes query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            toast({
                title: 'Resume Saved',
                description: 'Your resume has been saved to My Resumes',
            });
            // Reset loading state
            setIsSavingResume(false);
        })
            .catch((error) => {
            // Reset loading state
            setIsSavingResume(false);
            toast({
                title: 'Error',
                description: `Failed to save resume: ${error.message}`,
                variant: 'destructive',
            });
        });
    };
    const deleteResumeMutation = useMutation({
        mutationFn: async (resumeId) => {
            return apiRequest('DELETE', `/api/resumes/${resumeId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            toast({
                title: 'Resume Deleted',
                description: 'Your resume has been deleted successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const handleDeleteResume = (resumeId) => {
        if (confirm('Are you sure you want to delete this resume?')) {
            deleteResumeMutation.mutate(resumeId);
        }
    };
    const duplicateResumeMutation = useMutation({
        mutationFn: async (resume) => {
            const newResume = {
                ...resume,
                name: `${resume.name} (Copy)`,
            };
            delete newResume.id;
            delete newResume.createdAt;
            delete newResume.updatedAt;
            return apiRequest('POST', '/api/resumes', newResume);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            toast({
                title: 'Resume Duplicated',
                description: 'A copy of your resume has been created',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to duplicate resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Optimize career data based on job description
    const optimizeCareerDataMutation = useMutation({
        mutationFn: async () => {
            if (!careerData) {
                throw new Error("No career data available. Please add work history in your profile first.");
            }
            // Format the career data to match the requirements of the API
            const formattedCareerData = {
                workHistory: careerData.workHistory || [],
                skills: (careerData.skills || []).map((skill) => skill.name || skill),
                careerSummary: careerData.careerSummary || ''
            };
            setIsOptimizing(true);
            const res = await apiRequest('POST', '/api/career-data/optimize', {
                jobDescription,
                careerData: formattedCareerData
            });
            return res.json();
        },
        onSuccess: (data) => {
            setIsOptimizing(false);
            setOptimizedCareerData(data);
            setIsOptimizeDialogOpen(true);
            toast({
                title: 'Optimization Complete',
                description: 'Your career data has been optimized for this job description',
            });
        },
        onError: (error) => {
            setIsOptimizing(false);
            toast({
                title: 'Optimization Error',
                description: `Failed to optimize career data: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Process extracted resume text
    const analyzeExtractedTextMutation = useMutation({
        mutationFn: async () => {
            if (!extractedResumeText || !extractionJobDescription) {
                throw new Error("Missing required data for analysis");
            }
            setIsAnalyzing(true);
            const res = await apiRequest('POST', '/api/resumes/analyze', {
                resumeText: extractedResumeText,
                jobDescription: extractionJobDescription
            });
            return res.json();
        },
        onSuccess: (data) => {
            setIsAnalyzing(false);
            // Store the analysis results
            setAnalysisResults({
                ...data,
                timestamp: new Date().toISOString() // Add timestamp for "Analyzed X time ago" display
            });
            // Show the success toast
            toast({
                title: 'Analysis Complete',
                description: 'Your resume has been analyzed successfully',
            });
            // Set the job description for the entire component so it can be used elsewhere
            setJobDescription(extractionJobDescription);
            // Generate suggestions based on the extracted and analyzed text
            setUserWorkHistory(extractedResumeText);
            getSuggestionsMutation.mutate();
        },
        onError: (error) => {
            setIsAnalyzing(false);
            toast({
                title: 'Analysis Error',
                description: `Failed to analyze resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Handle text extraction completion from ResumeAnalyzer
    const handleExtractComplete = (text) => {
        setExtractedResumeText(text);
        setIsExtractionComplete(true);
        toast({
            title: 'Text Extraction Complete',
            description: 'Please provide a job description and click Continue to analyze the resume',
        });
    };
    // Handle the continue button after extraction
    const handleAnalyzeExtractedText = () => {
        if (!extractedResumeText.trim()) {
            toast({
                title: 'Missing Resume Text',
                description: 'Please upload or paste your resume text first',
                variant: 'destructive',
            });
            return;
        }
        if (!extractionJobDescription.trim()) {
            toast({
                title: 'Job Description Required',
                description: 'Please paste a job description to compare against your resume. This is required for analysis.',
                variant: 'destructive',
            });
            return;
        }
        if (extractionJobDescription.trim().length < 50) {
            toast({
                title: 'Job Description Too Short',
                description: 'Please provide a more detailed job description for better analysis results.',
                variant: 'destructive',
            });
            return;
        }

        // Clear previous suggestions to ensure clean state
        setShowSuggestions(false);
        // This uses the mutation to analyze the extracted text
        // Call the mutation without parameters as they are used from component state
        analyzeExtractedTextMutation.mutate();
    };
    // Update career data with optimized content
    const updateCareerDataMutation = useMutation({
        mutationFn: async () => {
            if (!optimizedCareerData) {
                throw new Error("No optimized data available");
            }
            // Update career summary if provided
            let summaryPromise = Promise.resolve();
            if (optimizedCareerData.careerSummary) {
                // Fix parameter name to match what the API expects - 'careerSummary' not 'summary'
                try {
                    summaryPromise = apiRequest('PUT', '/api/career-data/career-summary', {
                        careerSummary: optimizedCareerData.careerSummary
                    })
                        .catch(error => {
                        console.error('Error updating career summary:', error);
                        // Don't throw the error, let Promise.allSettled handle it
                        return null;
                    });
                }
                catch (e) {
                    console.error('Exception during career summary update setup:', e);
                }
            }
            // Update each work history item if provided
            const workHistoryPromises = [];
            if (optimizedCareerData.workHistory && optimizedCareerData.workHistory.length > 0) {
                for (const item of optimizedCareerData.workHistory) {
                    if (item.id) {
                        // Create a properly structured work history update with stringified achievements
                        // Make sure we're not modifying any date fields that could cause validation issues
                        const updateData = {
                            description: item.description || '',
                            // Always ensure achievements is a proper array of strings
                            achievements: Array.isArray(item.achievements)
                                ? item.achievements
                                    .filter((a) => a && (typeof a === 'string') && a.trim() !== '')
                                    .map((a) => a.trim())
                                : []
                        };

                        try {
                            workHistoryPromises.push(apiRequest('PUT', `/api/career-data/work-history/${item.id}`, updateData)
                                .catch(error => {
                                console.error(`Error updating work history item ${item.id}:`, error);
                                // Don't throw here, let the Promise.all catch the error
                                return null;
                            }));
                        }
                        catch (e) {
                            console.error(`Exception during work history item ${item.id} update setup:`, e);
                        }
                    }
                }
            }
            // Add new skills if provided
            let skillsPromise = Promise.resolve();
            if (optimizedCareerData.skills && optimizedCareerData.skills.length > 0) {
                // Get current skills to avoid duplicates
                const currentSkillsResponse = await apiRequest('GET', '/api/career-data');
                const currentSkillsData = await currentSkillsResponse.json();
                const currentSkillNames = new Set((currentSkillsData.skills || []).map((s) => s.name.toLowerCase()));
                // Add new skills that don't already exist
                const newSkillPromises = [];
                for (const skill of optimizedCareerData.skills) {
                    if (typeof skill === 'string' && !currentSkillNames.has(skill.toLowerCase())) {
                        // Ensure proficiencyLevel is an integer value
                        newSkillPromises.push(apiRequest('POST', '/api/career-data/skills', {
                            name: skill,
                            proficiencyLevel: 3, // MUST be an integer value (1-5 scale)
                            category: "technical"
                        })
                            .catch(error => {
                            console.error(`Error creating skill "${skill}":`, error);
                            // Don't throw the error - allow other operations to continue
                            return null;
                        }));
                    }
                }
                if (newSkillPromises.length > 0) {
                    try {
                        // Use filter to remove any null promises from failed requests
                        const validSkillPromises = newSkillPromises.filter(p => p !== null);
                        if (validSkillPromises.length > 0) {

                            // Use allSettled to prevent one failure from stopping everything
                            skillsPromise = Promise.allSettled(validSkillPromises)
                                .then(results => {
                                const succeeded = results.filter(r => r.status === 'fulfilled').length;
                                const failed = results.filter(r => r.status === 'rejected').length;

                                return results;
                            })
                                .catch(err => {
                                console.error('Error in skill updates:', err);
                                return []; // Return empty array to prevent the entire operation from failing
                            });
                        }
                    }
                    catch (e) {
                        console.error('Exception during skill promise setup:', e);
                    }
                }
            }
            // Filter out any null values from failed promises
            const validWorkHistoryPromises = workHistoryPromises.filter(p => p !== null);

            // Wait for all updates to complete, but don't fail if some promise rejects
            // This is crucial for ensuring the resume generation still happens
            try {
                const results = await Promise.allSettled([summaryPromise, ...validWorkHistoryPromises, skillsPromise]);
                // Count successes and failures
                const succeeded = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;

                // If all failed, throw error
                if (succeeded === 0 && failed > 0) {
                    const errors = results
                        .filter((r) => r.status === 'rejected')
                        .map(r => r.reason)
                        .join(', ');
                    throw new Error(`All updates failed: ${errors}`);
                }
                // Return the results
                return results;
            }
            catch (error) {
                console.error("Error in Promise.allSettled:", error);
                throw error;
            }
        },
        onSuccess: () => {
            // Refresh career data
            refetchCareerData();
            // Don't close dialog yet - will be closed by optimizeAndGenerateResume
            // Show success message
            toast({
                title: 'Profile Updated',
                description: 'Your career profile has been updated with the optimized data',
            });
            // Now safely call optimizeAndGenerateResume after the update is successful
            if (shouldUpdateProfile) {
                optimizeAndGenerateResume();
            }
        },
        onError: (error) => {
            toast({
                title: 'Update Error',
                description: `Failed to update profile: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const filteredResumes = () => {
        if (!resumes)
            return [];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return resumes.filter((resume) => resume.name.toLowerCase().includes(query));
        }
        return resumes;
    };
    // Function to generate suggestions
    const generateSuggestions = () => {
        if (!jobDescription) {
            toast({
                title: 'Missing Information',
                description: 'Please provide a job description to generate suggestions',
                variant: 'destructive',
            });
            return;
        }
        // Check if we have work history data available in the database
        if (Array.isArray(workHistoryData) && workHistoryData.length > 0) {
            // Format work history data for AI processing
            const formattedWorkHistory = workHistoryData.map((job) => {
                const duration = job.currentJob
                    ? `${new Date(job.startDate).toLocaleDateString()} - Present`
                    : `${new Date(job.startDate).toLocaleDateString()} - ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'N/A'}`;
                const achievements = job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0
                    ? `\nAchievements:\n${job.achievements.map((a) => `- ${a}`).join('\n')}`
                    : '';
                return `Position: ${job.position}\nCompany: ${job.company}\nDuration: ${duration}\nLocation: ${job.location || 'N/A'}\nDescription: ${job.description || 'N/A'}${achievements}\n`;
            }).join('\n---\n\n');
            // Set the formatted work history to use in the API call
            setUserWorkHistory(formattedWorkHistory);
            // Call the API with the job description and formatted work history
            getSuggestionsMutation.mutate();
        }
        else {
            // No work history available
            toast({
                title: 'Missing Work History',
                description: 'Please add some work history entries in your profile first',
                variant: 'destructive',
            });
        }
    };
    // Function to generate a full resume with optimization options
    const generateFullResume = () => {
        if (!jobDescription) {
            toast({
                title: 'Missing Information',
                description: 'Please provide a job description to generate a tailored resume',
                variant: 'destructive',
            });
            return;
        }
        // Check if we have work history data available - prefer careerData over workHistoryData
        const hasWorkHistory = (careerData && careerData.workHistory && careerData.workHistory.length > 0) ||
            (Array.isArray(workHistoryData) && workHistoryData.length > 0);
        if (!hasWorkHistory) {
            toast({
                title: 'Missing Work History',
                description: 'Please add some work history entries in your profile first',
                variant: 'destructive',
            });
            return;
        }
        // If we have career data from the hook, use it for optimization
        if (careerData && careerData.workHistory && careerData.workHistory.length > 0) {
            // First, try to optimize the career data
            optimizeCareerDataMutation.mutate();
        }
        else {
            // Fallback to the old implementation if career data isn't available
            const formattedWorkHistory = workHistoryData.map((job) => {
                const duration = job.currentJob
                    ? `${new Date(job.startDate).toLocaleDateString()} - Present`
                    : `${new Date(job.startDate).toLocaleDateString()} - ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'N/A'}`;
                const achievements = job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0
                    ? `\nAchievements:\n${job.achievements.map((a) => `- ${a}`).join('\n')}`
                    : '';
                return `Position: ${job.position}\nCompany: ${job.company}\nDuration: ${duration}\nLocation: ${job.location || 'N/A'}\nDescription: ${job.description || 'N/A'}${achievements}\n`;
            }).join('\n---\n\n');
            // Set the formatted work history to use in the API call
            setUserWorkHistory(formattedWorkHistory);
            // Call the API with the job description and formatted work history
            generateResumeMutation.mutate();
        }
    };
    // Function to optimize career data and then generate resume
    const optimizeAndGenerateResume = () => {
        try {
            if (!optimizedCareerData) {
                toast({
                    title: 'Error',
                    description: 'No optimized data available',
                    variant: 'destructive',
                });
                return;
            }
            // Log that we're starting the resume generation process

            // Format optimized work history data for AI processing
            const formattedWorkHistory = optimizedCareerData.workHistory.map((job) => {
                // Ensure achievements is an array of non-empty strings
                const achievements = Array.isArray(job.achievements)
                    ? job.achievements
                        .filter((a) => typeof a === 'string' && a.trim() !== '')
                        .map((a) => `- ${a}`)
                        .join('\n')
                    : '';
                const achievementsSection = achievements
                    ? `\nAchievements:\n${achievements}`
                    : '\nAchievements: None listed';
                return `Position: ${job.position || 'Unknown'}\nCompany: ${job.company || 'Unknown'}\nDescription: ${job.description || 'No description'}${achievementsSection}\n`;
            }).join('\n---\n\n');
            // Set the formatted work history to use in the API call
            setUserWorkHistory(formattedWorkHistory);
            // Add the optimized career summary at the beginning if available
            if (optimizedCareerData.careerSummary) {
                setUserWorkHistory(`Career Summary:\n${optimizedCareerData.careerSummary}\n\n${formattedWorkHistory}`);
            }
            // Set the flag that we're generating from optimization flow
            setIsGeneratingFromOptimize(true);
            // Close the optimization dialog
            setIsOptimizeDialogOpen(false);
            // Call the API with the job description and formatted work history
            generateResumeMutation.mutate();
        }
        catch (error) {
            console.error('Error in optimizeAndGenerateResume:', error);
            toast({
                title: 'Resume Generation Error',
                description: 'There was a problem preparing your resume data. Please try again.',
                variant: 'destructive',
            });
            // Close the dialog even if there's an error
            setIsOptimizeDialogOpen(false);
        }
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
        hidden: { opacity: 0, y: 4 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };
    const staggeredContainer = {
        hidden: { opacity: 1 }, // Start with opacity 1 for container to reduce unnecessary repaints
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05, // Faster stagger
                delayChildren: 0.1 // Shorter delay
            }
        }
    };
    // Function to download resume as PDF using our centralized utility
    const handleDownloadPDF = async (elementId) => {

        const element = document.getElementById(elementId);
        if (!element) {
            toast({
                title: 'Error',
                description: 'Could not find the resume content to download',
                variant: 'destructive',
            });
            console.error(`Element with ID ${elementId} not found`);
            return;
        }
        // Create a filename based on resume name or default
        const resumeName = previewResume?.name || generatedResume?.personalInfo?.fullName || 'resume';
        const filename = `${resumeName}_${new Date().toISOString().split('T')[0]}.pdf`;
        try {
            // Use our centralized export utility
            const success = await exportResumeToPDF(element, {
                filename,
                showToast: true // Show success/error toasts from the utility
            });
            if (success) {

            }
            else {
                console.error('Failed to generate resume PDF');
            }
        }
        catch (error) {
            console.error('Error during resume PDF export:', error);
            toast({
                title: 'Export Error',
                description: 'There was a problem creating your resume PDF. Please try again.',
                variant: 'destructive',
            });
        }
    };
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", variants: subtleUp, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Resume Studio" }), _jsx("p", { className: "text-neutral-500", children: "Create, analyze, and manage your professional resumes" })] }), _jsx("div", { className: "flex items-center gap-4 mt-4 md:mt-0", children: _jsxs(Button, { onClick: () => {
                                setSelectedResume(null);
                                setIsAddResumeOpen(true);
                            }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Resume"] }) })] }), _jsxs(Tabs, { defaultValue: "resumes", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsxs(TabsTrigger, { value: "resumes", children: ["My Resumes ", resumes && resumes.length > 0 && `(${resumes.length})`] }), _jsx(TabsTrigger, { value: "suggestions", children: "Generate With AI" }), _jsx(TabsTrigger, { value: "analyze", children: "Upload & Analyze" })] }), _jsx(TabsContent, { value: "analyze", className: "space-y-6", children: _jsx(motion.div, { variants: subtleUp, style: { transform: 'translateZ(0)' }, children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 items-start", children: [_jsx("div", { className: "lg:w-1/2", children: _jsx(ResumeAnalyzer, { onExtractComplete: handleExtractComplete, jobDescription: extractionJobDescription, setJobDescription: setExtractionJobDescription, isAnalyzing: isAnalyzing, onAnalyze: handleAnalyzeExtractedText }) }), _jsx("div", { className: "lg:w-1/2", children: analysisResults ? (_jsxs(motion.div, { className: "grid grid-cols-1 gap-6 will-change-opacity will-change-transform overflow-auto", variants: subtleUp, style: { transform: 'translateZ(0)' }, children: [_jsx(ResumeAnalysisResults, { results: analysisResults }), _jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsx("div", { children: analysisResults.timestamp && (_jsxs("p", { className: "text-sm text-neutral-500", children: ["Last analyzed ", new Date(analysisResults.timestamp).toLocaleTimeString(), " on ", new Date(analysisResults.timestamp).toLocaleDateString()] })) }), _jsx("div", { className: "flex gap-3", children: _jsxs(Button, { variant: "outline", onClick: () => {
                                                                    setAnalysisResults(null);
                                                                }, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "New Analysis"] }) })] })] })) : isAnalyzing ? (_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 bg-transparent", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header", id: "analysisHeader", children: [_jsx(BarChart4, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI Analysis Results"] }), _jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 text-center", children: [_jsx("div", { className: "w-16 h-16 mb-6 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) }), _jsx("p", { className: "text-neutral-600 text-lg mb-2", children: "Analyzing your resume..." }), _jsx("p", { className: "text-neutral-500 mb-6", children: "This may take a few seconds." })] })] }) })) : (_jsx(Card, { className: "overflow-hidden border-slate-200 bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-6 bg-transparent", children: [_jsxs("h3", { className: "text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header", id: "analysisHeader", children: [_jsx(BarChart4, { className: "h-5 w-5 mr-2 text-blue-500" }), "AI Analysis Results"] }), _jsxs("div", { className: "flex flex-col items-center justify-center py-10 px-4 text-center", children: [_jsx("div", { className: "w-16 h-16 mb-6 text-neutral-200", children: _jsxs("svg", { width: "64", height: "64", viewBox: "0 0 64 64", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M44 42L46 46L50 47L47 50L48 54L44 52L40 54L41 50L38 47L42 46L44 42Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M20 44L18 46L20 48L18 50L20 52L22 50L24 52L22 48L24 46L22 44L20 44Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })] }) }), _jsx("p", { className: "text-neutral-600 text-lg mb-2", children: "Submit your resume and job description" }), _jsx("p", { className: "text-neutral-500 mb-6", children: "to see AI-powered analysis and suggestions." })] })] }) })) })] }) }) }), _jsxs(TabsContent, { value: "resumes", className: "space-y-6", children: [_jsxs(motion.div, { className: "relative max-w-md will-change-opacity will-change-transform", variants: subtleUp, children: [_jsx(Input, { placeholder: "Search resumes...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" }), _jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }) })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : resumes && resumes.length > 0 ? (_jsx(motion.div, { className: "resumes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: filteredResumes().map((resume) => (_jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsxs(Card, { className: "overflow-hidden resume-card transition-shadow duration-300", children: [_jsx(CardContent, { className: "p-0", children: _jsxs("div", { className: "bg-primary/5 p-6 flex items-center", children: [_jsx(FileText, { className: "h-10 w-10 text-primary mr-4" }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: resume.name }), _jsxs("p", { className: "text-sm text-neutral-500", children: [resume.template.charAt(0).toUpperCase() + resume.template.slice(1), " Template"] }), _jsxs("p", { className: "text-xs text-neutral-400 mt-1", children: ["Last updated: ", new Date(resume.updatedAt).toLocaleDateString()] })] })] }) }), _jsxs(CardFooter, { className: "p-4 flex justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPreviewResume(resume), children: "Preview" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => {
                                                                    setSelectedResume(resume);
                                                                    setIsAddResumeOpen(true);
                                                                }, children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => duplicateResumeMutation.mutate(resume), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleDeleteResume(resume.id), children: _jsx(Trash2, { className: "h-4 w-4" }) }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-8 flex items-center gap-1 text-xs", onClick: async () => {
                                                                    try {
                                                                        // Set the preview resume to trigger rendering
                                                                        setPreviewResume(resume);
                                                                        // Allow template to render
                                                                        await new Promise(resolve => setTimeout(resolve, 100));
                                                                        const resumeElement = document.querySelector('.resume-template');
                                                                        if (!resumeElement) {
                                                                            throw new Error("Could not find resume template");
                                                                        }
                                                                        const success = await exportResumeToPDF(resumeElement, {
                                                                            filename: `${resume.name}_${new Date().toISOString().split('T')[0]}.pdf`,
                                                                            showToast: true // Enable success/error toasts
                                                                        });
                                                                        if (!success) {
                                                                            console.error("PDF export failed");
                                                                        }
                                                                    }
                                                                    catch (error) {
                                                                        console.error("Error during PDF export:", error);
                                                                        toast({
                                                                            title: "Export Failed",
                                                                            description: "Could not generate PDF. Please try again.",
                                                                            variant: "destructive"
                                                                        });
                                                                    }
                                                                    finally {
                                                                        // Always clear preview state
                                                                        setPreviewResume(null);
                                                                    }
                                                                }, title: "Download resume as PDF", children: [_jsx(Download, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "PDF" })] })] })] })] }) }, resume.id))) })) : (_jsxs(motion.div, { className: "text-center py-16 px-6 bg-gradient-to-b from-white to-[#f0f6ff] rounded-lg shadow-md shadow-gray-200 border border-gray-100", variants: fadeIn, children: [_jsx("div", { className: "bg-[#f4f4f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(FileText, { className: "h-10 w-10 text-blue-500" }) }), _jsx("h3", { className: "text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "You haven't created any resumes yet" }), _jsx("p", { className: "text-neutral-500 mb-6 max-w-md mx-auto", children: "Create your first professional resume to showcase your skills and experience to potential employers." }), _jsxs(Button, { onClick: () => {
                                            setSelectedResume(null);
                                            setIsAddResumeOpen(true);
                                        }, size: "lg", className: "shadow-sm hover:shadow-lg transition-all", children: [_jsx(Plus, { className: "mr-2 h-5 w-5" }), "Create First Resume"] })] }))] }), _jsx(TabsContent, { value: "suggestions", children: _jsx(motion.div, { className: "will-change-opacity will-change-transform mt-3", variants: subtleUp, style: { transform: 'translateZ(0)' }, children: _jsx(Card, { className: "w-full bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200", children: _jsxs(CardContent, { className: "pt-3 px-5 pb-6 bg-transparent", children: [_jsx("h3", { className: "text-xl font-semibold mb-2.5 text-[#0C29AB]", children: "Generate the Perfect Resume with AI" }), _jsxs("div", { className: "space-y-4 w-full", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Job Description" }), _jsx(Textarea, { placeholder: "Paste the job description here...", value: jobDescription, onChange: (e) => setJobDescription(e.target.value), className: "min-h-[240px] w-full" })] }), _jsx("div", { className: "flex justify-center mt-4 mb-6", children: _jsx(Button, { className: "px-8", onClick: generateFullResume, disabled: generateResumeMutation?.isPending, size: "lg", children: generateResumeMutation?.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating Resume..."] })) : (_jsxs(_Fragment, { children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Generate Resume"] })) }) })] })] }) }) }) })] }), _jsx(Dialog, { open: isAddResumeOpen, onOpenChange: setIsAddResumeOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[900px] max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: selectedResume ? 'Edit Resume' : 'Create New Resume' }) }), _jsx(ResumeForm, { resume: selectedResume, onSuccess: () => setIsAddResumeOpen(false) })] }) }), _jsx(ResumePreview, { open: !!previewResume, onOpenChange: (open) => {
                    if (!open)
                        setPreviewResume(null);
                }, resume: previewResume, onDownloadPDF: () => { } }), _jsx(Dialog, { open: isGeneratedResumeOpen, onOpenChange: setIsGeneratedResumeOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[900px] max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "AI-Generated Resume" }), _jsx("p", { className: "text-sm text-neutral-500", children: "This resume was tailored to match the job description you provided. You can save it as a new resume or make further edits." })] }), generatedResume && (_jsx("div", { id: "generated-resume", className: "resume-template resume-export-container", children: _jsxs("div", { className: "bg-white p-8 max-w-[8.5in] mx-auto resume-content", children: [_jsxs("header", { className: "mb-6 pb-4 border-b border-neutral-200", children: [_jsx("h1", { className: "text-2xl font-bold text-center text-neutral-900", children: generatedResume.personalInfo?.fullName || 'Your Name' }), _jsxs("div", { className: "flex flex-wrap justify-center gap-x-4 mt-2 text-sm text-neutral-600", children: [generatedResume.personalInfo?.email && _jsx("span", { children: generatedResume.personalInfo.email }), generatedResume.personalInfo?.phone && _jsx("span", { children: generatedResume.personalInfo.phone }), generatedResume.personalInfo?.location && _jsx("span", { children: generatedResume.personalInfo.location })] })] }), generatedResume.summary && (_jsxs("section", { className: "mb-6 resume-section", children: [_jsx("h2", { className: "text-lg font-semibold border-b pb-1 mb-3 resume-section-header", children: "Professional Summary" }), _jsx("p", { className: "text-sm leading-relaxed", children: generatedResume.summary })] })), generatedResume.skills && generatedResume.skills.length > 0 && (_jsxs("section", { className: "mb-6 resume-section", children: [_jsx("h2", { className: "text-lg font-semibold border-b pb-1 mb-3 resume-section-header", children: "Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: generatedResume.skills.map((skill, index) => (_jsx("span", { className: "bg-primary/10 text-primary px-2 py-1 rounded text-sm", children: skill }, index))) })] })), generatedResume.experience && generatedResume.experience.length > 0 && (_jsxs("section", { className: "mb-6 resume-section", children: [_jsx("h2", { className: "text-lg font-semibold border-b pb-1 mb-3 resume-section-header", children: "Experience" }), _jsx("div", { className: "space-y-4", children: generatedResume.experience.map((exp, index) => (_jsxs("div", { className: "job-item", children: [_jsxs("div", { className: "flex justify-between items-baseline", children: [_jsx("h3", { className: "font-medium text-neutral-900", children: exp.position }), _jsxs("div", { className: "text-sm text-neutral-600", children: [exp.startDate, " - ", exp.currentJob ? 'Present' : exp.endDate] })] }), _jsx("div", { className: "text-sm font-medium text-primary mb-1", children: exp.company }), exp.description && _jsx("p", { className: "text-sm mt-1 leading-relaxed", children: exp.description }), exp.achievements && exp.achievements.length > 0 && (_jsx("ul", { className: "list-disc pl-5 mt-2 space-y-1 achievements", children: exp.achievements.map((achievement, idx) => (_jsx("li", { className: "text-sm", children: achievement }, idx))) }))] }, index))) })] })), generatedResume.education && generatedResume.education.length > 0 && (_jsxs("section", { className: "mb-6 resume-section", children: [_jsx("h2", { className: "text-lg font-semibold border-b pb-1 mb-3 resume-section-header", children: "Education" }), _jsx("div", { className: "space-y-4", children: generatedResume.education.map((edu, index) => (_jsxs("div", { className: "education-item", children: [_jsxs("div", { className: "flex justify-between items-baseline", children: [_jsxs("h3", { className: "font-medium text-neutral-900", children: [edu.degree, edu.field ? ` in ${edu.field}` : ''] }), _jsxs("div", { className: "text-sm text-neutral-600", children: [edu.startDate, " - ", edu.endDate || 'Present'] })] }), _jsx("div", { className: "text-sm font-medium text-primary mb-1", children: edu.institution }), edu.description && _jsx("p", { className: "text-sm mt-1 leading-relaxed", children: edu.description })] }, index))) })] }))] }) })), _jsxs("div", { className: "flex justify-between mt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsGeneratedResumeOpen(false), children: "Close" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: async () => {
                                                if (generatedResume) {
                                                    try {
                                                        // Get the already rendered generated resume from the dialog
                                                        const resumeElement = document.getElementById('generated-resume');
                                                        if (!resumeElement) {
                                                            throw new Error("Could not find generated resume element");
                                                        }
                                                        // Export the visible resume directly to PDF
                                                        const success = await exportResumeToPDF(resumeElement, {
                                                            filename: `Resume_Alt_${new Date().toISOString().split('T')[0]}.pdf`,
                                                            showToast: true
                                                        });
                                                        if (!success) {
                                                            console.error("PDF export failed");
                                                        }
                                                    }
                                                    catch (error) {
                                                        console.error("Error during PDF export:", error);
                                                        toast({
                                                            title: "Export Failed",
                                                            description: "Could not generate PDF. Please try again.",
                                                            variant: "destructive"
                                                        });
                                                    }
                                                }
                                            }, children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Download PDF"] }), _jsx(Button, { onClick: () => {
                                                // Set up a new resume using the generated content
                                                const newResume = {
                                                    name: `Resume for ${jobDescription.split(' ').slice(0, 3).join(' ')}...`,
                                                    template: 'modern',
                                                    content: {
                                                        personalInfo: generatedResume.personalInfo || {},
                                                        summary: generatedResume.summary || '',
                                                        skills: generatedResume.skills || [],
                                                        experience: generatedResume.experience || [],
                                                        education: generatedResume.education || [],
                                                        projects: [],
                                                        certifications: generatedResume.certifications || []
                                                    }
                                                };
                                                // Show saving state
                                                setIsSavingResume(true);
                                                // Save the resume directly using the API
                                                apiRequest('POST', '/api/resumes', newResume)
                                                    .then(() => {
                                                    // Invalidate the resumes query to refresh the list
                                                    queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
                                                    toast({
                                                        title: 'Resume Saved',
                                                        description: 'Your resume has been saved to My Resumes',
                                                    });
                                                    // Reset loading state and close the dialog
                                                    setIsSavingResume(false);
                                                    setIsGeneratedResumeOpen(false);
                                                })
                                                    .catch((error) => {
                                                    // Reset loading state
                                                    setIsSavingResume(false);
                                                    toast({
                                                        title: 'Error',
                                                        description: `Failed to save resume: ${error.message}`,
                                                        variant: 'destructive',
                                                    });
                                                });
                                            }, disabled: isSavingResume, children: isSavingResume ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "animate-spin mr-2", children: _jsx("div", { className: "h-4 w-4 border-2 border-primary border-t-transparent rounded-full" }) }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), "Save to My Resumes"] })) })] })] })] }) }), _jsx(Dialog, { open: isOptimizeDialogOpen, onOpenChange: setIsOptimizeDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[800px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Optimize Your Career Profile" }), _jsx(DialogDescription, { children: "AI has analyzed your career data and the job description to create an optimized version that highlights your most relevant skills and experiences." })] }), isOptimizing ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-10", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" }), _jsx("p", { className: "mt-4 text-center text-neutral-600", children: "Optimizing your career data based on the job description..." })] })) : optimizedCareerData ? (_jsxs("div", { className: "space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Career Summary" }), _jsx("div", { className: "bg-neutral-50 p-3 rounded-md", children: _jsx("p", { children: optimizedCareerData.careerSummary }) }), optimizedCareerData.explanations?.summary && (_jsxs(Alert, { children: [_jsx(AlertTitle, { children: "How this was improved" }), _jsx(AlertDescription, { className: "text-sm text-neutral-600", children: optimizedCareerData.explanations.summary })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Work History" }), optimizedCareerData.workHistory?.map((item) => (_jsxs("div", { className: "border rounded-md p-3", children: [_jsxs("div", { className: "font-medium", children: [item.company, " - ", item.position] }), _jsx("div", { className: "text-sm text-neutral-600 mt-1", children: item.description }), item.achievements && item.achievements.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "font-medium text-sm", children: "Key Achievements:" }), _jsx("ul", { className: "list-disc list-inside text-sm text-neutral-600", children: item.achievements.map((achievement, i) => (_jsx("li", { children: achievement }, i))) })] }))] }, item.id))), optimizedCareerData.explanations?.workHistory && (_jsxs(Alert, { children: [_jsx(AlertTitle, { children: "How work history was enhanced" }), _jsx(AlertDescription, { className: "text-sm text-neutral-600", children: optimizedCareerData.explanations.workHistory })] }))] }), optimizedCareerData.skills && optimizedCareerData.skills.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Highlighted Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: optimizedCareerData.skills.map((skill, i) => (_jsx("div", { className: "bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm", children: skill }, i))) }), optimizedCareerData.explanations?.skills && (_jsxs(Alert, { children: [_jsx(AlertTitle, { children: "Skill Recommendations" }), _jsx(AlertDescription, { className: "text-sm text-neutral-600", children: optimizedCareerData.explanations.skills })] }))] }))] })) : (_jsx("div", { className: "py-8 text-center", children: _jsx("p", { className: "text-neutral-600", children: "No optimized data available" }) })), _jsxs("div", { className: "space-y-2 border-t pt-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("label", { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(Switch, { checked: shouldUpdateProfile, onCheckedChange: setShouldUpdateProfile }), _jsx("span", { children: "Update my profile with these optimized details" })] }) }), _jsx("p", { className: "text-xs text-neutral-500", children: "When enabled, your profile in Account Settings will be updated with these optimized descriptions and skills." })] }), _jsxs(DialogFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: () => setIsOptimizeDialogOpen(false), children: "Cancel" }), _jsx("div", { className: "flex gap-2", children: shouldUpdateProfile ? (_jsx(Button, { onClick: () => {
                                            // Only run the mutation and wait for it to complete
                                            // The optimizeAndGenerateResume will be called from onSuccess
                                            updateCareerDataMutation.mutate();
                                        }, disabled: updateCareerDataMutation.isPending, children: updateCareerDataMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Updating profile..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), "Save to Profile & Generate"] })) })) : (_jsx(Button, { onClick: optimizeAndGenerateResume, disabled: generateResumeMutation?.isPending, children: generateResumeMutation?.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Generating Resume..."] })) : (_jsxs(_Fragment, { children: [_jsx(ArrowRight, { className: "mr-2 h-4 w-4" }), "Generate Resume Only"] })) })) })] })] }) })] }));
}
