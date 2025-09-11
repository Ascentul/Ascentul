import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  MessageSquare, 
  Mic, 
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
  Trophy,
  Brain,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  Hourglass,
  SkipForward,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type InterviewProcess } from "@/utils/schema";

type GamePracticeSessionProps = {
  process?: InterviewProcess;
  isOpen: boolean;
  onClose: () => void;
};

export const GamePracticeSession = ({ process, isOpen, onClose }: GamePracticeSessionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [feedback, setFeedback] = useState<{[key: number]: string}>({});
  const [analysisData, setAnalysisData] = useState<{[key: number]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionGenerationStatus, setQuestionGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gameState, setGameState] = useState<'intro' | 'question' | 'feedback' | 'summary'>('intro');
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState<{[key: number]: number}>({});
  const [showHint, setShowHint] = useState(false);
  const [feedbackQuality, setFeedbackQuality] = useState<{[key: number]: 'helpful' | 'not-helpful' | null}>({});

  // Generate/fetch questions based on the job position
  const { data: questionsResponse, isLoading } = useQuery({
    queryKey: ['/api/interview/questions', process?.id],
    queryFn: async () => {
      if (!process) {
        // Fetch general interview questions if no process is provided
        const res = await apiRequest('GET', '/api/interview/questions');
        const data = await res.json();
        return {
          behavioral: data.map((q: any) => ({
            question: q.question,
            description: '',
            suggestedAnswer: q.suggestedAnswer || ''
          }))
        };
      } else {
        // Generate specific questions based on job description
        setQuestionGenerationStatus('loading');
        try {
          const res = await apiRequest('POST', '/api/interview/generate-questions', {
            jobTitle: process.position,
            skills: extractSkills(process.jobDescription || '')
          });
          setQuestionGenerationStatus('success');
          return await res.json();
        } catch (error) {
          setQuestionGenerationStatus('error');
          throw error;
        }
      }
    },
    enabled: isOpen, // Only run this query when the dialog is open
  });
  
  // Process the questions into a flat array for the UI
  const questions = questionsResponse ? [
    ...(questionsResponse.behavioral || []),
    ...(questionsResponse.technical || [])
  ] : [];

  // Function to extract skills from job description
  const extractSkills = (jobDescription: string): string[] => {
    // Simple implementation - in a real app, this could use AI or a predefined list of skills
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
        title: 'Practice Completed!',
        description: 'Your interview practice session has been saved successfully',
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

  // Define the handleGetFeedback function before using it in the useEffect
  
  // Handle timer for questions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      setTimerActive(false);
      
      // If time runs out, go to feedback if we have an answer
      if (userAnswers[currentQuestion]) {
        setGameState('feedback');
        
        // Generate simple feedback for timeout
        setFeedback({
          ...feedback,
          [currentQuestion]: "Time expired! It's important to practice answering questions concisely within the allocated time. Try to structure your answers more efficiently next time."
        });
      } else {
        // Skip to next question if no answer provided
        if (currentQuestion < (questions?.length || 0) - 1) {
          setCurrentQuestion(prev => prev + 1);
          setGameState('intro');
        } else {
          setGameState('summary');
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, currentQuestion, questions, userAnswers, feedback]);

  // Define the feedback function first so it can be referenced by other functions
  const handleGetFeedback = async () => {
    if (!questions || questions.length === 0) return;
    if (currentQuestion >= questions.length) return;
    
    setTimerActive(false);
    setIsSubmitting(true);
    setGameState('feedback');
    
    try {
      // Call our API to get AI feedback on the answer
      const response = await apiRequest('POST', '/api/interview/analyze-answer', {
        question: questions[currentQuestion].question,
        answer: userAnswers[currentQuestion] || '',
        jobTitle: process?.position,
        companyName: process?.companyName
      });
      
      const analysis = await response.json();
      
      // Store the complete analysis data
      setAnalysisData({
        ...analysisData,
        [currentQuestion]: analysis
      });
      
      // Update the confidence level based on the analysis
      const newConfidenceLevel = Math.ceil((analysis.clarity + analysis.relevance + analysis.overall) / 3);
      
      setConfidenceLevel({
        ...confidenceLevel,
        [currentQuestion]: newConfidenceLevel,
        // Give a small boost for the next question if performed well
        [currentQuestion + 1]: Math.min(5, newConfidenceLevel + (analysis.overall > 3 ? 1 : 0))
      });
      
      // Update score based on the overall rating
      const answerScore = analysis.overall * 20; // Convert 1-5 rating to a score out of 100
      setScore(prevScore => prevScore + answerScore);
      
      // Store the feedback
      setFeedback({
        ...feedback,
        [currentQuestion]: analysis.feedback
      });
      
    } catch (error) {
      console.error("Error getting feedback:", error);
      
      // Fallback in case of API failure
      let feedbackText;
      
      if (userAnswers[currentQuestion] && userAnswers[currentQuestion].length > 50) {
        feedbackText = "Your answer is detailed and shows good preparation. You've addressed the key points effectively. To elevate your response, consider structuring it using the STAR method (Situation, Task, Action, Result) for maximum impact.";
      } else if (userAnswers[currentQuestion] && userAnswers[currentQuestion].length > 0) {
        feedbackText = "Your answer provides basic information but could benefit from more depth. Consider expanding with specific examples and achievements. Quantify your impact whenever possible.";
      } else {
        feedbackText = "You didn't provide an answer. Remember, even if you're not perfectly prepared, attempting to answer helps you practice thinking on your feet.";
      }
      
      setFeedback({
        ...feedback,
        [currentQuestion]: feedbackText
      });
      
      // Calculate default confidence level
      const currentConfidence = confidenceLevel[currentQuestion] || 3;
      setConfidenceLevel({
        ...confidenceLevel,
        [currentQuestion + 1]: Math.min(5, currentConfidence + 1) // Max confidence level is 5
      });
      
      toast({
        title: 'Error',
        description: 'Failed to get AI feedback. Using simpler analysis instead.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Play sound effect
  const playSound = (type: 'success' | 'error' | 'next' | 'complete') => {
    if (!soundEnabled) return;
    
    // In a real implementation, we would play actual sound effects here

  };

  const startQuestion = () => {
    if (!questions || questions.length === 0) return;
    if (currentQuestion >= questions.length) return;
    
    setGameState('question');
    setTimerActive(true);
    setTimeRemaining(120); // Reset timer for each question
    setShowHint(false);
    playSound('next');
  };

  const handleNextQuestion = () => {
    if (!questions || questions.length === 0) return;
    
    if (currentQuestion < questions.length - 1) {
      // Calculate score based on answer quality and time spent
      if (feedback[currentQuestion]) {
        const baseScore = 100;
        const timeBonus = Math.max(0, Math.floor(timeRemaining / 10)); // More time left = higher bonus
        const confidenceBonus = (confidenceLevel[currentQuestion] || 3) * 5; // Confidence provides a bonus
        
        const questionScore = baseScore + timeBonus + confidenceBonus;
        setScore(prevScore => prevScore + questionScore);
        
        playSound('success');
      }
      
      setCurrentQuestion(prev => prev + 1);
      setTimerActive(false);
      setGameState('intro');
    } else {
      // End of practice session
      setGameState('summary');
      playSound('complete');
    }
  };

  const handleSkipQuestion = () => {
    // Penalize score for skipping
    setScore(prevScore => Math.max(0, prevScore - 50));
    
    if (currentQuestion < (questions?.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimerActive(false);
      setGameState('intro');
    } else {
      // End of practice session
      setGameState('summary');
    }
    
    playSound('next');
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion]: e.target.value
    });
  };

  const handleRateFeedback = (isHelpful: boolean) => {
    setFeedbackQuality({
      ...feedbackQuality,
      [currentQuestion]: isHelpful ? 'helpful' : 'not-helpful'
    });
    
    // Adjust score based on feedback rating
    if (isHelpful) {
      setScore(prevScore => prevScore + 10);
    }
    
    playSound(isHelpful ? 'success' : 'error');
  };

  const handleFinishPractice = () => {
    // Save the practice session
    savePracticeMutation.mutate({
      processId: process?.id,
      questions: questions?.map((q: any, index: number) => ({
        question: q.question,
        answer: userAnswers[index] || '',
        feedback: feedback[index] || '',
        confidence: confidenceLevel[index] || 3
      })),
      sessionDate: new Date().toISOString(),
      score: score
    });
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestion(0);
      setUserAnswers({});
      setFeedback({});
      setAnalysisData({});
      setGameState('intro');
      setTimerActive(false);
      setTimeRemaining(120);
      setScore(0);
      setConfidenceLevel({});
      setFeedbackQuality({});
    }
  }, [isOpen]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const calculateProgress = (): number => {
    if (!questions || questions.length === 0) return 0;
    return ((currentQuestion + 1) / questions.length) * 100;
  };

  const renderIntroScreen = () => {
    if (!questions || questions.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <Brain className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Question {currentQuestion + 1} of {questions.length}</h2>
        <p className="text-muted-foreground mb-6">Get ready to answer the next interview question!</p>
        
        <div className="mb-6 w-full max-w-md">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm font-medium">Current Score</p>
            <p className="text-xl font-bold">{score}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm font-medium">Confidence Level</p>
            <p className="text-xl font-bold">{confidenceLevel[currentQuestion] || 3}/5</p>
          </div>
        </div>
        
        <Button
          size="lg" 
          className="w-full max-w-[200px] bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg transition-all"
          onClick={startQuestion}
        >
          Start Question
        </Button>
      </motion.div>
    );
  };

  const renderQuestionScreen = () => {
    if (!questions || questions.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(timeRemaining)}
          </Badge>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={handleSkipQuestion}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-lg">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          {questions[currentQuestion].description && (
            <CardContent className="pt-2">
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
              className="min-h-[150px] border-2 focus:border-primary/50"
              value={userAnswers[currentQuestion] || ''}
              onChange={handleAnswerChange}
            />
          </div>

          {showHint && questions[currentQuestion].suggestedAnswer && (
            <Card className="border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <span className="font-medium">Hint:</span> {questions[currentQuestion].suggestedAnswer.split(' ').slice(0, 15).join(' ')}...
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => setShowHint(!showHint)}
            >
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            <Button 
              onClick={handleGetFeedback}
              disabled={!userAnswers[currentQuestion] || isSubmitting}
              className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Feedback...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderFeedbackScreen = () => {
    if (!questions || questions.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="flex items-center">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <Trophy className="h-3 w-3 mr-1" />
              Score: {score}
            </Badge>
          </div>
        </div>

        <Card className="mb-4 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <Card className="border border-muted bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                Your Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {userAnswers[currentQuestion] || "You didn't provide an answer."}
              </p>
            </CardContent>
          </Card>

          {feedback[currentQuestion] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="text-sm flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    AI Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Overall Feedback</h4>
                    <p className="text-sm whitespace-pre-wrap">{feedback[currentQuestion]}</p>
                  </div>
                  
                  {analysisData[currentQuestion] && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Clarity</p>
                          <p className="text-lg font-semibold text-primary">{analysisData[currentQuestion].clarity}/5</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Relevance</p>
                          <p className="text-lg font-semibold text-primary">{analysisData[currentQuestion].relevance}/5</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Overall</p>
                          <p className="text-lg font-semibold text-primary">{analysisData[currentQuestion].overall}/5</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Strengths</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {analysisData[currentQuestion].strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">{strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Areas for Improvement</h4>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {analysisData[currentQuestion].areasForImprovement.map((area: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">{area}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {analysisData[currentQuestion].suggestedResponse && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Suggested Structure</h4>
                          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <p className="text-sm text-muted-foreground">
                              {analysisData[currentQuestion].suggestedResponse}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex space-x-2 mt-6">
                    <Button 
                      variant={feedbackQuality[currentQuestion] === 'helpful' ? 'default' : 'outline'} 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => handleRateFeedback(true)}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful
                    </Button>
                    <Button 
                      variant={feedbackQuality[currentQuestion] === 'not-helpful' ? 'default' : 'outline'} 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => handleRateFeedback(false)}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Not Helpful
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            onClick={handleNextQuestion}
            className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all"
          >
            {currentQuestion < (questions?.length || 0) - 1 ? (
              <>Next Question <ChevronRight className="h-4 w-4 ml-1" /></>
            ) : (
              <>Complete Practice <CheckCircle2 className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderSummaryScreen = () => {
    if (!questions) return null;
    
    // Calculate stats
    const answeredQuestions = Object.keys(userAnswers).length;
    const completionRate = Math.round((answeredQuestions / questions.length) * 100);
    const receivedFeedback = Object.keys(feedback).length;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Practice Complete!</h2>
        <p className="text-muted-foreground mb-6">Great job completing your interview practice session.</p>
        
        <Card className="w-full mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Practice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4">
                <p className="text-muted-foreground text-sm">Total Score</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
              </div>
              <div className="p-4">
                <p className="text-muted-foreground text-sm">Completion Rate</p>
                <p className="text-3xl font-bold">{completionRate}%</p>
              </div>
              <div className="p-4">
                <p className="text-muted-foreground text-sm">Questions</p>
                <p className="text-3xl font-bold">{questions.length}</p>
              </div>
              <div className="p-4">
                <p className="text-muted-foreground text-sm">Feedback Received</p>
                <p className="text-3xl font-bold">{receivedFeedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="w-full space-y-4">
          <Button
            size="lg" 
            className="w-full bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg transition-all"
            onClick={handleFinishPractice}
          >
            Save Results & Finish
          </Button>
          
          <DialogClose asChild>
            <Button variant="outline" size="lg" className="w-full">
              Close Without Saving
            </Button>
          </DialogClose>
        </div>
      </motion.div>
    );
  };

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
      <AnimatePresence mode="wait">
        {gameState === 'intro' && renderIntroScreen()}
        {gameState === 'question' && renderQuestionScreen()}
        {gameState === 'feedback' && renderFeedbackScreen()}
        {gameState === 'summary' && renderSummaryScreen()}
      </AnimatePresence>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center text-xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              Interview Practice Challenge
            </span>
          </DialogTitle>
          <DialogDescription>
            {process 
              ? `Practice for your interview at ${process.companyName} for the ${process.position} position.`
              : 'General interview practice with common questions.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[65vh]">
          <div className="p-6">
            {renderContent()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};