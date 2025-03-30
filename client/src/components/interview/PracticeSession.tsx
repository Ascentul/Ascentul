import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  MessageSquare, 
  Mic, 
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type InterviewProcess } from '@shared/schema';

type PracticeSessionProps = {
  process?: InterviewProcess;
  isOpen: boolean;
  onClose: () => void;
};

export const PracticeSession = ({ process, isOpen, onClose }: PracticeSessionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [feedback, setFeedback] = useState<{[key: number]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionGenerationStatus, setQuestionGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Generate/fetch questions based on the job position
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/interview/questions', process?.id],
    queryFn: async () => {
      if (!process) {
        // Fetch general interview questions if no process is provided
        const res = await apiRequest('GET', '/api/interview/questions');
        return res.json();
      } else {
        // Generate specific questions based on job description
        setQuestionGenerationStatus('loading');
        try {
          const res = await apiRequest('POST', '/api/interview/generate-questions', {
            jobTitle: process.position,
            skills: extractSkills(process.jobDescription || '')
          });
          setQuestionGenerationStatus('success');
          return res.json();
        } catch (error) {
          setQuestionGenerationStatus('error');
          throw error;
        }
      }
    },
    enabled: isOpen, // Only run this query when the dialog is open
  });

  // Function to extract skills from job description - in real app, this would be more sophisticated
  const extractSkills = (jobDescription: string): string[] => {
    // Simple implementation - in a real app, this would use AI or a predefined list of skills
    const commonSkills = ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Communication', 'Leadership'];
    return commonSkills.filter(skill => 
      jobDescription.toLowerCase().includes(skill.toLowerCase())
    );
  };

  // Save practice session
  const savePracticeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/interview/practice', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview/practice-history'] });
      toast({
        title: 'Success',
        description: 'Practice session saved successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save practice session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const handleNextQuestion = () => {
    if (currentQuestion < (questions?.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion]: e.target.value
    });
  };

  const handleGetFeedback = async () => {
    if (!userAnswers[currentQuestion]) return;
    
    setIsSubmitting(true);
    try {
      // In a real app, we would send the answer to an API for feedback
      // Here we're simulating this with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would typically come from the API
      const feedbackText = "Your answer demonstrates good understanding of the topic. Consider providing more specific examples from your experience to make your response more compelling.";
      
      setFeedback({
        ...feedback,
        [currentQuestion]: feedbackText
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishPractice = () => {
    // Save the practice session
    savePracticeMutation.mutate({
      processId: process?.id,
      questions: questions?.map((q: any, index: number) => ({
        question: q.question,
        answer: userAnswers[index] || '',
        feedback: feedback[index] || ''
      })),
      sessionDate: new Date().toISOString()
    });
  };

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (!isOpen) {
      setCurrentQuestion(0);
      setUserAnswers({});
      setFeedback({});
    }
  }, [isOpen]);

  const renderContent = () => {
    if (isLoading || questionGenerationStatus === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {process 
              ? `Generating personalized questions for ${process.position} at ${process.companyName}...` 
              : 'Loading interview questions...'}
          </p>
        </div>
      );
    }

    if (questionGenerationStatus === 'error' || !questions || questions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            Failed to load interview questions. Please try again.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
            {process && (
              <Badge className="bg-primary">{process.position}</Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNextQuestion}
              disabled={currentQuestion === questions.length - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          {questions[currentQuestion].description && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {questions[currentQuestion].description}
              </p>
            </CardContent>
          )}
        </Card>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Your Answer
            </h3>
            <Textarea 
              placeholder="Type your answer here..."
              className="min-h-[150px]"
              value={userAnswers[currentQuestion] || ''}
              onChange={handleAnswerChange}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Record Answer
            </Button>
            <Button 
              onClick={handleGetFeedback}
              disabled={!userAnswers[currentQuestion] || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Feedback...
                </>
              ) : (
                'Get AI Feedback'
              )}
            </Button>
          </div>

          {feedback[currentQuestion] && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  AI Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback[currentQuestion]}</p>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Helpful
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Not Helpful
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Interview Practice Session</DialogTitle>
          <DialogDescription>
            {process 
              ? `Practice for your interview at ${process.companyName} for the ${process.position} position.`
              : 'General interview practice with common questions.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderContent()}
        </ScrollArea>
        
        <DialogFooter className="flex justify-between mt-4 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleFinishPractice} disabled={isLoading || Object.keys(userAnswers).length === 0}>
            Finish Practice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};