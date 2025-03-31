import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, FileText, Download, Copy, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ResumeForm from '@/components/ResumeForm';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Resume() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddResumeOpen, setIsAddResumeOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [previewResume, setPreviewResume] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's resumes
  const { data: resumes = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/resumes'],
    placeholderData: [],
  });

  // Job description for AI suggestions
  const [jobDescription, setJobDescription] = useState('');
  const [userWorkHistory, setUserWorkHistory] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions
  const getSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/resumes/suggestions', {
        jobDescription,
        workHistory: userWorkHistory,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Suggestions Generated',
        description: 'AI-powered suggestions for your resume are ready',
      });
      setShowSuggestions(true);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate suggestions: ${error.message}`,
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
    if (!jobDescription || !userWorkHistory) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both the job description and your work history',
        variant: 'destructive',
      });
      return;
    }
    
    getSuggestionsMutation.mutate();
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
          <h1 className="text-2xl font-bold font-poppins">Resume Builder</h1>
          <p className="text-neutral-500">Create and manage your professional resumes</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => {
            setSelectedResume(null);
            setIsAddResumeOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Resume
        </Button>
      </motion.div>
      
      <Tabs defaultValue="resumes">
        <TabsList className="mb-4">
          <TabsTrigger value="resumes">My Resumes</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>
        
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 will-change-opacity"
              variants={staggeredContainer}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {filteredResumes().map((resume: any) => (
                <motion.div 
                  key={resume.id} 
                  variants={cardAnimation}
                  className="will-change-transform"
                  style={{ transform: 'translateZ(0)' }}>
                  <Card className="overflow-hidden">
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
              className="text-center py-12 bg-white rounded-lg shadow-sm"
              variants={fadeIn}
            >
              <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Resumes Created Yet</h3>
              <p className="text-neutral-500 mb-4">
                Start by creating your first professional resume
              </p>
              <Button
                onClick={() => {
                  setSelectedResume(null);
                  setIsAddResumeOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
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
                <h3 className="text-lg font-semibold mb-4">Get AI-Powered Resume Suggestions</h3>
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
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Work Experience</label>
                    <Textarea
                      placeholder="Provide a brief overview of your relevant work experience..."
                      value={userWorkHistory}
                      onChange={(e) => setUserWorkHistory(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={generateSuggestions}
                    disabled={getSuggestionsMutation.isPending}
                  >
                    {getSuggestionsMutation.isPending ? 'Generating...' : 'Generate Suggestions'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Suggestions</h3>
                
                {showSuggestions && getSuggestionsMutation.data ? (
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
                        {getSuggestionsMutation.data.suggestions.map((suggestion: any, index: number) => (
                          <li key={index} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Keywords to Include</h4>
                      <div className="flex flex-wrap gap-2">
                        {getSuggestionsMutation.data.keywords.map((keyword: any, index: number) => (
                          <span 
                            key={index}
                            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                    <p className="text-neutral-500">
                      Fill out the form and generate suggestions to make your resume stand out
                    </p>
                  </div>
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
      
      {/* Resume Preview Dialog */}
      <Dialog open={!!previewResume} onOpenChange={() => setPreviewResume(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume Preview: {previewResume?.name}</DialogTitle>
          </DialogHeader>
          {previewResume && (
            <div className="bg-white p-6 border rounded-md">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-center">
                  {previewResume.content.personalInfo.fullName || 'Full Name'}
                </h2>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-sm text-neutral-600">
                  {previewResume.content.personalInfo.email && (
                    <span>{previewResume.content.personalInfo.email}</span>
                  )}
                  {previewResume.content.personalInfo.phone && (
                    <span>| {previewResume.content.personalInfo.phone}</span>
                  )}
                  {previewResume.content.personalInfo.location && (
                    <span>| {previewResume.content.personalInfo.location}</span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-1 text-sm text-primary">
                  {previewResume.content.personalInfo.linkedIn && (
                    <a href={previewResume.content.personalInfo.linkedIn} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {previewResume.content.personalInfo.portfolio && (
                    <a href={previewResume.content.personalInfo.portfolio} target="_blank" rel="noopener noreferrer">
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
              
              {previewResume.content.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-2">Professional Summary</h3>
                  <p className="text-sm">{previewResume.content.summary}</p>
                </div>
              )}
              
              {previewResume.content.skills && previewResume.content.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewResume.content.skills.map((skill: any, index: number) => (
                      <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {previewResume.content.experience && previewResume.content.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-3">Experience</h3>
                  <div className="space-y-4">
                    {previewResume.content.experience.map((exp: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h4 className="font-medium">{exp.position}</h4>
                          <div className="text-sm text-neutral-600">
                            {exp.startDate} - {exp.currentJob ? 'Present' : exp.endDate}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary">{exp.company}</div>
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {previewResume.content.education && previewResume.content.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-3">Education</h3>
                  <div className="space-y-4">
                    {previewResume.content.education.map((edu: any, index: number) => (
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
              
              {previewResume.content.projects && previewResume.content.projects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold border-b pb-1 mb-3">Projects</h3>
                  <div className="space-y-4">
                    {previewResume.content.projects.map((project: any, index: number) => (
                      <div key={index}>
                        <h4 className="font-medium">
                          {project.name}
                          {project.url && (
                            <a 
                              href={project.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary ml-2"
                            >
                              (Link)
                            </a>
                          )}
                        </h4>
                        {project.description && <p className="text-sm mt-1">{project.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}