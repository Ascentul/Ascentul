import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Alert, 
  AlertCircle, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  BarChart,
  LucideCheck,
  AlertCircle as AlertCircleIcon,
  XCircle,
} from 'lucide-react';

const resumeAnalysisSchema = z.object({
  resumeText: z.string().min(50, {
    message: 'Resume text must be at least 50 characters',
  }),
  jobDescription: z.string().min(50, {
    message: 'Job description must be at least 50 characters',
  }),
});

interface ResumeAnalysisResult {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvementSuggestions: string[];
  technicalSkillAssessment: string[];
  softSkillAssessment: string[];
  formattingFeedback: string[];
  keywordMatchScore: number;
  relevanceScore: number;
}

interface ResumeAnalyzerProps {
  onAnalysisComplete?: (result: ResumeAnalysisResult, resumeText: string, jobDescription: string) => void;
}

export default function ResumeAnalyzer({ onAnalysisComplete }: ResumeAnalyzerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);

  const form = useForm<z.infer<typeof resumeAnalysisSchema>>({
    resolver: zodResolver(resumeAnalysisSchema),
    defaultValues: {
      resumeText: '',
      jobDescription: '',
    },
  });

  // Mutation for analyzing resume
  const analyzeResumeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof resumeAnalysisSchema>) => {
      const response = await apiRequest<ResumeAnalysisResult>({
        url: '/api/resumes/analyze', 
        method: 'POST',
        data: values
      });
      return response;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setActiveTab('results');
      toast({
        title: 'Analysis Complete',
        description: 'Your resume has been analyzed against the job description.',
      });
      
      // Call the callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(data, form.getValues('resumeText'), form.getValues('jobDescription'));
      }
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze resume',
        variant: 'destructive',
      });
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadedFile(file);
    setFileUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target) {
          const fileDataUrl = event.target.result as string;

          // Upload the file to the server
          const uploadResponse = await apiRequest<{ success: boolean; url?: string }>({
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
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      setFileUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof resumeAnalysisSchema>) => {
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="upload">Upload Resume</TabsTrigger>
          <TabsTrigger value="extract">Extract Text</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="results" disabled={!analysis}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>
                Upload your resume in PDF or Word format to analyze it against a job description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                  >
                    <span>Upload a file</span>
                    <Input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={fileUploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PDF or Word up to 10MB</p>
              </div>

              {fileUploading && (
                <div className="flex flex-col items-center justify-center mt-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-gray-500">Uploading file...</p>
                </div>
              )}

              {uploadedFile && !fileUploading && (
                <div className="flex items-center space-x-2 bg-primary/10 p-4 rounded-md">
                  <FileText className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round(uploadedFile.size / 1024)} KB
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="button" 
                className="ml-auto"
                disabled={!uploadedFile || fileUploading}
                onClick={() => setActiveTab("extract")}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="extract" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Extract and Edit Resume Text</CardTitle>
              <CardDescription>
                Review or edit the extracted text before analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Resume Text Extraction</AlertTitle>
                <AlertDescription>
                  In a production environment, we would automatically extract text from your resume.
                  For now, please review, edit, or paste your resume content below.
                </AlertDescription>
              </Alert>
              
              <Textarea 
                placeholder="Paste or edit your resume text here..." 
                className="min-h-[300px]"
                value={resumeContent || extractedText}
                onChange={(e) => setResumeContent(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setActiveTab("upload")}
              >
                Back
              </Button>
              <Button 
                type="button"
                onClick={handleAnalyzeExtracted}
                disabled={!resumeContent && !extractedText}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Your Resume</CardTitle>
              <CardDescription>
                Enter a job description to analyze your resume against it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="resumeText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resume Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste your resume text here..." 
                            className="min-h-[200px]"
                            {...field}
                            defaultValue={resumeContent || field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the job description here..." 
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setActiveTab("extract")}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={analyzeResumeMutation.isPending}
                    >
                      {analyzeResumeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze Resume
                          <BarChart className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {analysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Analysis Results</CardTitle>
                  <CardDescription>
                    Here's how your resume compares to the job description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Overall Match</p>
                      <p className="text-sm font-medium">{analysis.overallScore}%</p>
                    </div>
                    <Progress value={analysis.overallScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Keyword Match</p>
                      <p className="text-sm font-medium">{analysis.keywordMatchScore}%</p>
                    </div>
                    <Progress value={analysis.keywordMatchScore} className="h-2" />
                  </div>

                  {/* Strengths */}
                  <div>
                    <h3 className="text-base font-medium mb-2">Strengths</h3>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <LucideCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h3 className="text-base font-medium mb-2">Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium mb-2">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((keyword, index) => (
                          <span key={index} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Suggestions */}
                  <div>
                    <h3 className="text-base font-medium mb-2">Improvement Suggestions</h3>
                    <ul className="space-y-1">
                      {analysis.improvementSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}