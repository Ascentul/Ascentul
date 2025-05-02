import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, FileText, Download, Copy, Trash2, Edit, Palette, FileUp, ArrowRight, ArrowLeft, RefreshCw, Save, Loader2, AlertCircle, BarChart4, Sparkles } from 'lucide-react';
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
  const [isSavingResume, setIsSavingResume] = useState<boolean>(false);
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
      } else {
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
  const saveGeneratedResume = (resumeData: any) => {
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
        const currentSkillsResponse = await apiRequest('GET', '/api/career-data');
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

    // Set the flag that we're generating from optimization flow
    setIsGeneratingFromOptimize(true);

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

  // Function to download resume as PDF using our centralized utility
  const handleDownloadPDF = async (elementId: string) => {
    console.log(`Initiating PDF download for resume with element ID: ${elementId}`);

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
        console.log(`Resume PDF successfully generated with name: ${filename}`);
      } else {
        console.error('Failed to generate resume PDF');
      }
    } catch (error) {
      console.error('Error during resume PDF export:', error);
      toast({
        title: 'Export Error',
        description: 'There was a problem creating your resume PDF. Please try again.',
        variant: 'destructive',
      });
    }
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
          <TabsTrigger value="suggestions">Generate With AI</TabsTrigger>
          <TabsTrigger value="analyze">Upload & Analyze</TabsTrigger>
        </TabsList>

        {/* Add ResumeAnalyzer to "analyze" tab */}
        <TabsContent value="analyze" className="space-y-6">
          <motion.div
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left column: Resume upload and job description - using self-start to prevent height stretching */}
              <div className="lg:w-1/2">
                <ResumeAnalyzer 
                  onExtractComplete={handleExtractComplete}
                  jobDescription={extractionJobDescription}
                  setJobDescription={setExtractionJobDescription}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyzeExtractedText}
                />
              </div>

              {/* Right column: Analysis results or loading state or instructions */}
              <div className="lg:w-1/2">
                {analysisResults ? (
                  <motion.div 
                    className="grid grid-cols-1 gap-6 will-change-opacity will-change-transform overflow-auto"
                    variants={subtleUp}
                    style={{ transform: 'translateZ(0)' }}
                  >
                    {/* Display analysis results */}
                    <ResumeAnalysisResults results={analysisResults} />

                    {/* Action buttons */}
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
                          New Analysis
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : isAnalyzing ? (
                  <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200">
                    <CardContent className="pt-6 bg-transparent">
                      <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header" id="analysisHeader">
                        <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
                        AI Analysis Results
                      </h3>

                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-16 h-16 mb-6 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>

                        <p className="text-neutral-600 text-lg mb-2">
                          Analyzing your resume...
                        </p>

                        <p className="text-neutral-500 mb-6">
                          This may take a few seconds.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200">
                    <CardContent className="pt-6 bg-transparent">
                      <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center analysis-header" id="analysisHeader">
                        <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
                        AI Analysis Results
                      </h3>

                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-16 h-16 mb-6 text-neutral-200">
                          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M32 12L35.3 18.76L42.64 19.84L37.32 25.04L38.64 32.36L32 28.88L25.36 32.36L26.68 25.04L21.36 19.84L28.7 18.76L32 12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M44 42L46 46L50 47L47 50L48 54L44 52L40 54L41 50L38 47L42 46L44 42Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 44L18 46L20 48L18 50L20 52L22 50L24 52L22 48L24 46L22 44L20 44Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        <p className="text-neutral-600 text-lg mb-2">
                          Submit your resume and job description
                        </p>

                        <p className="text-neutral-500 mb-6">
                          to see AI-powered analysis and suggestions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
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
                  <Card className="overflow-hidden resume-card transition-shadow duration-300">
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
                          variant="outline" 
                          size="sm"
                          className="h-8 flex items-center gap-1 text-xs"
                          onClick={async () => {
                            try {
                              // Set the preview resume to trigger rendering
                              setPreviewResume(resume);

                              // Allow template to render
                              await new Promise(resolve => setTimeout(resolve, 100));

                              const resumeElement = document.querySelector('.resume-template');
                              if (!resumeElement) {
                                throw new Error("Could not find resume template");
                              }

                              const success = await exportResumeToPDF(resumeElement as HTMLElement, {
                                filename: `${resume.name}_${new Date().toISOString().split('T')[0]}.pdf`,
                                showToast: true // Enable success/error toasts
                              });

                              if (!success) {
                                console.error("PDF export failed");
                              }
                            } catch (error) {
                              console.error("Error during PDF export:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not generate PDF. Please try again.",
                                variant: "destructive"
                              });
                            } finally {
                              // Always clear preview state
                              setPreviewResume(null);
                            }
                          }}
                          title="Download resume as PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16 px-6 bg-gradient-to-b from-white to-[#f0f6ff] rounded-lg shadow-md shadow-gray-200 border border-gray-100"
              variants={fadeIn}
            >
              <div className="bg-[#f4f4f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-medium mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">You haven't created any resumes yet</h3>
              <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                Create your first professional resume to showcase your skills and experience to potential employers.
              </p>
              <Button 
                onClick={() => {
                  setSelectedResume(null);
                  setIsAddResumeOpen(true);
                }}
                size="lg" 
                className="shadow-sm hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Resume
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="suggestions">
          <motion.div 
            className="will-change-opacity will-change-transform mt-3"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card className="w-full bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200">
              <CardContent className="pt-3 px-5 pb-6 bg-transparent">
                <h3 className="text-xl font-semibold mb-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Generate the Perfect Resume with AI</h3>
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[240px] w-full"
                    />
                  </div>

                  <div className="flex justify-center mt-4 mb-6">
                    <Button 
                      className="px-8" 
                      onClick={generateFullResume}
                      disabled={generateResumeMutation?.isPending}
                      size="lg"
                    >
                      {generateResumeMutation?.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Resume...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Resume
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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
        onDownloadPDF={() => {/* No longer needed - handled in component */}}
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
            <div id="generated-resume" className="resume-template resume-export-container">
              <div className="bg-white p-8 max-w-[8.5in] mx-auto resume-content">
                {/* Header */}
                <header className="mb-6 pb-4 border-b border-neutral-200">
                  <h1 className="text-2xl font-bold text-center text-neutral-900">
                    {generatedResume.personalInfo?.fullName || 'Your Name'}
                  </h1>
                  <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-sm text-neutral-600">
                    {generatedResume.personalInfo?.email && <span>{generatedResume.personalInfo.email}</span>}
                    {generatedResume.personalInfo?.phone && <span>{generatedResume.personalInfo.phone}</span>}
                    {generatedResume.personalInfo?.location && <span>{generatedResume.personalInfo.location}</span>}
                  </div>
                </header>

                {/* Summary Section */}
                {generatedResume.summary && (
                  <section className="mb-6 resume-section">
                    <h2 className="text-lg font-semibold border-b pb-1 mb-3 resume-section-header">Professional Summary</h2>
                    <p className="text-sm leading-relaxed">{generatedResume.summary}</p>
                  </section>
                )}

                {/* Skills Section */}
                {generatedResume.skills && generatedResume.skills.length > 0 && (
                  <section className="mb-6 resume-section">
                    <h2 className="text-lg font-semibold border-b pb-1 mb-3 resume-section-header">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {generatedResume.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Experience Section */}
                {generatedResume.experience && generatedResume.experience.length > 0 && (
                  <section className="mb-6 resume-section">
                    <h2 className="text-lg font-semibold border-b pb-1 mb-3 resume-section-header">Experience</h2>
                    <div className="space-y-4">
                      {generatedResume.experience.map((exp: any, index: number) => (
                        <div key={index} className="job-item">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium text-neutral-900">{exp.position}</h3>
                            <div className="text-sm text-neutral-600">
                              {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-primary mb-1">{exp.company}</div>
                          {exp.description && <p className="text-sm mt-1 leading-relaxed">{exp.description}</p>}
                          {exp.achievements && exp.achievements.length > 0 && (
                            <ul className="list-disc pl-5 mt-2 space-y-1 achievements">
                              {exp.achievements.map((achievement: string, idx: number) => (
                                <li key={idx} className="text-sm">{achievement}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education Section */}
                {generatedResume.education && generatedResume.education.length > 0 && (
                  <section className="mb-6 resume-section">
                    <h2 className="text-lg font-semibold border-b pb-1 mb-3 resume-section-header">Education</h2>
                    <div className="space-y-4">
                      {generatedResume.education.map((edu: any, index: number) => (
                        <div key={index} className="education-item">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium text-neutral-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h3>
                            <div className="text-sm text-neutral-600">
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-primary mb-1">{edu.institution}</div>
                          {edu.description && <p className="text-sm mt-1 leading-relaxed">{edu.description}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setIsGeneratedResumeOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={async () => {
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
                    } catch (error) {
                      console.error("Error during PDF export:", error);
                      toast({
                        title: "Export Failed",
                        description: "Could not generate PDF. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button 
                onClick={() => {
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
                }}
                disabled={isSavingResume}
              >
                {isSavingResume ? (
                  <>
                    <span className="animate-spin mr-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to My Resumes
                  </>
                )}
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