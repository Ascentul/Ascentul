import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Copy, CheckCircle2, Lightbulb, FileText, MessageSquareText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

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
  jobDescription = '',
}: ApplicationAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistanceData, setAssistanceData] = useState<AIAssistanceResponse | null>(null);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  // Reset state when props change
  useEffect(() => {
    if (isOpen) {
      setAssistanceData(null);
      setError(null);
      setCopiedItems({});
      
      // Only auto-generate if we have at least job title and company
      if (jobTitle && companyName && jobDescription) {
        generateSuggestions();
      }
    }
  }, [isOpen, jobTitle, companyName, jobDescription]);

  const generateSuggestions = async () => {
    if (!jobTitle || !companyName || !jobDescription) {
      setError('Job information is incomplete. Please provide the job title, company, and description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('/api/jobs/ai-assist', {
        method: 'POST',
        data: {
          jobTitle,
          companyName,
          jobDescription,
        },
      });

      setAssistanceData(response);
    } catch (err) {
      console.error('Error generating application suggestions:', err);
      setError('Failed to generate application suggestions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedItems({ ...copiedItems, [id]: true });
        setTimeout(() => {
          setCopiedItems((prevState) => ({ ...prevState, [id]: false }));
        }, 2000);
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      }
    );
  };

  // Mock data for when the real API response isn't available
  const mockAssistanceData: AIAssistanceResponse = {
    suggestions: {
      resumeBulletPoints: [
        "Developed and implemented responsive web applications using React, TypeScript, and Node.js",
        "Led a team of 5 developers in delivering features on-time with 98% test coverage",
        "Reduced API response time by 40% through optimizing database queries and implementing caching",
        "Collaborated with UI/UX designers to implement design systems that improved user engagement by 25%",
        "Implemented CI/CD pipelines that reduced deployment time from hours to minutes"
      ],
      shortResponses: [
        {
          question: "What interests you about working at our company?",
          response: "I'm particularly drawn to your company's innovative approach to solving [specific problem]. Your commitment to [company value] aligns perfectly with my professional values, and I'm excited about the opportunity to contribute to projects like [specific project/product]. Additionally, I admire how your team has [recent company achievement]."
        },
        {
          question: "Describe a challenging project you worked on",
          response: "I led the migration of a legacy system to a modern microservices architecture while ensuring zero downtime. The challenge involved coordinating with multiple teams, creating a phased approach, and implementing comprehensive testing. Despite initial resistance and technical hurdles, we completed the migration ahead of schedule, resulting in a 35% improvement in system performance and significantly enhanced maintainability."
        },
        {
          question: "How do you handle tight deadlines?",
          response: "When facing tight deadlines, I first assess the scope and break it down into manageable tasks with clear priorities. I focus on delivering the most critical functionality first using an MVP approach. I maintain open communication with stakeholders about progress and potential obstacles, and I'm not afraid to ask for additional resources when necessary. For example, on a recent project, this approach allowed us to deliver key features on time while negotiating a short extension for less critical components."
        }
      ],
      coverLetterSnippets: [
        {
          title: "Introduction",
          content: "I am writing to express my interest in the [Job Title] position at [Company Name]. With [X] years of experience in [relevant field], I have developed a strong foundation in [key skills], and I am excited about the opportunity to bring my expertise to your team where innovation and quality are clearly valued."
        },
        {
          title: "Experience Highlight",
          content: "In my current role at [Current/Previous Company], I have successfully [key achievement with metrics]. This experience has strengthened my skills in [relevant skills], which I believe would be valuable for [specific responsibility or challenge mentioned in job description]."
        },
        {
          title: "Conclusion",
          content: "I am particularly drawn to [Company Name] because of your commitment to [company value or initiative]. I am excited about the possibility of contributing to your team and helping to [achieve specific goal]. Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills align with your needs."
        }
      ]
    }
  };

  // Use mock data if real data is not available and we're not loading
  const displayData = assistanceData || (!loading && mockAssistanceData);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Application Assistant
          </DialogTitle>
          <DialogDescription>
            Get personalized suggestions to improve your job application
          </DialogDescription>
        </DialogHeader>

        {!jobTitle || !companyName || !jobDescription ? (
          <div className="p-6">
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Incomplete Job Information</AlertTitle>
              <AlertDescription>
                Please provide job details to get personalized application suggestions. You need to have:
                <ul className="list-disc ml-6 mt-2">
                  <li>Job title</li>
                  <li>Company name</li>
                  <li>Job description</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Analyzing job details and generating personalized suggestions...
            </p>
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={generateSuggestions}>Try Again</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-1">
            <Tabs defaultValue="resume" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="resume" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Resume Points
                </TabsTrigger>
                <TabsTrigger value="responses" className="flex items-center gap-1">
                  <MessageSquareText className="h-4 w-4" />
                  Response Templates
                </TabsTrigger>
                <TabsTrigger value="cover" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Cover Letter
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resume" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Bullet Points</CardTitle>
                    <CardDescription>
                      Tailored bullet points to highlight your relevant skills for this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {displayData?.suggestions.resumeBulletPoints.map((point, index) => (
                        <li key={`resume-${index}`} className="flex justify-between border p-3 rounded-md">
                          <span className="flex-1">{point}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyText(point, `resume-${index}`)}
                          >
                            {copiedItems[`resume-${index}`] ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="responses" className="space-y-4">
                {displayData?.suggestions.shortResponses.map((item, index) => (
                  <Card key={`response-${index}`}>
                    <CardHeader>
                      <CardTitle>{item.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{item.response}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyText(item.response, `response-${index}`)}
                        className="flex items-center gap-1"
                      >
                        {copiedItems[`response-${index}`] ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Response
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="cover" className="space-y-4">
                {displayData?.suggestions.coverLetterSnippets.map((snippet, index) => (
                  <Card key={`cover-${index}`}>
                    <CardHeader>
                      <CardTitle>{snippet.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{snippet.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyText(snippet.content, `cover-${index}`)}
                        className="flex items-center gap-1"
                      >
                        {copiedItems[`cover-${index}`] ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Snippet
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <CardFooter className="flex justify-between border-t pt-4 mt-auto">
          <p className="text-xs text-muted-foreground">
            💡 Suggestions are AI-generated and should be customized to your experience
          </p>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}