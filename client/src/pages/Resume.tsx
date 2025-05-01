import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, FileText, Download, Copy, Trash2, Edit, Palette, FileUp, ArrowRight, ArrowLeft, RefreshCw, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import JobDescriptionInput from '@/components/JobDescriptionInput';
import ResumeAnalysisResults, { ResumeAnalysisResult } from '@/components/ResumeAnalysisResults';

export default function Resume() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddResumeOpen, setIsAddResumeOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [previewResume, setPreviewResume] = useState<any>(null);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [isGeneratedResumeOpen, setIsGeneratedResumeOpen] = useState(false);
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
  const [optimizedCareerData, setOptimizedCareerData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [shouldUpdateProfile, setShouldUpdateProfile] = useState(true);
  const [extractedResumeText, setExtractedResumeText] = useState<string>('');
  const [isExtractionComplete, setIsExtractionComplete] = useState<boolean>(false);
  const [extractionJobDescription, setExtractionJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<ResumeAnalysisResult | null>(null);
  // Always make design studio accessible without a toggle
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's resumes with authentication
  const { data: resumes = [], isLoading } = useQuery<any[]>({
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
  const { data: workHistoryData = [] } = useQuery<any[]>({
    queryKey: ['/api/work-history'],
    placeholderData: [],
    retry: 3, // Retry 3 times in case of failures
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Fetch suggestions
  const getSuggestionsMutation = useMutation({
    mutationFn: async () => {
      console.log("Sending suggestion request with:", {
        jobDescriptionLength: jobDescription?.length || 0,
        workHistoryLength: userWorkHistory?.length || 0
      });
      
      const res = await apiRequest('POST', '/api/resumes/suggestions', {
        jobDescription,
        workHistory: userWorkHistory,
      });
      
      const responseData = await res.json();
      console.log("Received suggestions response:", responseData);
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
      console.log("Displaying suggestions:", data);
      
      // If analysis completed successfully, switch to the suggestions tab
      const tabsElement = document.querySelector("[role='tablist']");
      if (tabsElement) {
        // Find the suggestions tab and click it
        const suggestionsTab = Array.from(tabsElement.children).find(
          (tab) => tab.textContent?.includes('Optimize with AI')
        ) as HTMLElement;
        
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
      setGeneratedResume(data);
      setIsGeneratedResumeOpen(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate resume: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId: number) => {
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

  const handleDeleteResume = (resumeId: number) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      deleteResumeMutation.mutate(resumeId);
    }
  };

  const duplicateResumeMutation = useMutation({
    mutationFn: async (resume: any) => {
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
        skills: (careerData.skills || []).map((skill: any) => skill.name || skill),
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
    onSuccess: (data: ResumeAnalysisResult) => {
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
  const handleExtractComplete = (text: string) => {
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
    
    console.log("Beginning analysis process with:", {
      resumeTextLength: extractedResumeText.length,
      jobDescriptionLength: extractionJobDescription.length,
      resumeTextExcerpt: extractedResumeText.substring(0, 50) + "...",
      jobDescriptionExcerpt: extractionJobDescription.substring(0, 50) + "..."
    });
    
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
      let summaryPromise = Promise.resolve() as Promise<any>;
      if (optimizedCareerData.careerSummary) {
        summaryPromise = apiRequest('PUT', '/api/career-data/career-summary', {
          summary: optimizedCareerData.careerSummary
        });
      }
      
      // Update each work history item if provided
      const workHistoryPromises = [];
      if (optimizedCareerData.workHistory && optimizedCareerData.workHistory.length > 0) {
        for (const item of optimizedCareerData.workHistory) {
          if (item.id) {
            workHistoryPromises.push(
              apiRequest('PUT', `/api/career-data/work-history/${item.id}`, {
                description: item.description,
                achievements: item.achievements
              })
            );
          }
        }
      }
      
      // Add new skills if provided
      let skillsPromise = Promise.resolve() as Promise<any>;
      if (optimizedCareerData.skills && optimizedCareerData.skills.length > 0) {
        // Get current skills to avoid duplicates
        const currentSkillsResponse = await apiRequest('GET', '/api/career-data', {});
        const currentSkillsData = await currentSkillsResponse.json();
        const currentSkillNames = new Set(
          (currentSkillsData.skills || []).map((s: any) => s.name.toLowerCase())
        );
        
        // Add new skills that don't already exist
        const newSkillPromises = [];
        for (const skill of optimizedCareerData.skills) {
          if (typeof skill === 'string' && !currentSkillNames.has(skill.toLowerCase())) {
            newSkillPromises.push(
              apiRequest('POST', '/api/career-data/skills', {
                name: skill,
                proficiencyLevel: 'Intermediate',
                category: null
              })
            );
          }
        }
        
        if (newSkillPromises.length > 0) {
          skillsPromise = Promise.all(newSkillPromises);
        }
      }
      
      // Wait for all updates to complete
      return Promise.all([summaryPromise, ...workHistoryPromises, skillsPromise]);
    },
    onSuccess: () => {
      // Refresh career data
      refetchCareerData();
      
      // Close the optimize dialog
      setIsOptimizeDialogOpen(false);
      
      // Show success message
      toast({
        title: 'Profile Updated',
        description: 'Your career profile has been updated with the optimized data',
      });
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
    if (!resumes) return [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return resumes.filter(
        (resume) => resume.name.toLowerCase().includes(query)
      );
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
      const formattedWorkHistory = workHistoryData.map((job: any) => {
        const duration = job.currentJob 
          ? `${new Date(job.startDate).toLocaleDateString()} - Present` 
          : `${new Date(job.startDate).toLocaleDateString()} - ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'N/A'}`;

        const achievements = job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0
          ? `\nAchievements:\n${job.achievements.map((a: string) => `- ${a}`).join('\n')}`
          : '';

        return `Position: ${job.position}\nCompany: ${job.company}\nDuration: ${duration}\nLocation: ${job.location || 'N/A'}\nDescription: ${job.description || 'N/A'}${achievements}\n`;
      }).join('\n---\n\n');

      // Set the formatted work history to use in the API call
      setUserWorkHistory(formattedWorkHistory);

      // Call the API with the job description and formatted work history
      getSuggestionsMutation.mutate();
    } else {
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
    } else {
      // Fallback to the old implementation if career data isn't available
      const formattedWorkHistory = workHistoryData.map((job: any) => {
        const duration = job.currentJob 
          ? `${new Date(job.startDate).toLocaleDateString()} - Present` 
          : `${new Date(job.startDate).toLocaleDateString()} - ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'N/A'}`;

        const achievements = job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0
          ? `\nAchievements:\n${job.achievements.map((a: string) => `- ${a}`).join('\n')}`
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
    if (!optimizedCareerData) {
      toast({
        title: 'Error',
        description: 'No optimized data available',
        variant: 'destructive',
      });
      return;
    }
    
    // Format optimized work history data for AI processing
    const formattedWorkHistory = optimizedCareerData.workHistory.map((job: any) => {
      return `Position: ${job.position || 'Unknown'}\nCompany: ${job.company || 'Unknown'}\nDescription: ${job.description || 'No description'}\nAchievements:\n${job.achievements.map((a: string) => `- ${a}`).join('\n')}\n`;
    }).join('\n---\n\n');
    
    // Set the formatted work history to use in the API call
    setUserWorkHistory(formattedWorkHistory);
    
    // Add the optimized career summary at the beginning if available
    if (optimizedCareerData.careerSummary) {
      setUserWorkHistory(`Career Summary:\n${optimizedCareerData.careerSummary}\n\n${formattedWorkHistory}`);
    }
    
    // Close the optimization dialog
    setIsOptimizeDialogOpen(false);
    
    // Call the API with the job description and formatted work history
    generateResumeMutation.mutate();
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
  
  // Function to download resume as PDF
  const handleDownloadPDF = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: 'Error',
        description: 'Could not find the resume content to download',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a filename based on resume name or default
    const resumeName = previewResume?.name || generatedResume?.personalInfo?.fullName || 'resume';
    const filename = `${resumeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    
    // Clone the element to modify it for PDF generation
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.padding = '20px';
    clonedElement.style.border = 'none';
    
    // Create the print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Unable to open print window. Please check your popup settings.',
        variant: 'destructive',
      });
      return;
    }
    
    // Setup the print document
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .resume-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
            h2, h3, h4 { margin-top: 0; }
            p { margin: 0 0 8px; }
            .section { margin-bottom: 16px; }
            .skills { display: flex; flex-wrap: wrap; gap: 6px; }
            .skill-tag { background-color: #f1f5ff; color: #0C29AB; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
            .header { margin-bottom: 24px; text-align: center; }
            .header h2 { margin-bottom: 8px; }
            @media print {
              body { padding: 0; margin: 0; }
              .resume-container { width: 100%; max-width: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
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

  return (
    <motion.div 
      className="container mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between mb-6"
        variants={subtleUp}
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Resume Studio</h1>
          <p className="text-neutral-500">Create, analyze, and manage your professional resumes</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Button 
            onClick={() => {
              setSelectedResume(null);
              setIsAddResumeOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="resumes">
        <TabsList className="mb-4">
          <TabsTrigger value="resumes">
            My Resumes {resumes && resumes.length > 0 && `(${resumes.length})`}
          </TabsTrigger>
          <TabsTrigger value="suggestions">Optimize with AI</TabsTrigger>
          <TabsTrigger value="analyze">Upload & Analyze</TabsTrigger>
        </TabsList>
        
        {/* Add ResumeAnalyzer to "analyze" tab */}
        <TabsContent value="analyze" className="space-y-6">
          <motion.div
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card className="p-4 mb-4">
              <CardContent className="p-2">
                <h3 className="text-lg font-semibold mb-2">Resume Analysis Tool</h3>
                <p className="text-neutral-600 text-sm">
                  Upload your resume and analyze it against specific job descriptions. Get detailed feedback on how well your resume matches the job requirements and suggestions for improvement.
                </p>
              </CardContent>
            </Card>
            
            {/* First step: Extract text from resume */}
            {!isExtractionComplete ? (
              <ResumeAnalyzer 
                onExtractComplete={handleExtractComplete}
              />
            ) : analysisResults ? (
              /* Third step: Show analysis results */
              <motion.div 
                className="grid grid-cols-1 gap-6 will-change-opacity will-change-transform"
                variants={subtleUp}
                style={{ transform: 'translateZ(0)' }}
              >
                {/* Display analysis results */}
                <ResumeAnalysisResults results={analysisResults} />
                
                {/* Action buttons for the results */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {analysisResults.timestamp && (
                      <p className="text-sm text-neutral-500">
                        Last analyzed {new Date(analysisResults.timestamp).toLocaleTimeString()} on {new Date(analysisResults.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAnalysisResults(null);
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Job Description
                    </Button>
                    <Button
                      onClick={generateSuggestions}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Resume Suggestions
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Second step: Enter job description and analyze */
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 will-change-opacity will-change-transform"
                variants={subtleUp}
                style={{ transform: 'translateZ(0)' }}
              >
                <Card className="overflow-hidden border-slate-200">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
                      <FileUp className="h-5 w-5 mr-2" />
                      Job Description
                    </h3>
                    <p className="text-neutral-600 mb-5 text-sm leading-relaxed border-l-4 border-primary/20 pl-3 py-1 bg-primary/5 rounded-sm">
                      Enter the job description you want to match your resume against. A more detailed job description 
                      will result in more accurate analysis of your resume.
                    </p>
                    
                    <div className="space-y-5">
                      {/* Use the JobDescriptionInput component */}
                      <JobDescriptionInput
                        value={extractionJobDescription}
                        onChange={setExtractionJobDescription}
                        className="min-h-[200px] border-slate-200"
                        minLength={100}
                        isAnalyzing={isAnalyzing}
                      />
                      
                      <Button 
                        className="w-full" 
                        onClick={handleAnalyzeExtractedText}
                        disabled={isAnalyzing || !extractionJobDescription.trim() || !extractedResumeText.trim()}
                        id="analyzeBtn"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart4 className="h-4 w-4 mr-2" />
                            Analyze Resume
                          </>
                        )}
                      </Button>
                      
                      <div className="flex justify-center">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsExtractionComplete(false);
                            setExtractedResumeText('');
                          }}
                          className="text-neutral-500"
                        >
                          &larr; Back to Upload Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-slate-200">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center analysis-header" id="analysisHeader">
                      <BarChart4 className="h-5 w-5 mr-2" />
                      AI Analysis Results
                    </h3>
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center border border-dashed border-slate-200 rounded-lg">
                      <Sparkles className="h-12 w-12 text-neutral-300 mb-3" />
                      <p className="text-neutral-500 max-w-xs">
                        Enter a job description and click "Analyze Resume" to see AI-powered analysis and suggestions for improvement.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="resumes" className="space-y-6">
          {/* Search */}
          <motion.div className="relative max-w-md will-change-opacity will-change-transform" variants={subtleUp}>
            <Input
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </motion.div>

          {/* Resumes Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : resumes && resumes.length > 0 ? (
            <motion.div 
              className="resumes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 will-change-opacity"
              variants={staggeredContainer}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {filteredResumes().map((resume: any) => (
                <motion.div 
                  key={resume.id} 
                  variants={cardAnimation}
                  className="will-change-transform"
                  style={{ transform: 'translateZ(0)' }}>
                  <Card className="overflow-hidden resume-card">
                    <CardContent className="p-0">
                      <div className="bg-primary/5 p-6 flex items-center">
                        <FileText className="h-10 w-10 text-primary mr-4" />
                        <div>
                          <h3 className="font-medium">{resume.name}</h3>
                          <p className="text-sm text-neutral-500">
                            {resume.template.charAt(0).toUpperCase() + resume.template.slice(1)} Template
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Last updated: {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewResume(resume)}
                      >
                        Preview
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedResume(resume);
                            setIsAddResumeOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => duplicateResumeMutation.mutate(resume)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteResume(resume.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => {
                            // Create a hidden div for the resume content
                            const hiddenDiv = document.createElement('div');
                            hiddenDiv.id = `temp-resume-${resume.id}`;
                            hiddenDiv.style.position = 'absolute';
                            hiddenDiv.style.left = '-9999px';
                            hiddenDiv.style.top = '-9999px';
                            
                            // Add resume content to the hidden div
                            hiddenDiv.innerHTML = `
                              <div class="bg-white p-6">
                                <div class="mb-6 border-b pb-4">
                                  <h2 class="text-2xl font-bold text-center">
                                    ${resume.content.personalInfo.fullName || 'Full Name'}
                                  </h2>
                                  <div class="flex flex-wrap justify-center gap-3 mt-2 text-sm text-neutral-600">
                                    ${resume.content.personalInfo.email ? `<span>${resume.content.personalInfo.email}</span>` : ''}
                                    ${resume.content.personalInfo.phone ? `<span>| ${resume.content.personalInfo.phone}</span>` : ''}
                                    ${resume.content.personalInfo.location ? `<span>| ${resume.content.personalInfo.location}</span>` : ''}
                                  </div>
                                </div>
                                
                                ${resume.content.summary ? `
                                <div class="mb-6">
                                  <h3 class="text-lg font-semibold border-b pb-1 mb-2">Professional Summary</h3>
                                  <p class="text-sm">${resume.content.summary}</p>
                                </div>` : ''}
                                
                                ${resume.content.skills && resume.content.skills.length > 0 ? `
                                <div class="mb-6">
                                  <h3 class="text-lg font-semibold border-b pb-1 mb-2">Skills</h3>
                                  <div class="flex flex-wrap gap-2">
                                    ${resume.content.skills.map((skill: string) => 
                                      `<span class="bg-primary/10 text-primary px-2 py-1 rounded text-sm">${skill}</span>`
                                    ).join('')}
                                  </div>
                                </div>` : ''}
                                
                                ${resume.content.experience && resume.content.experience.length > 0 ? `
                                <div class="mb-6">
                                  <h3 class="text-lg font-semibold border-b pb-1 mb-3">Experience</h3>
                                  <div class="space-y-4">
                                    ${resume.content.experience.map((exp: any) => `
                                      <div>
                                        <div class="flex justify-between">
                                          <h4 class="font-medium">${exp.position}</h4>
                                          <div class="text-sm text-neutral-600">
                                            ${exp.startDate} - ${exp.currentJob ? 'Present' : exp.endDate}
                                          </div>
                                        </div>
                                        <div class="text-sm font-medium text-primary">${exp.company}</div>
                                        ${exp.description ? `<p class="text-sm mt-2">${exp.description}</p>` : ''}
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>` : ''}
                                
                                ${resume.content.education && resume.content.education.length > 0 ? `
                                <div class="mb-6">
                                  <h3 class="text-lg font-semibold border-b pb-1 mb-3">Education</h3>
                                  <div class="space-y-4">
                                    ${resume.content.education.map((edu: any) => `
                                      <div>
                                        <div class="flex justify-between">
                                          <h4 class="font-medium">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h4>
                                          <div class="text-sm text-neutral-600">
                                            ${edu.startDate} - ${edu.endDate || 'Present'}
                                          </div>
                                        </div>
                                        <div class="text-sm font-medium text-primary">${edu.institution}</div>
                                        ${edu.description ? `<p class="text-sm mt-2">${edu.description}</p>` : ''}
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>` : ''}
                                
                                ${resume.content.projects && resume.content.projects.length > 0 ? `
                                <div class="mb-6">
                                  <h3 class="text-lg font-semibold border-b pb-1 mb-3">Projects</h3>
                                  <div class="space-y-4">
                                    ${resume.content.projects.map((project: any) => `
                                      <div>
                                        <h4 class="font-medium">
                                          ${project.name}
                                          ${project.url ? `
                                            <a 
                                              href="${project.url}" 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              class="text-sm text-primary ml-2"
                                            >
                                              (Link)
                                            </a>
                                          ` : ''}
                                        </h4>
                                        ${project.description ? `<p class="text-sm mt-1">${project.description}</p>` : ''}
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>` : ''}
                              </div>
                            `;
                            
                            // Append the hidden div to the document
                            document.body.appendChild(hiddenDiv);
                            
                            // Download the resume
                            handleDownloadPDF(`temp-resume-${resume.id}`);
                            
                            // Remove the hidden div after a delay
                            setTimeout(() => {
                              document.body.removeChild(hiddenDiv);
                            }, 2000);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-100"
              variants={fadeIn}
            >
              <div className="bg-[#f4f4f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-primary/60" />
              </div>
              <h3 className="text-2xl font-medium mb-3">You haven't created any resumes yet</h3>
              <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                Create your first professional resume to showcase your skills and experience to potential employers.
              </p>
              <Button 
                onClick={() => {
                  setSelectedResume(null);
                  setIsAddResumeOpen(true);
                }}
                size="lg" 
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Resume
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="suggestions">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Optimize Your Resume with AI</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-neutral-500 mb-4">
                      Your work history will be automatically used from your profile to generate relevant suggestions.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="w-full" 
                      onClick={generateFullResume}
                      disabled={generateResumeMutation?.isPending}
                    >
                      {generateResumeMutation?.isPending ? 'Creating...' : 'Generate Resume'}
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={generateSuggestions}
                      disabled={getSuggestionsMutation.isPending}
                    >
                      {getSuggestionsMutation.isPending ? 'Generating...' : 'Generate Suggestions'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Suggestions</h3>

                {getSuggestionsMutation.isPending && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-12 w-12 text-primary/60 animate-spin mb-4" />
                    <p className="text-neutral-600 font-medium">
                      AI is analyzing your resume...
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      This may take a moment while we generate personalized suggestions.
                    </p>
                  </div>
                )}

                {!getSuggestionsMutation.isPending && showSuggestions && getSuggestionsMutation.data ? (
                  <motion.div 
                    className="space-y-6 will-change-opacity"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">Improvement Suggestions</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {getSuggestionsMutation.data.suggestions && 
                          getSuggestionsMutation.data.suggestions.length > 0 ? (
                          getSuggestionsMutation.data.suggestions.map((suggestion: any, index: number) => (
                            <li key={index} className="text-sm">{suggestion}</li>
                          ))
                        ) : (
                          <li className="text-sm text-neutral-500">No specific improvement suggestions.</li>
                        )}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Keywords to Include</h4>
                      <div className="flex flex-wrap gap-2">
                        {getSuggestionsMutation.data.keywords && 
                          getSuggestionsMutation.data.keywords.length > 0 ? (
                          getSuggestionsMutation.data.keywords.map((keyword: any, index: number) => (
                            <span 
                              key={index}
                              className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-500">No specific keywords to include.</p>
                        )}
                      </div>
                    </div>
                    
                    {/* If there's a data structure issue, show it as a fallback */}
                    {(!getSuggestionsMutation.data.suggestions || !getSuggestionsMutation.data.keywords) && (
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-700">Response Data Structure</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          <p className="mb-2">Raw response data for debugging:</p>
                          <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border border-amber-200">
                            {JSON.stringify(getSuggestionsMutation.data, null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                ) : (
                  !getSuggestionsMutation.isPending && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                      <p className="text-neutral-500">
                        Fill out the form and generate suggestions to make your resume stand out
                      </p>
                    </div>
                  )
                )}
                
                {getSuggestionsMutation.isError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {getSuggestionsMutation.error.message || "Failed to generate suggestions. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>


      </Tabs>

      {/* Add/Edit Resume Dialog */}
      <Dialog open={isAddResumeOpen} onOpenChange={setIsAddResumeOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResume ? 'Edit Resume' : 'Create New Resume'}</DialogTitle>
          </DialogHeader>
          <ResumeForm 
            resume={selectedResume} 
            onSuccess={() => setIsAddResumeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* New Resume Preview Dialog with Live Templates */}
      <ResumePreview
        open={!!previewResume}
        onOpenChange={(open) => {
          if (!open) setPreviewResume(null);
        }}
        resume={previewResume}
        onDownloadPDF={() => {
          // Create a hidden div for the formatted resume content
          if (previewResume) {
            const hiddenDiv = document.createElement('div');
            hiddenDiv.id = `temp-preview-resume`;
            hiddenDiv.style.position = 'absolute';
            hiddenDiv.style.left = '-9999px';
            hiddenDiv.style.top = '-9999px';
            
            // Create a clone of the currently visible resume template
            const visibleTemplate = document.querySelector('.resume-template');
            if (visibleTemplate) {
              const clonedTemplate = visibleTemplate.cloneNode(true) as HTMLElement;
              
              // Preserve all the styles from the original template
              const computedStyle = window.getComputedStyle(visibleTemplate);
              
              // Create a style element to ensure all CSS is applied during PDF generation
              const styleSheet = document.createElement('style');
              styleSheet.textContent = `
                #temp-preview-resume .resume-template {
                  transform: none !important;
                  width: 100% !important;
                  max-width: 860px !important;
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border-width: ${computedStyle.borderWidth} !important;
                  border-style: ${computedStyle.borderStyle} !important;
                  border-color: ${computedStyle.borderColor} !important;
                  padding: ${computedStyle.padding} !important;
                  background-color: white !important;
                  color: ${computedStyle.color} !important;
                  font-family: ${computedStyle.fontFamily} !important;
                  line-height: ${computedStyle.lineHeight} !important;
                  letter-spacing: ${computedStyle.letterSpacing} !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              `;
              
              // Remove the transform to avoid scaling issues in PDF
              clonedTemplate.style.transform = 'none';
              
              // Append both the style and template to hidden div
              hiddenDiv.appendChild(styleSheet);
              hiddenDiv.appendChild(clonedTemplate);
              document.body.appendChild(hiddenDiv);
              
              // Download the resume
              handleDownloadPDF(`temp-preview-resume`);
              
              // Remove the hidden div after a delay
              setTimeout(() => {
                document.body.removeChild(hiddenDiv);
              }, 2000);
            } else {
              toast({
                title: 'Error',
                description: 'Could not find the resume template to download',
                variant: 'destructive',
              });
            }
          }
        }}
      />

      {/* Generated Resume Dialog */}
      <Dialog open={isGeneratedResumeOpen} onOpenChange={setIsGeneratedResumeOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI-Generated Resume</DialogTitle>
            <p className="text-sm text-neutral-500">
              This resume was tailored to match the job description you provided. You can save it as a new resume or make further edits.
            </p>
          </DialogHeader>

          {generatedResume && (
            <div id="generated-resume" className="bg-white p-6 border rounded-md">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-center">
                  {generatedResume.personalInfo?.fullName || 'Your Name'}
                </h2>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-sm text-neutral-600">
                  {generatedResume.personalInfo?.email && (
                    <span>{generatedResume.personalInfo.email}</span>
                  )}
                  {generatedResume.personalInfo?.phone && (
                    <span>| {generatedResume.personalInfo.phone}</span>
                  )}
                  {generatedResume.personalInfo?.location && (
                    <span>| {generatedResume.personalInfo.location}</span>
                  )}
                </div>
              </div>

              {generatedResume.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-2">Professional Summary</h3>
                  <p className="text-sm">{generatedResume.summary}</p>
                </div>
              )}

              {generatedResume.skills && generatedResume.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedResume.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {generatedResume.experience && generatedResume.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-3">Experience</h3>
                  <div className="space-y-4">
                    {generatedResume.experience.map((exp: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h4 className="font-medium">{exp.position}</h4>
                          <div className="text-sm text-neutral-600">
                            {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary">{exp.company}</div>
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {exp.achievements.map((achievement: string, idx: number) => (
                              <li key={idx} className="text-sm">{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedResume.education && generatedResume.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-3">Education</h3>
                  <div className="space-y-4">
                    {generatedResume.education.map((edu: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h4 className="font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h4>
                          <div className="text-sm text-neutral-600">
                            {edu.startDate} - {edu.endDate || 'Present'}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary">{edu.institution}</div>
                        {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setIsGeneratedResumeOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  // Create a hidden div for the generated resume content if it exists
                  if (generatedResume) {
                    const hiddenDiv = document.createElement('div');
                    hiddenDiv.id = `temp-generated-resume`;
                    hiddenDiv.style.position = 'absolute';
                    hiddenDiv.style.left = '-9999px';
                    hiddenDiv.style.top = '-9999px';
                    
                    // Add resume content to the hidden div
                    hiddenDiv.innerHTML = `
                      <div class="bg-white p-6">
                        <div class="mb-6 border-b pb-4">
                          <h2 class="text-2xl font-bold text-center">
                            ${generatedResume.personalInfo?.fullName || 'Your Name'}
                          </h2>
                          <div class="flex flex-wrap justify-center gap-3 mt-2 text-sm text-neutral-600">
                            ${generatedResume.personalInfo?.email ? `<span>${generatedResume.personalInfo.email}</span>` : ''}
                            ${generatedResume.personalInfo?.phone ? `<span>| ${generatedResume.personalInfo.phone}</span>` : ''}
                            ${generatedResume.personalInfo?.location ? `<span>| ${generatedResume.personalInfo.location}</span>` : ''}
                          </div>
                        </div>
                        
                        ${generatedResume.summary ? `
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold border-b pb-1 mb-2">Professional Summary</h3>
                          <p class="text-sm">${generatedResume.summary}</p>
                        </div>` : ''}
                        
                        ${generatedResume.skills && generatedResume.skills.length > 0 ? `
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold border-b pb-1 mb-2">Skills</h3>
                          <div class="flex flex-wrap gap-2">
                            ${generatedResume.skills.map((skill: string) => 
                              `<span class="bg-primary/10 text-primary px-2 py-1 rounded text-sm">${skill}</span>`
                            ).join('')}
                          </div>
                        </div>` : ''}
                        
                        ${generatedResume.experience && generatedResume.experience.length > 0 ? `
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold border-b pb-1 mb-3">Experience</h3>
                          <div class="space-y-4">
                            ${generatedResume.experience.map((exp: any) => `
                              <div>
                                <div class="flex justify-between">
                                  <h4 class="font-medium">${exp.position}</h4>
                                  <div class="text-sm text-neutral-600">
                                    ${exp.startDate} - ${exp.currentJob ? 'Present' : exp.endDate}
                                  </div>
                                </div>
                                <div class="text-sm font-medium text-primary">${exp.company}</div>
                                ${exp.description ? `<p class="text-sm mt-2">${exp.description}</p>` : ''}
                                ${exp.achievements && exp.achievements.length > 0 ? `
                                  <ul class="list-disc pl-5 mt-2 space-y-1">
                                    ${exp.achievements.map((achievement: string) => `
                                      <li class="text-sm">${achievement}</li>
                                    `).join('')}
                                  </ul>
                                ` : ''}
                              </div>
                            `).join('')}
                          </div>
                        </div>` : ''}
                        
                        ${generatedResume.education && generatedResume.education.length > 0 ? `
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold border-b pb-1 mb-3">Education</h3>
                          <div class="space-y-4">
                            ${generatedResume.education.map((edu: any) => `
                              <div>
                                <div class="flex justify-between">
                                  <h4 class="font-medium">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h4>
                                  <div class="text-sm text-neutral-600">
                                    ${edu.startDate} - ${edu.endDate || 'Present'}
                                  </div>
                                </div>
                                <div class="text-sm font-medium text-primary">${edu.institution}</div>
                                ${edu.description ? `<p class="text-sm mt-2">${edu.description}</p>` : ''}
                              </div>
                            `).join('')}
                          </div>
                        </div>` : ''}
                      </div>
                    `;
                    
                    // Append the hidden div to the document
                    document.body.appendChild(hiddenDiv);
                    
                    // Download the resume
                    handleDownloadPDF(`temp-generated-resume`);
                    
                    // Remove the hidden div after a delay
                    setTimeout(() => {
                      document.body.removeChild(hiddenDiv);
                    }, 2000);
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => {
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
                    projects: []
                  }
                };

                // Close this dialog
                setIsGeneratedResumeOpen(false);

                // Set selected resume to this new one and open the edit dialog
                setSelectedResume(newResume);
                setIsAddResumeOpen(true);
              }}>
                Save as Resume
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Career Optimization Dialog */}
      <Dialog open={isOptimizeDialogOpen} onOpenChange={setIsOptimizeDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Optimize Your Career Profile</DialogTitle>
            <DialogDescription>
              AI has analyzed your career data and the job description to create an optimized version that highlights your most relevant skills and experiences.
            </DialogDescription>
          </DialogHeader>
          
          {isOptimizing ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-center text-neutral-600">
                Optimizing your career data based on the job description...
              </p>
            </div>
          ) : optimizedCareerData ? (
            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Career Summary</h3>
                <div className="bg-neutral-50 p-3 rounded-md">
                  <p>{optimizedCareerData.careerSummary}</p>
                </div>
                {optimizedCareerData.explanations?.summary && (
                  <Alert>
                    <AlertTitle>How this was improved</AlertTitle>
                    <AlertDescription className="text-sm text-neutral-600">
                      {optimizedCareerData.explanations.summary}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Work History</h3>
                {optimizedCareerData.workHistory?.map((item: any) => (
                  <div key={item.id} className="border rounded-md p-3">
                    <div className="font-medium">{item.company} - {item.position}</div>
                    <div className="text-sm text-neutral-600 mt-1">{item.description}</div>
                    
                    {item.achievements && item.achievements.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm">Key Achievements:</div>
                        <ul className="list-disc list-inside text-sm text-neutral-600">
                          {item.achievements.map((achievement: string, i: number) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                {optimizedCareerData.explanations?.workHistory && (
                  <Alert>
                    <AlertTitle>How work history was enhanced</AlertTitle>
                    <AlertDescription className="text-sm text-neutral-600">
                      {optimizedCareerData.explanations.workHistory}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {optimizedCareerData.skills && optimizedCareerData.skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Highlighted Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {optimizedCareerData.skills.map((skill: string, i: number) => (
                      <div key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </div>
                    ))}
                  </div>
                  
                  {optimizedCareerData.explanations?.skills && (
                    <Alert>
                      <AlertTitle>Skill Recommendations</AlertTitle>
                      <AlertDescription className="text-sm text-neutral-600">
                        {optimizedCareerData.explanations.skills}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-neutral-600">No optimized data available</p>
            </div>
          )}
          
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Switch
                  checked={shouldUpdateProfile}
                  onCheckedChange={setShouldUpdateProfile}
                />
                <span>Update my profile with these optimized details</span>
              </label>
            </div>
            <p className="text-xs text-neutral-500">
              When enabled, your profile in Account Settings will be updated with these optimized descriptions and skills.
            </p>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOptimizeDialogOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {shouldUpdateProfile ? (
                <Button 
                  onClick={() => {
                    updateCareerDataMutation.mutate();
                    optimizeAndGenerateResume();
                  }}
                  disabled={updateCareerDataMutation.isPending}
                >
                  {updateCareerDataMutation.isPending ? (
                    <>Updating profile</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> 
                      Save to Profile & Generate
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={optimizeAndGenerateResume}>
                  <ArrowRight className="mr-2 h-4 w-4" /> 
                  Generate Resume Only
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}