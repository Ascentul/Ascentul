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
  FileUp,
  Loader2,
  ArrowLeft
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
          title: '✅ Cover letter saved',
          description: "Your cover letter has been saved to 'My Cover Letters'",
        });
        setGeneratedContent('');
        setJobTitle('');
        setCompanyName('');
        setJobDescription('');

        // Redirect to main tab would go here if needed
      })
      .catch((error) => {
        toast({
          title: 'Error saving cover letter',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      });
  };

  const filteredLetters = () => {
    if (!coverLetters || !Array.isArray(coverLetters)) return [];

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
            My Cover Letters {Array.isArray(coverLetters) && coverLetters.length > 0 && `(${coverLetters.length})`}
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
          ) : Array.isArray(coverLetters) && coverLetters.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 cover-letter-grid"
              variants={staggeredContainer}
              style={{ alignItems: 'stretch' }}
            >
              {filteredLetters().map((letter: any, i: number) => (
                <motion.div 
                  key={letter.id}
                  variants={cardAnimation}
                  className="will-change-transform"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <Card className="overflow-hidden h-full flex flex-col cover-letter-card">
                    <CardContent className="p-0 flex-1">
                      <div className="bg-primary/5 p-6 flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Mail className="h-10 w-10 text-primary mr-4" />
                          <div>
                            <h3 className="font-medium">{letter.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                              Created: {new Date(letter.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 text-sm text-neutral-600 line-clamp-3">
                        {letter.content.body.length > 150 ? (
                          <>{letter.content.body.substring(0, 150)}...</>
                        ) : (
                          <>{letter.content.body}</>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between border-t bg-white mt-auto">
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
                          onClick={() => handleDownloadPDF(`previewLetter-${letter.id}`)}
                          title="Download as PDF"
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
              <h3 className="text-2xl font-medium mb-3">You haven't created any cover letters yet</h3>
              <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                Create your first professional cover letter to showcase your qualifications
                and experience to potential employers.
              </p>
              <Button 
                onClick={() => {
                  setSelectedLetter(null);
                  setIsAddLetterOpen(true);
                }}
                size="lg" 
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Cover Letter
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Input form */}
            <Card className="overflow-hidden border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
                  <FileUp className="h-5 w-5 mr-2" />
                  Generate Cover Letter Content
                </h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        placeholder="e.g. Marketing Manager"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="e.g. Acme Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-neutral-500">This is required for AI to generate tailored content.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="w-full"
                      onClick={generateCoverLetter}
                      disabled={generateCoverLetterMutation.isPending}
                    >
                      {generateCoverLetterMutation.isPending ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Full Letter
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={generateSuggestions}
                      disabled={generateSuggestionsMutation.isPending}
                    >
                      {generateSuggestionsMutation.isPending ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Get Suggestions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="overflow-hidden border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI-Generated Content
                </h3>
                
                {!generatedContent ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center border border-dashed border-slate-200 rounded-lg">
                    <Sparkles className="h-12 w-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-500 max-w-xs">
                      Provide job details and click 'Generate' to create a tailored cover letter, or get writing suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 whitespace-pre-wrap" id="generatedContent">
                      {generatedContent}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setGeneratedContent('')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button onClick={handleSaveGenerated} disabled={!generatedContent}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Save as Cover Letter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <motion.div 
            className="flex flex-col lg:flex-row gap-6 [&>*]:flex-1 will-change-opacity will-change-transform"
            variants={subtleUp}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Left column: Cover letter upload and job description */}
            <Card className="overflow-hidden border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
                  <FileUp className="h-5 w-5 mr-2" />
                  Analyze Your Cover Letter
                </h3>
                <div className="space-y-6">
                  {/* Job Description input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-primary mr-1">1.</span> Job Description <span className="text-red-500 ml-1">*</span>
                      </div>
                      {analyzeJobDescription.trim().length > 100 && (
                        <span className="text-green-600 text-xs font-medium flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 mr-1"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Complete
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAnalyzeJobDescription("We're hiring a marketing associate with strong writing and cross-functional collaboration skills. The ideal candidate has experience creating compelling content, managing social media campaigns, and analyzing performance metrics. You'll work with our creative team to develop marketing materials that align with our brand voice and drive customer engagement.")}
                        className="h-6 text-xs text-primary"
                      >
                        Paste Example
                      </Button>
                    </Label>
                    <Textarea
                      placeholder="We're hiring a marketing associate with strong writing and cross-functional collaboration skills..."
                      value={analyzeJobDescription}
                      onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                      className={`min-h-[150px] resize-y border-2 ${
                        analyzeJobDescription.trim().length > 100 ? 'border-green-200 focus:border-green-300' : 
                        analyzeJobDescription.trim().length > 50 ? 'border-amber-200 focus:border-amber-300' : 
                        analyzeJobDescription.trim().length > 0 ? 'border-red-200 focus:border-red-300' : 
                        'border-primary/20 focus:border-primary/40'
                      }`}
                      id="jobDescription"
                      disabled={analyzeCoverLetterMutation.isPending}
                    />
                    {analyzeJobDescription.trim().length > 0 && analyzeJobDescription.trim().length < 50 && (
                      <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <div className="font-medium mb-1">Job Description Too Short</div>
                          <div className="text-xs">
                            Please provide a more detailed job description (at least 50 characters) for accurate analysis.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter textarea */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-primary mr-1">2.</span> Your Cover Letter <span className="text-red-500 ml-1">*</span>
                      </div>
                      {analyzeCoverLetterText.trim().length > 200 && (
                        <span className="text-green-600 text-xs font-medium flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 mr-1"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Complete
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAnalyzeCoverLetterText("Dear Hiring Manager,\n\nI'm writing to apply for the Marketing Associate position at your company. With my background in content creation and digital marketing, I believe I would be a valuable addition to your team. I have experience managing social media campaigns, creating engaging content, and analyzing performance metrics to optimize marketing strategies.\n\nThank you for considering my application. I look forward to the opportunity to discuss how my skills align with your needs.\n\nSincerely,\n[Your Name]")}
                        className="h-6 text-xs text-primary"
                      >
                        Paste Example
                      </Button>
                    </Label>
                    <Textarea
                      placeholder="Dear [Hiring Manager], I'm writing to apply for the Marketing Associate position..."
                      value={analyzeCoverLetterText}
                      onChange={(e) => setAnalyzeCoverLetterText(e.target.value)}
                      className={`min-h-[200px] resize-y border-2 ${
                        analyzeCoverLetterText.trim().length > 200 ? 'border-green-200 focus:border-green-300' : 
                        analyzeCoverLetterText.trim().length > 100 ? 'border-amber-200 focus:border-amber-300' : 
                        analyzeCoverLetterText.trim().length > 0 ? 'border-red-200 focus:border-red-300' : 
                        'border-primary/20 focus:border-primary/40'
                      }`}
                      id="coverLetterInput"
                      disabled={analyzeCoverLetterMutation.isPending}
                    />
                    {analyzeCoverLetterText.trim().length > 0 && analyzeCoverLetterText.trim().length < 100 && (
                      <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 mr-2 mt-0.5 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <div className="font-medium mb-1">Cover Letter Too Short</div>
                          <div className="text-xs">
                            Please provide a more complete cover letter (at least 100 characters) for meaningful analysis.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analyze button with tooltip */}
                  <div className="relative">
                    <Button 
                      className="w-full relative transition-all duration-300" 
                      onClick={handleAnalyzeCoverLetter}
                      disabled={analyzeCoverLetterMutation.isPending || !analyzeJobDescription.trim() || !analyzeCoverLetterText.trim() || 
                               analyzeJobDescription.trim().length < 50 || analyzeCoverLetterText.trim().length < 100}
                      variant={analyzeCoverLetterMutation.isPending ? "outline" : "default"}
                      id="analyzeBtn"
                      title="AI will assess how well your cover letter aligns with the job description and offer suggestions to improve clarity, tone, and relevance."
                    >
                      {analyzeCoverLetterMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing Cover Letter...
                        </>
                      ) : (
                        <>
                          <BarChart4 className="h-4 w-4 mr-2" />
                          {!analyzeJobDescription.trim() || !analyzeCoverLetterText.trim() ? 
                           "Analyze Cover Letter" : 
                           "Analyze Cover Letter"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right column: Analysis results or loading state or instructions */}
            {analysisResult ? (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-primary/90 flex items-center analysis-header" id="analysisHeader">
                      <BarChart4 className="h-5 w-5 mr-2" />
                      AI Analysis Results
                    </h3>
                    <span className="text-xs text-neutral-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Analyzed {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-4 gap-3">
                      {/* Score cards are styled with dynamic classes based on score */}
                      <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                        Math.round(analysisResult.overallScore) < 60 
                          ? 'bg-red-50/70 border-red-100' 
                          : Math.round(analysisResult.overallScore) < 80 
                            ? 'bg-amber-50/70 border-amber-100' 
                            : 'bg-emerald-50/70 border-emerald-100'
                      }`}
                           title="Overall score reflecting the quality of your cover letter">
                        <span className="text-xl font-bold">{Math.round(analysisResult.overallScore)}</span>
                        <span className="text-xs text-neutral-500">Overall</span>
                        <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                          {Math.round(analysisResult.overallScore) < 60 
                            ? 'Needs Work' 
                            : Math.round(analysisResult.overallScore) < 80 
                              ? 'Good'
                              : 'Excellent'}
                        </span>
                      </div>

                      <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                        Math.round(analysisResult.alignment) < 60 
                          ? 'bg-red-50/70 border-red-100' 
                          : Math.round(analysisResult.alignment) < 80 
                            ? 'bg-amber-50/70 border-amber-100' 
                            : 'bg-emerald-50/70 border-emerald-100'
                      }`}
                           title="How well your letter aligns with the job requirements">
                        <span className="text-xl font-bold">{Math.round(analysisResult.alignment)}</span>
                        <span className="text-xs text-neutral-500">Alignment</span>
                        <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                          {Math.round(analysisResult.alignment) < 60 
                            ? 'Misaligned' 
                            : Math.round(analysisResult.alignment) < 80 
                              ? 'Aligned'
                              : 'Perfect Match'}
                        </span>
                      </div>

                      <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                        Math.round(analysisResult.persuasiveness) < 60 
                          ? 'bg-red-50/70 border-red-100' 
                          : Math.round(analysisResult.persuasiveness) < 80 
                            ? 'bg-amber-50/70 border-amber-100' 
                            : 'bg-emerald-50/70 border-emerald-100'
                      }`}
                           title="How persuasive and compelling your letter is">
                        <span className="text-xl font-bold">{Math.round(analysisResult.persuasiveness)}</span>
                        <span className="text-xs text-neutral-500">Persuasive</span>
                        <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                          {Math.round(analysisResult.persuasiveness) < 60 
                            ? 'Basic' 
                            : Math.round(analysisResult.persuasiveness) < 80 
                              ? 'Convincing'
                              : 'Compelling'}
                        </span>
                      </div>

                      <div className={`flex flex-col items-center p-3 rounded-lg border score-box ${
                        Math.round(analysisResult.clarity) < 60 
                          ? 'bg-red-50/70 border-red-100' 
                          : Math.round(analysisResult.clarity) < 80 
                            ? 'bg-amber-50/70 border-amber-100' 
                            : 'bg-emerald-50/70 border-emerald-100'
                      }`}
                           title="Clarity and readability of your writing">
                        <span className="text-xl font-bold">{Math.round(analysisResult.clarity)}</span>
                        <span className="text-xs text-neutral-500">Clarity</span>
                        <span className="text-xs mt-1 font-medium text-center px-2 py-0.5 rounded-full text-neutral-700 bg-white/70">
                          {Math.round(analysisResult.clarity) < 60 
                            ? 'Unclear' 
                            : Math.round(analysisResult.clarity) < 80 
                              ? 'Clear'
                              : 'Crystal Clear'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <span className="text-emerald-500 mr-1">✓</span> Strengths
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm bg-emerald-50/50 p-2 rounded-md border border-emerald-100/50" id="strengthsList">
                        {analysisResult.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-neutral-700">{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <span className="text-amber-500 mr-1">⚠️</span> Areas to Improve
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm bg-amber-50/50 p-2 rounded-md border border-amber-100/50" id="areasToImproveList">
                        {analysisResult.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-neutral-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <span className="text-blue-500 mr-1">💡</span> Suggestions
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm bg-blue-50/50 p-2 rounded-md border border-blue-100/50" id="suggestionsList">
                        {analysisResult.improvementSuggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-neutral-700">{suggestion}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3" id="optimizedCoverLetterSection">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium flex items-center">
                          <span className="text-primary mr-1">📝</span> Optimized Cover Letter
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs" 
                          onClick={() => {
                            const optimizedSection = document.getElementById('optimizedCoverLetterContent');
                            const toggleButton = document.getElementById('toggleOptimizedBtn');
                            if (optimizedSection && toggleButton) {
                              if (optimizedSection.classList.contains('hidden')) {
                                optimizedSection.classList.remove('hidden');
                                toggleButton.textContent = 'Hide';
                              } else {
                                optimizedSection.classList.add('hidden');
                                toggleButton.textContent = 'Show';
                              }
                            }
                          }}
                          id="toggleOptimizedBtn"
                        >
                          Hide
                        </Button>
                      </div>
                      <div className="p-3 bg-white/60 rounded-md border border-primary/20 text-sm whitespace-pre-wrap" id="optimizedCoverLetterContent">
                        {analysisResult.optimizedCoverLetter}
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button 
                          size="sm" 
                          onClick={handleSaveOptimizedCoverLetter}
                          title="Save this optimized version as a new cover letter"
                        >
                          <UploadCloud className="mr-2 h-3 w-3" />
                          Save Optimized Version
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : analyzeCoverLetterMutation.isPending ? (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-primary/90 flex items-center analysis-header" id="analysisHeader">
                      <BarChart4 className="h-5 w-5 mr-2" />
                      AI Analysis Results
                    </h3>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 mb-6 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                    
                    <p className="text-neutral-600 text-lg mb-2">
                      Analyzing your cover letter...
                    </p>
                    
                    <p className="text-neutral-500 mb-6">
                      This will take just a few seconds.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center analysis-header" id="analysisHeader">
                    <BarChart4 className="h-5 w-5 mr-2" />
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
                      Submit your cover letter and job description
                    </p>
                    
                    <p className="text-neutral-500 mb-6">
                      to see AI-powered analysis and suggestions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Cover letter creation/edit dialog */}
      <Dialog open={isAddLetterOpen} onOpenChange={setIsAddLetterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLetter ? 'Edit Cover Letter' : 'Create New Cover Letter'}
            </DialogTitle>
          </DialogHeader>
          <CoverLetterForm
            letter={selectedLetter}
            onClose={() => setIsAddLetterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      {previewLetter && (
        <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{previewLetter.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDownloadPDF(`previewLetter-${previewLetter.id}`)}
                  title="Download as PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div 
              className="space-y-6 p-4 bg-white" 
              id={`previewLetter-${previewLetter.id}`}
            >
              {/* Header with contact info */}
              <div className="text-center">
                <h2 className="text-xl font-bold">{previewLetter.content.header.fullName || '[Your Name]'}</h2>
                <div className="text-sm space-x-2 text-neutral-600 mt-1 flex justify-center flex-wrap">
                  {previewLetter.content.header.email && <span>{previewLetter.content.header.email}</span>}
                  {previewLetter.content.header.phone && <><span>|</span><span>{previewLetter.content.header.phone}</span></>}
                  {previewLetter.content.header.location && <><span>|</span><span>{previewLetter.content.header.location}</span></>}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {previewLetter.content.header.date || new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-1">
                {previewLetter.content.recipient.name && <p>{previewLetter.content.recipient.name}</p>}
                {previewLetter.content.recipient.position && <p>{previewLetter.content.recipient.position}</p>}
                {previewLetter.content.recipient.company && <p>{previewLetter.content.recipient.company}</p>}
                {previewLetter.content.recipient.address && <p>{previewLetter.content.recipient.address}</p>}
              </div>

              {/* Greeting */}
              <p>Dear {previewLetter.content.recipient.name || 'Hiring Manager'},</p>

              {/* Body content */}
              <div className="whitespace-pre-wrap">
                {previewLetter.content.body}
              </div>

              {/* Closing */}
              <div className="space-y-4">
                <p>{previewLetter.content.closing || 'Sincerely,'}</p>
                <p>{previewLetter.content.header.fullName || '[Your Name]'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}