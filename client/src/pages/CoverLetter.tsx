import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Mail, Download, Copy, Trash2, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

export default function CoverLetter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [previewLetter, setPreviewLetter] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's cover letters
  const { data: coverLetters, isLoading } = useQuery({
    queryKey: ['/api/cover-letters'],
  });

  // AI generation form fields
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userExperience, setUserExperience] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

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
    onError: (error) => {
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to duplicate cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const generateCoverLetterMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = userSkills.split(',').map(skill => skill.trim());
      const res = await apiRequest('POST', '/api/cover-letters/generate', {
        jobTitle,
        companyName,
        jobDescription,
        userExperience,
        userSkills: skillsArray,
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate cover letter: ${error.message}`,
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
        setUserExperience('');
        setUserSkills('');
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
        (letter) => letter.name.toLowerCase().includes(query)
      );
    }
    
    return coverLetters;
  };

  const generateCoverLetter = () => {
    if (!jobTitle || !companyName || !jobDescription || !userExperience || !userSkills) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields to generate a cover letter',
        variant: 'destructive',
      });
      return;
    }
    
    generateCoverLetterMutation.mutate();
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
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
      </div>
      
      <Tabs defaultValue="letters">
        <TabsList className="mb-4">
          <TabsTrigger value="letters">My Cover Letters</TabsTrigger>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLetters().map((letter) => (
                <Card key={letter.id} className="overflow-hidden">
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
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
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
        
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Generate a Cover Letter with AI</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Title</label>
                      <Input
                        placeholder="e.g., Software Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Name</label>
                      <Input
                        placeholder="e.g., Acme Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Relevant Experience</label>
                    <Textarea
                      placeholder="Briefly describe your relevant experience for this position..."
                      value={userExperience}
                      onChange={(e) => setUserExperience(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Skills (comma separated)</label>
                    <Input
                      placeholder="e.g., JavaScript, React, Project Management"
                      value={userSkills}
                      onChange={(e) => setUserSkills(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={generateCoverLetter}
                    disabled={generateCoverLetterMutation.isPending}
                  >
                    {generateCoverLetterMutation.isPending ? 'Generating...' : 'Generate Cover Letter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Generated Cover Letter</h3>
                  {generatedContent && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSaveGenerated}
                    >
                      Save to Library
                    </Button>
                  )}
                </div>
                
                {generatedContent ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {generatedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                    <p className="text-neutral-500">
                      Fill out the form and generate a professional cover letter
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Cover Letter Dialog */}
      <Dialog open={isAddLetterOpen} onOpenChange={setIsAddLetterOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLetter ? 'Edit Cover Letter' : 'Create New Cover Letter'}</DialogTitle>
          </DialogHeader>
          <CoverLetterForm 
            coverLetter={selectedLetter} 
            onSuccess={() => setIsAddLetterOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Cover Letter Preview Dialog */}
      <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cover Letter Preview: {previewLetter?.name}</DialogTitle>
          </DialogHeader>
          {previewLetter && (
            <div className="bg-white p-6 border rounded-md">
              {/* Header with contact info */}
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {previewLetter.content.header.fullName}
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
                <p>{previewLetter.content.header.date}</p>
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
                <p className="mt-6">{previewLetter.content.header.fullName}</p>
              </div>
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
    </div>
  );
}
