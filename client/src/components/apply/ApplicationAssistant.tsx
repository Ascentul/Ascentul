import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Sparkles, FileText, FlaskConical, ListChecks, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ApplicationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
}

interface AIAssistanceResponse {
  suggestions: {
    resumeBulletPoints: string[];
    shortResponses: {
      question: string;
      response: string;
    }[];
    coverLetterSnippets: {
      title: string;
      content: string;
    }[];
  };
}

export function ApplicationAssistant({
  isOpen,
  onClose,
  jobTitle = '',
  companyName = '',
  jobDescription = ''
}: ApplicationAssistantProps) {
  const [activeTab, setActiveTab] = useState('bullet-points');
  const [copiedIndices, setCopiedIndices] = useState<Record<string, number[]>>({
    'bullet-points': [],
    'responses': [],
    'cover-letter': []
  });
  const { toast } = useToast();

  // Mutation to get AI suggestions
  const { 
    mutate: getAISuggestions, 
    data: assistanceData,
    isPending
  } = useMutation<AIAssistanceResponse>({
    mutationFn: async () => {
      const response = await apiRequest<AIAssistanceResponse>({
        url: '/api/jobs/ai-assist',
        method: 'POST',
        data: {
          jobTitle,
          companyName,
          jobDescription
        }
      });
      return response;
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions. Please try again.',
        variant: 'destructive'
      });
      console.error('Error getting AI suggestions:', error);
    }
  });

  // Handle copy to clipboard
  const handleCopy = (text: string, section: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndices(prev => ({
        ...prev,
        [section]: [...prev[section], index]
      }));
      
      toast({
        title: 'Copied to clipboard',
        description: 'You can now paste this into your application.'
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setCopiedIndices(prev => ({
          ...prev,
          [section]: prev[section].filter(i => i !== index)
        }));
      }, 2000);
    });
  };

  // Mock data for development and preview
  const mockAssistanceData: AIAssistanceResponse = {
    suggestions: {
      resumeBulletPoints: [
        "Developed high-performance web applications using React, TypeScript and Node.js, resulting in 35% faster load times",
        "Implemented responsive UI designs with Tailwind CSS, ensuring consistent user experience across all devices",
        "Collaborated with cross-functional teams to deliver features that increased customer engagement by 28%",
        "Optimized database queries using PostgreSQL, reducing average query time from 1.2s to 0.3s",
        "Implemented comprehensive test coverage with Jest and React Testing Library, achieving 92% code coverage"
      ],
      shortResponses: [
        {
          question: "Why are you interested in this position?",
          response: "I'm passionate about developing innovative software solutions that address real user needs. This role at [Company] aligns perfectly with my expertise in front-end development and my desire to work on products that make a meaningful impact."
        },
        {
          question: "What relevant experience do you have?",
          response: "I've spent 3+ years building web applications using React, TypeScript, and Node.js in agile environments. My experience includes optimizing performance, implementing responsive designs, and collaborating with diverse teams to deliver user-centric features."
        },
        {
          question: "Why do you want to work at our company?",
          response: "I admire [Company]'s commitment to innovation and user-focused product development. Your recent work on [specific project/product] particularly impressed me, and I'm excited about contributing to a team that prioritizes both technical excellence and positive user experiences."
        }
      ],
      coverLetterSnippets: [
        {
          title: "Introduction",
          content: "As a passionate software developer with extensive experience in modern web technologies, I was excited to discover the [Job Title] position at [Company]. With my background in building responsive and performant web applications, I am confident in my ability to make significant contributions to your team."
        },
        {
          title: "Highlighting Relevant Experience",
          content: "During my time at [Previous Company], I led the development of a customer-facing application that increased user engagement by 40%. I implemented state-of-the-art front-end architecture using React and TypeScript, while ensuring code quality through comprehensive testing strategies."
        },
        {
          title: "Closing Paragraph",
          content: "I am particularly drawn to [Company]'s mission to [company mission/goal] and would be thrilled to apply my technical skills and passion for innovation to help achieve these objectives. I welcome the opportunity to discuss how my experience and enthusiasm would make me a valuable addition to your team."
        }
      ]
    }
  };

  // For now, we'll use the mock data in place of the actual API call
  // In the future, we'll replace this with the actual API response
  const suggestions = assistanceData?.suggestions || mockAssistanceData.suggestions;

  const renderLoading = () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Application Assistant
          </SheetTitle>
          <SheetDescription>
            AI-powered suggestions to help with your job application
            {(jobTitle || companyName) && (
              <div className="mt-1">
                {jobTitle && <Badge variant="outline" className="mr-2">{jobTitle}</Badge>}
                {companyName && <Badge variant="outline">{companyName}</Badge>}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        {!assistanceData && !isPending && (
          <div className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Sparkles className="h-12 w-12 mx-auto text-primary/50" />
                  <div>
                    <h3 className="font-medium text-lg">Get Application Assistance</h3>
                    <p className="text-muted-foreground text-sm">
                      Let our AI analyze the job and provide tailored suggestions for your application
                    </p>
                  </div>
                  <Button onClick={() => getAISuggestions()}>
                    Generate Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bullet-points" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="bullet-points" className="flex items-center">
              <ListChecks className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Resume Points</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Responses</span>
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Cover Letter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bullet-points">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Suggested bullet points to include in your resume for this position. Click to copy.
              </div>
              
              {isPending ? (
                renderLoading()
              ) : (
                <>
                  {suggestions.resumeBulletPoints.map((point, index) => (
                    <div 
                      key={index} 
                      className="bg-muted rounded-md p-3 flex justify-between items-start hover:bg-muted/80 cursor-pointer"
                      onClick={() => handleCopy(point, 'bullet-points', index)}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span>{point}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-2 flex-shrink-0">
                        {copiedIndices['bullet-points'].includes(index) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="responses">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Suggested responses to common questions. Customize and use in your application.
              </div>
              
              {isPending ? (
                renderLoading()
              ) : (
                <>
                  {suggestions.shortResponses.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-4 pb-3 bg-muted/50">
                        <CardTitle className="text-base">{item.question}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm">{item.response}</p>
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(item.response, 'responses', index)}
                          >
                            {copiedIndices['responses'].includes(index) ? (
                              <>
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cover-letter">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Suggested snippets for your cover letter. Customize and combine as needed.
              </div>
              
              {isPending ? (
                renderLoading()
              ) : (
                <>
                  {suggestions.coverLetterSnippets.map((snippet, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-4 pb-3 bg-muted/50">
                        <CardTitle className="text-base">{snippet.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm">{snippet.content}</p>
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleCopy(snippet.content, 'cover-letter', index)}
                          >
                            {copiedIndices['cover-letter'].includes(index) ? (
                              <>
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>Note: These suggestions are AI-generated and should be customized to match your experience and the specific job requirements.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}