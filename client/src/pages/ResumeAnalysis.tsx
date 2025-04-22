import React, { useState } from 'react';
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Form schema for resume upload and analysis
const resumeAnalysisSchema = z.object({
  resumeText: z.string().min(100, "Resume text should be at least 100 characters long"),
  jobDescription: z.string().min(50, "Job description should be at least 50 characters long"),
});

// Define the type for the analysis response
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

const ResumeAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [extractedText, setExtractedText] = useState("");

  // Form for manual text input and job description
  const form = useForm<z.infer<typeof resumeAnalysisSchema>>({
    resolver: zodResolver(resumeAnalysisSchema),
    defaultValues: {
      resumeText: "",
      jobDescription: "",
    },
  });

  // Mutation for analyzing resume
  const analyzeResumeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resumeAnalysisSchema>) => {
      const response = await apiRequest('/api/resumes/analyze', {
        method: 'POST',
        data
      });
      return response as ResumeAnalysisResult;
    },
    onSuccess: (data: ResumeAnalysisResult) => {
      setAnalysis(data);
      setActiveTab("results");
      toast({
        title: "Analysis complete",
        description: "Your resume has been analyzed against the job description.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing your resume. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
          const fileDataUrl = event.target.result as string;

          // Upload the file to the server
          const uploadResponse = await apiRequest('/api/resumes/upload', {
            method: 'POST',
            data: { fileDataUrl }
          }) as { success: boolean; url?: string };

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
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Resume Analysis</h1>
      <p className="text-muted-foreground">
        Upload your resume and paste a job description to get AI-powered analysis and improvement suggestions.
      </p>

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
                <AlertCircle className="h-4 w-4" />
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
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Experience Relevance</p>
                      <p className="text-sm font-medium">{analysis.relevanceScore}%</p>
                    </div>
                    <Progress value={analysis.relevanceScore} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Strengths</h3>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Areas for Improvement</h3>
                      <ul className="space-y-2">
                        {analysis.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((keyword, i) => (
                        <span key={i} className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Improvement Suggestions</h3>
                    <ul className="space-y-2">
                      {analysis.improvementSuggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("analyze")}
                    className="mr-2"
                  >
                    Edit and Reanalyze
                  </Button>
                  <Button onClick={() => {
                    // Reset the form and state for a new analysis
                    form.reset();
                    setUploadedFile(null);
                    setResumeContent("");
                    setExtractedText("");
                    setAnalysis(null);
                    setActiveTab("upload");
                  }}>
                    Start New Analysis
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Skills Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.technicalSkillAssessment.map((assessment, i) => (
                        <li key={i} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5" />
                          <span>{assessment}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Soft Skills Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.softSkillAssessment.map((assessment, i) => (
                        <li key={i} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5" />
                          <span>{assessment}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Formatting and Structure Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.formattingFeedback.map((feedback, i) => (
                      <li key={i} className="flex items-start">
                        <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeAnalysis;