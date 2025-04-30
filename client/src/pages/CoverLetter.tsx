import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Mail, 
  Download, 
  Copy, 
  Trash2, 
  Edit, 
  FileText, 
  Sparkles, 
  BarChart4, 
  UploadCloud, 
  FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CoverLetterForm from '@/components/CoverLetterForm';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function CoverLetter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [previewLetter, setPreviewLetter] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's cover letters
  const { data: coverLetters = [], isLoading } = useQuery({
    queryKey: ['/api/cover-letters'],
  });

  // AI generation form fields
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  // Analysis form fields
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('');
  const [analyzeCoverLetterText, setAnalyzeCoverLetterText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const deleteCoverLetterMutation = useMutation({
    mutationFn: async (letterId: number) => {
      return apiRequest('DELETE', `/api/cover-letters/${letterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Deleted',
        description: 'Your cover letter has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const duplicateCoverLetterMutation = useMutation({
    mutationFn: async (letter: any) => {
      const newLetter = {
        ...letter,
        name: `${letter.name} (Copy)`,
      };
      delete newLetter.id;
      delete newLetter.createdAt;
      delete newLetter.updatedAt;
      
      return apiRequest('POST', '/api/cover-letters', newLetter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Duplicated',
        description: 'A copy of your cover letter has been created',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to duplicate cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const generateCoverLetterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cover-letters/generate', {
        jobTitle,
        companyName,
        jobDescription,
        type: 'complete'
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Cover Letter Generated',
        description: 'AI has generated a cover letter for you',
      });
      setGeneratedContent(data.content);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      // For suggestions, only the job description is required
      const res = await apiRequest('POST', '/api/cover-letters/generate', {
        jobTitle: jobTitle || 'Not specified',
        companyName: companyName || 'Not specified',
        jobDescription,
        type: 'suggestions'
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Suggestions Generated',
        description: 'Writing suggestions for your cover letter have been generated',
      });
      setGeneratedContent(data.suggestions || data.content);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to generate suggestions: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const analyzeCoverLetterMutation = useMutation({
    mutationFn: async () => {
      if (!analyzeJobDescription || !analyzeCoverLetterText) {
        throw new Error("Both job description and cover letter are required");
      }
      
      const res = await apiRequest('POST', '/api/cover-letters/analyze', {
        coverLetter: analyzeCoverLetterText,
        jobDescription: analyzeJobDescription,
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: 'Analysis Complete',
        description: 'Your cover letter has been analyzed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: `Error analyzing cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteLetter = (letterId: number) => {
    if (confirm('Are you sure you want to delete this cover letter?')) {
      deleteCoverLetterMutation.mutate(letterId);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedContent) return;
    
    // Create a new letter with the generated content
    const newLetter = {
      name: `${jobTitle} at ${companyName}`,
      template: 'standard',
      content: {
        header: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          date: new Date().toLocaleDateString(),
        },
        recipient: {
          name: '',
          company: companyName,
          position: 'Hiring Manager',
          address: '',
        },
        body: generatedContent,
        closing: 'Sincerely,',
      }
    };
    
    // Create a new cover letter with the mutation
    apiRequest('POST', '/api/cover-letters', newLetter)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
        toast({
          title: 'Cover Letter Saved',
          description: 'Your generated cover letter has been saved',
        });
        setGeneratedContent('');
        setJobTitle('');
        setCompanyName('');
        setJobDescription('');
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: `Failed to save cover letter: ${error.message}`,
          variant: 'destructive',
        });
      });
  };

  const filteredLetters = () => {
    if (!coverLetters) return [];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return coverLetters.filter(
        (letter: any) => letter.name.toLowerCase().includes(query)
      );
    }
    
    return coverLetters;
  };

  const generateCoverLetter = () => {
    if (!jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a job description to generate a cover letter',
        variant: 'destructive',
      });
      return;
    }
    
    generateCoverLetterMutation.mutate();
  };
  
  const generateSuggestions = () => {
    if (!jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a job description to generate suggestions',
        variant: 'destructive',
      });
      return;
    }
    
    generateSuggestionsMutation.mutate();
  };
  
  const handleAnalyzeCoverLetter = () => {
    if (!analyzeJobDescription || !analyzeCoverLetterText) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a job description and cover letter to analyze',
        variant: 'destructive',
      });
      return;
    }
    
    analyzeCoverLetterMutation.mutate();
  };
  
  const handleSaveOptimizedCoverLetter = () => {
    if (!analysisResult?.optimizedCoverLetter) return;
    
    // Create a new letter with the optimized content
    const newLetter = {
      name: `Optimized Cover Letter ${new Date().toLocaleDateString()}`,
      template: 'standard',
      content: {
        header: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          date: new Date().toLocaleDateString(),
        },
        recipient: {
          name: '',
          company: '',
          position: 'Hiring Manager',
          address: '',
        },
        body: analysisResult.optimizedCoverLetter,
        closing: 'Sincerely,',
      }
    };
    
    // Create a new cover letter with the mutation
    apiRequest('POST', '/api/cover-letters', newLetter)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
        toast({
          title: 'Optimized Cover Letter Saved',
          description: 'Your optimized cover letter has been saved',
        });
        setAnalysisResult(null);
        setAnalyzeJobDescription('');
        setAnalyzeCoverLetterText('');
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: `Failed to save optimized cover letter: ${error.message}`,
          variant: 'destructive',
        });
      });
  };
  
  // Function to download cover letter as PDF
  const handleDownloadPDF = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: 'Error',
        description: 'Could not find the cover letter content to download',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a filename based on letter name or default
    const letterName = previewLetter?.name || 'cover-letter';
    const filename = `${letterName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    
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
          <h1 className="text-2xl font-bold font-poppins">Cover Letters</h1>
          <p className="text-neutral-500">Create targeted cover letters for your job applications</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => {
            setSelectedLetter(null);
            setIsAddLetterOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Cover Letter
        </Button>
      </motion.div>
      
      <Tabs defaultValue="letters" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="letters">
            My Cover Letters {coverLetters && coverLetters.length > 0 && `(${coverLetters.length})`}
          </TabsTrigger>
          <TabsTrigger value="suggestions">Optimize with AI</TabsTrigger>
          <TabsTrigger value="analyze">Upload & Analyze</TabsTrigger>
        </TabsList>
        
        <TabsContent value="letters" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Input
              placeholder="Search cover letters..."
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
          </div>
          
          {/* Cover Letters Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : coverLetters && coverLetters.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggeredContainer}
            >
              {filteredLetters().map((letter: any, i: number) => (
                <motion.div 
                  key={letter.id}
                  variants={cardAnimation}
                  className="will-change-transform"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Card className="overflow-hidden group hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-0">
                      <div className="bg-primary/5 p-6 flex items-center">
                        <Mail className="h-10 w-10 text-primary mr-4" />
                        <div>
                          <h3 className="font-medium">{letter.name}</h3>
                          <p className="text-sm text-neutral-500">
                            {letter.template.charAt(0).toUpperCase() + letter.template.slice(1)} Template
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Last updated: {new Date(letter.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewLetter(letter)}
                      >
                        Preview
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedLetter(letter);
                            setIsAddLetterOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => duplicateCoverLetterMutation.mutate(letter)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteLetter(letter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => {
                            // Create a hidden div for the cover letter content
                            const hiddenDiv = document.createElement('div');
                            hiddenDiv.id = `temp-letter-${letter.id}`;
                            hiddenDiv.style.position = 'absolute';
                            hiddenDiv.style.left = '-9999px';
                            hiddenDiv.style.top = '-9999px';
                            
                            // Add cover letter content to the hidden div
                            hiddenDiv.innerHTML = `
                              <div class="bg-white p-6">
                                <!-- Header with contact info -->
                                <div class="mb-6">
                                  <h2 class="text-xl font-bold">
                                    ${letter.content.header.fullName}
                                  </h2>
                                  <div class="text-sm text-neutral-600">
                                    ${letter.content.header.location ? `<div>${letter.content.header.location}</div>` : ''}
                                    ${letter.content.header.phone ? `<div>${letter.content.header.phone}</div>` : ''}
                                    ${letter.content.header.email ? `<div>${letter.content.header.email}</div>` : ''}
                                  </div>
                                </div>
                                
                                <!-- Date -->
                                <div class="mb-6">
                                  <p>${letter.content.header.date}</p>
                                </div>
                                
                                <!-- Recipient -->
                                <div class="mb-6">
                                  ${letter.content.recipient.name ? `<p>${letter.content.recipient.name}</p>` : ''}
                                  ${letter.content.recipient.position ? `<p>${letter.content.recipient.position}</p>` : ''}
                                  ${letter.content.recipient.company ? `<p>${letter.content.recipient.company}</p>` : ''}
                                  ${letter.content.recipient.address ? `<p>${letter.content.recipient.address}</p>` : ''}
                                </div>
                                
                                <!-- Greeting -->
                                <div class="mb-6">
                                  <p>Dear ${letter.content.recipient.name || "Hiring Manager"},</p>
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
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Mail className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Cover Letters Created Yet</h3>
              <p className="text-neutral-500 mb-4">
                Start by creating your first professional cover letter
              </p>
              <Button
                onClick={() => {
                  setSelectedLetter(null);
                  setIsAddLetterOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Cover Letter
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analyze" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Upload & Analyze Cover Letter</h3>
                <p className="text-neutral-500 mb-4">
                  Get AI-powered insights on how well your cover letter aligns with a specific job.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Job Description</Label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={analyzeJobDescription}
                      onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Cover Letter</Label>
                    <Textarea
                      placeholder="Paste your cover letter text here..."
                      value={analyzeCoverLetterText}
                      onChange={(e) => setAnalyzeCoverLetterText(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleAnalyzeCoverLetter}
                    disabled={analyzeCoverLetterMutation.isPending}
                  >
                    {analyzeCoverLetterMutation.isPending ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart4 className="mr-2 h-4 w-4" />
                        Analyze Cover Letter
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                {!analysisResult ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <Sparkles className="h-12 w-12 text-neutral-300 mb-2" />
                    <p className="text-neutral-500">
                      Submit your cover letter and job description to see AI-powered analysis and suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-xl font-bold">{Math.round(analysisResult.overallScore)}</span>
                        <span className="text-xs text-neutral-500">Overall</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-xl font-bold">{Math.round(analysisResult.alignment)}</span>
                        <span className="text-xs text-neutral-500">Alignment</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-xl font-bold">{Math.round(analysisResult.persuasiveness)}</span>
                        <span className="text-xs text-neutral-500">Persuasive</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-xl font-bold">{Math.round(analysisResult.clarity)}</span>
                        <span className="text-xs text-neutral-500">Clarity</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Strengths</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysisResult.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-neutral-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Areas to Improve</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysisResult.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-neutral-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysisResult.improvementSuggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-neutral-700">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Optimized Cover Letter</h4>
                      <div className="bg-primary/5 p-3 rounded-lg max-h-[300px] overflow-y-auto">
                        <p className="whitespace-pre-line text-sm">
                          {analysisResult.optimizedCoverLetter}
                        </p>
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        variant="outline"
                        onClick={handleSaveOptimizedCoverLetter}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Save Optimized Version
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="suggestions">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Optimize Your Cover Letter with AI</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Job Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Job Title <span className="text-neutral-400">(optional)</span></Label>
                      <Input
                        placeholder="e.g., Software Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Company Name <span className="text-neutral-400">(optional)</span></Label>
                      <Input
                        placeholder="e.g., ABC Company"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-neutral-500 mb-4">
                      Your career data (work history, education, skills) will be automatically used from your profile to create a tailored cover letter.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          if (!jobDescription) {
                            toast({
                              title: 'Missing Information',
                              description: 'Please fill out the Job Description field to generate suggestions',
                              variant: 'destructive',
                            });
                            return;
                          }
                          generateSuggestionsMutation.mutate();
                        }}
                        disabled={generateSuggestionsMutation.isPending}
                        variant="outline"
                      >
                        {generateSuggestionsMutation.isPending ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                            Getting suggestions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get Suggestions
                          </>
                        )}
                      </Button>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          if (!jobDescription) {
                            toast({
                              title: 'Missing Information',
                              description: 'Please provide a job description to generate a cover letter',
                              variant: 'destructive',
                            });
                            return;
                          }
                          
                          // Optional fields can be added if available
                          generateCoverLetterMutation.mutate();
                        }}
                        disabled={generateCoverLetterMutation.isPending}
                      >
                        {generateCoverLetterMutation.isPending ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Generate Cover Letter
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Generate a full cover letter or just get writing suggestions — your call.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={generatedContent ? 'block' : 'hidden'}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Generated Cover Letter</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Create a dummy element to copy the text
                      const dummy = document.createElement('textarea');
                      dummy.value = generatedContent;
                      document.body.appendChild(dummy);
                      dummy.select();
                      document.execCommand('copy');
                      document.body.removeChild(dummy);
                      
                      // Show toast
                      toast({
                        title: 'Copied!',
                        description: 'Cover letter content copied to clipboard',
                      });
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="border rounded-md p-4 mb-4 max-h-[400px] overflow-y-auto whitespace-pre-line bg-gray-50">
                  {generatedContent || 'Your generated cover letter will appear here.'}
                </div>
                <Button 
                  onClick={handleSaveGenerated} 
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Save as Cover Letter
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Cover Letter Dialog */}
      <Dialog open={isAddLetterOpen} onOpenChange={setIsAddLetterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLetter ? 'Edit Cover Letter' : 'Create Cover Letter'}</DialogTitle>
          </DialogHeader>
          <CoverLetterForm 
            initialData={selectedLetter}
            onSubmit={async (data) => {
              try {
                const response = await fetch(
                  selectedLetter ? `/api/cover-letters/${selectedLetter.id}` : '/api/cover-letters',
                  {
                    method: selectedLetter ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  }
                );
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to save cover letter');
                }
                
                await queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
                setIsAddLetterOpen(false);
                
                toast({
                  title: `Cover Letter ${selectedLetter ? 'Updated' : 'Created'}`,
                  description: `Your cover letter has been ${selectedLetter ? 'updated' : 'created'} successfully`,
                });
              } catch (error: any) {
                toast({
                  title: 'Error',
                  description: `Failed to ${selectedLetter ? 'update' : 'create'} cover letter: ${error.message}`,
                  variant: 'destructive',
                });
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Preview Cover Letter Dialog */}
      {previewLetter && (
        <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewLetter.name}</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 border rounded-lg p-6" id="cover-letter-preview">
              {/* Header with contact info */}
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {previewLetter.content.header.fullName || '[Your Full Name]'}
                </h2>
                <div className="text-sm text-neutral-600">
                  {previewLetter.content.header.location && (
                    <div>{previewLetter.content.header.location}</div>
                  )}
                  {previewLetter.content.header.phone && (
                    <div>{previewLetter.content.header.phone}</div>
                  )}
                  {previewLetter.content.header.email && (
                    <div>{previewLetter.content.header.email}</div>
                  )}
                </div>
              </div>
              
              {/* Date */}
              <div className="mb-6">
                <p>{previewLetter.content.header.date || new Date().toLocaleDateString()}</p>
              </div>
              
              {/* Recipient */}
              <div className="mb-6">
                {previewLetter.content.recipient.name && (
                  <p>{previewLetter.content.recipient.name}</p>
                )}
                {previewLetter.content.recipient.position && (
                  <p>{previewLetter.content.recipient.position}</p>
                )}
                {previewLetter.content.recipient.company && (
                  <p>{previewLetter.content.recipient.company}</p>
                )}
                {previewLetter.content.recipient.address && (
                  <p>{previewLetter.content.recipient.address}</p>
                )}
              </div>
              
              {/* Greeting */}
              <div className="mb-6">
                <p>Dear {previewLetter.content.recipient.name || "Hiring Manager"},</p>
              </div>
              
              {/* Body */}
              <div className="mb-6 whitespace-pre-line">
                {previewLetter.content.body}
              </div>
              
              {/* Closing */}
              <div>
                <p>{previewLetter.content.closing || "Sincerely,"}</p>
                <p className="mt-6">{previewLetter.content.header.fullName || '[Your Name]'}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => {
                  setSelectedLetter(previewLetter);
                  setPreviewLetter(null);
                  setIsAddLetterOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={() => handleDownloadPDF('cover-letter-preview')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}