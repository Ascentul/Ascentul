import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Trophy, Brain, Sparkles, Star, Clock, CheckCircle2, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export const GamePracticeSession = ({ process, isOpen, onClose }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [feedback, setFeedback] = useState({});
    const [analysisData, setAnalysisData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questionGenerationStatus, setQuestionGenerationStatus] = useState('idle');
    const [gameState, setGameState] = useState('intro');
    const [timerActive, setTimerActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
    const [score, setScore] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [confidenceLevel, setConfidenceLevel] = useState({});
    const [showHint, setShowHint] = useState(false);
    const [feedbackQuality, setFeedbackQuality] = useState({});
    // Generate/fetch questions based on the job position
    const { data: questionsResponse, isLoading } = useQuery({
        queryKey: ['/api/interview/questions', process?.id],
        queryFn: async () => {
            if (!process) {
                // Fetch general interview questions if no process is provided
                const res = await apiRequest('GET', '/api/interview/questions');
                const data = await res.json();
                return {
                    behavioral: data.map((q) => ({
                        question: q.question,
                        description: '',
                        suggestedAnswer: q.suggestedAnswer || ''
                    }))
                };
            }
            else {
                // Generate specific questions based on job description
                setQuestionGenerationStatus('loading');
                try {
                    const res = await apiRequest('POST', '/api/interview/generate-questions', {
                        jobTitle: process.position,
                        skills: extractSkills(process.jobDescription || '')
                    });
                    setQuestionGenerationStatus('success');
                    return await res.json();
                }
                catch (error) {
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
    const extractSkills = (jobDescription) => {
        // Simple implementation - in a real app, this could use AI or a predefined list of skills
        const commonSkills = ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Communication', 'Leadership'];
        return commonSkills.filter(skill => jobDescription.toLowerCase().includes(skill.toLowerCase()));
    };
    // Save practice session
    const savePracticeMutation = useMutation({
        mutationFn: async (data) => {
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
        let interval;
        if (timerActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => prev - 1);
            }, 1000);
        }
        else if (timeRemaining === 0 && timerActive) {
            setTimerActive(false);
            // If time runs out, go to feedback if we have an answer
            if (userAnswers[currentQuestion]) {
                setGameState('feedback');
                // Generate simple feedback for timeout
                setFeedback({
                    ...feedback,
                    [currentQuestion]: "Time expired! It's important to practice answering questions concisely within the allocated time. Try to structure your answers more efficiently next time."
                });
            }
            else {
                // Skip to next question if no answer provided
                if (currentQuestion < (questions?.length || 0) - 1) {
                    setCurrentQuestion(prev => prev + 1);
                    setGameState('intro');
                }
                else {
                    setGameState('summary');
                }
            }
        }
        return () => clearInterval(interval);
    }, [timerActive, timeRemaining, currentQuestion, questions, userAnswers, feedback]);
    // Define the feedback function first so it can be referenced by other functions
    const handleGetFeedback = async () => {
        if (!questions || questions.length === 0)
            return;
        if (currentQuestion >= questions.length)
            return;
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
        }
        catch (error) {
            console.error("Error getting feedback:", error);
            // Fallback in case of API failure
            let feedbackText;
            if (userAnswers[currentQuestion] && userAnswers[currentQuestion].length > 50) {
                feedbackText = "Your answer is detailed and shows good preparation. You've addressed the key points effectively. To elevate your response, consider structuring it using the STAR method (Situation, Task, Action, Result) for maximum impact.";
            }
            else if (userAnswers[currentQuestion] && userAnswers[currentQuestion].length > 0) {
                feedbackText = "Your answer provides basic information but could benefit from more depth. Consider expanding with specific examples and achievements. Quantify your impact whenever possible.";
            }
            else {
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
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // Play sound effect
    const playSound = (type) => {
        if (!soundEnabled)
            return;
        // In a real implementation, we would play actual sound effects here

    };
    const startQuestion = () => {
        if (!questions || questions.length === 0)
            return;
        if (currentQuestion >= questions.length)
            return;
        setGameState('question');
        setTimerActive(true);
        setTimeRemaining(120); // Reset timer for each question
        setShowHint(false);
        playSound('next');
    };
    const handleNextQuestion = () => {
        if (!questions || questions.length === 0)
            return;
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
        }
        else {
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
        }
        else {
            // End of practice session
            setGameState('summary');
        }
        playSound('next');
    };
    const handleAnswerChange = (e) => {
        setUserAnswers({
            ...userAnswers,
            [currentQuestion]: e.target.value
        });
    };
    const handleRateFeedback = (isHelpful) => {
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
            questions: questions?.map((q, index) => ({
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
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };
    const calculateProgress = () => {
        if (!questions || questions.length === 0)
            return 0;
        return ((currentQuestion + 1) / questions.length) * 100;
    };
    const renderIntroScreen = () => {
        if (!questions || questions.length === 0)
            return null;
        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "flex flex-col items-center justify-center py-8 text-center", children: [_jsx("div", { className: "bg-primary/10 p-4 rounded-full mb-6", children: _jsx(Brain, { className: "h-12 w-12 text-primary" }) }), _jsxs("h2", { className: "text-xl font-bold mb-2", children: ["Question ", currentQuestion + 1, " of ", questions.length] }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Get ready to answer the next interview question!" }), _jsxs("div", { className: "mb-6 w-full max-w-md", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [Math.round(calculateProgress()), "%"] })] }), _jsx(Progress, { value: calculateProgress(), className: "h-2" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8 w-full max-w-md", children: [_jsxs("div", { className: "bg-muted p-4 rounded-lg text-center", children: [_jsx("div", { className: "flex justify-center mb-2", children: _jsx(Trophy, { className: "h-5 w-5 text-amber-500" }) }), _jsx("p", { className: "text-sm font-medium", children: "Current Score" }), _jsx("p", { className: "text-xl font-bold", children: score })] }), _jsxs("div", { className: "bg-muted p-4 rounded-lg text-center", children: [_jsx("div", { className: "flex justify-center mb-2", children: _jsx(Star, { className: "h-5 w-5 text-amber-500" }) }), _jsx("p", { className: "text-sm font-medium", children: "Confidence Level" }), _jsxs("p", { className: "text-xl font-bold", children: [confidenceLevel[currentQuestion] || 3, "/5"] })] })] }), _jsx(Button, { size: "lg", className: "w-full max-w-[200px] bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg transition-all", onClick: startQuestion, children: "Start Question" })] }));
    };
    const renderQuestionScreen = () => {
        if (!questions || questions.length === 0)
            return null;
        return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs(Badge, { variant: "outline", className: "flex items-center", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), formatTime(timeRemaining)] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: () => setSoundEnabled(!soundEnabled), children: soundEnabled ? _jsx(Volume2, { className: "h-4 w-4" }) : _jsx(VolumeX, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: handleSkipQuestion, children: _jsx(SkipForward, { className: "h-4 w-4" }) })] })] }), _jsxs(Card, { className: "border-2 border-primary/20 shadow-lg", children: [_jsx(CardHeader, { className: "pb-2 bg-gradient-to-r from-primary/10 to-transparent", children: _jsx(CardTitle, { className: "text-lg", children: questions[currentQuestion].question }) }), questions[currentQuestion].description && (_jsx(CardContent, { className: "pt-2", children: _jsx("p", { className: "text-sm text-muted-foreground", children: questions[currentQuestion].description }) }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Your Answer"] }), _jsx(Textarea, { placeholder: "Type your answer here...", className: "min-h-[150px] border-2 focus:border-primary/50", value: userAnswers[currentQuestion] || '', onChange: handleAnswerChange })] }), showHint && questions[currentQuestion].suggestedAnswer && (_jsx(Card, { className: "border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20", children: _jsx(CardContent, { className: "pt-4", children: _jsxs("p", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: "Hint:" }), " ", questions[currentQuestion].suggestedAnswer.split(' ').slice(0, 15).join(' '), "..."] }) }) })), _jsxs("div", { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", className: "flex items-center", onClick: () => setShowHint(!showHint), children: [_jsx(Sparkles, { className: "h-4 w-4 mr-2 text-amber-500" }), showHint ? 'Hide Hint' : 'Show Hint'] }), _jsx(Button, { onClick: handleGetFeedback, disabled: !userAnswers[currentQuestion] || isSubmitting, className: "bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Getting Feedback..."] })) : ('Submit Answer') })] })] })] }));
    };
    const renderFeedbackScreen = () => {
        if (!questions || questions.length === 0)
            return null;
        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs(Badge, { variant: "outline", className: "flex items-center", children: ["Question ", currentQuestion + 1, " of ", questions.length] }), _jsx("div", { className: "flex space-x-2", children: _jsxs(Badge, { variant: "secondary", className: "flex items-center", children: [_jsx(Trophy, { className: "h-3 w-3 mr-1" }), "Score: ", score] }) })] }), _jsx(Card, { className: "mb-4 border-primary/20", children: _jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg", children: questions[currentQuestion].question }) }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "border border-muted bg-muted/50", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm flex items-center", children: "Your Answer" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm whitespace-pre-wrap", children: userAnswers[currentQuestion] || "You didn't provide an answer." }) })] }), feedback[currentQuestion] && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.3 }, children: _jsxs(Card, { className: "border-2 border-primary/20 shadow-lg", children: [_jsx(CardHeader, { className: "pb-2 bg-gradient-to-r from-primary/10 to-transparent", children: _jsxs(CardTitle, { className: "text-sm flex items-center", children: [_jsx(Sparkles, { className: "h-4 w-4 mr-2 text-primary" }), "AI Feedback"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Overall Feedback" }), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: feedback[currentQuestion] })] }), analysisData[currentQuestion] && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 mt-4", children: [_jsxs("div", { className: "bg-muted/50 p-3 rounded-lg text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Clarity" }), _jsxs("p", { className: "text-lg font-semibold text-primary", children: [analysisData[currentQuestion].clarity, "/5"] })] }), _jsxs("div", { className: "bg-muted/50 p-3 rounded-lg text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Relevance" }), _jsxs("p", { className: "text-lg font-semibold text-primary", children: [analysisData[currentQuestion].relevance, "/5"] })] }), _jsxs("div", { className: "bg-muted/50 p-3 rounded-lg text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Overall" }), _jsxs("p", { className: "text-lg font-semibold text-primary", children: [analysisData[currentQuestion].overall, "/5"] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Strengths" }), _jsx("ul", { className: "text-sm space-y-1 list-disc list-inside", children: analysisData[currentQuestion].strengths.map((strength, idx) => (_jsx("li", { className: "text-muted-foreground", children: strength }, idx))) })] }), _jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Areas for Improvement" }), _jsx("ul", { className: "text-sm space-y-1 list-disc list-inside", children: analysisData[currentQuestion].areasForImprovement.map((area, idx) => (_jsx("li", { className: "text-muted-foreground", children: area }, idx))) })] }), analysisData[currentQuestion].suggestedResponse && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-semibold mb-2", children: "Suggested Structure" }), _jsx("div", { className: "bg-primary/5 p-3 rounded-lg border border-primary/20", children: _jsx("p", { className: "text-sm text-muted-foreground", children: analysisData[currentQuestion].suggestedResponse }) })] }))] })), _jsxs("div", { className: "flex space-x-2 mt-6", children: [_jsxs(Button, { variant: feedbackQuality[currentQuestion] === 'helpful' ? 'default' : 'outline', size: "sm", className: "flex items-center", onClick: () => handleRateFeedback(true), children: [_jsx(ThumbsUp, { className: "h-3 w-3 mr-1" }), "Helpful"] }), _jsxs(Button, { variant: feedbackQuality[currentQuestion] === 'not-helpful' ? 'default' : 'outline', size: "sm", className: "flex items-center", onClick: () => handleRateFeedback(false), children: [_jsx(ThumbsDown, { className: "h-3 w-3 mr-1" }), "Not Helpful"] })] })] })] }) }))] }), _jsx("div", { className: "pt-4 flex justify-end", children: _jsx(Button, { onClick: handleNextQuestion, className: "bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all", children: currentQuestion < (questions?.length || 0) - 1 ? (_jsxs(_Fragment, { children: ["Next Question ", _jsx(ChevronRight, { className: "h-4 w-4 ml-1" })] })) : (_jsxs(_Fragment, { children: ["Complete Practice ", _jsx(CheckCircle2, { className: "h-4 w-4 ml-1" })] })) }) })] }));
    };
    const renderSummaryScreen = () => {
        if (!questions)
            return null;
        // Calculate stats
        const answeredQuestions = Object.keys(userAnswers).length;
        const completionRate = Math.round((answeredQuestions / questions.length) * 100);
        const receivedFeedback = Object.keys(feedback).length;
        return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "flex flex-col items-center justify-center py-6 text-center", children: [_jsx("div", { className: "bg-primary/10 p-4 rounded-full mb-6", children: _jsx(Trophy, { className: "h-12 w-12 text-primary" }) }), _jsx("h2", { className: "text-xl font-bold mb-2", children: "Practice Complete!" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Great job completing your interview practice session." }), _jsxs(Card, { className: "w-full mb-6", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg", children: "Practice Summary" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-center", children: [_jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Total Score" }), _jsx("p", { className: "text-3xl font-bold text-primary", children: score })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Completion Rate" }), _jsxs("p", { className: "text-3xl font-bold", children: [completionRate, "%"] })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Questions" }), _jsx("p", { className: "text-3xl font-bold", children: questions.length })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-muted-foreground text-sm", children: "Feedback Received" }), _jsx("p", { className: "text-3xl font-bold", children: receivedFeedback })] })] }) })] }), _jsxs("div", { className: "w-full space-y-4", children: [_jsx(Button, { size: "lg", className: "w-full bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg transition-all", onClick: handleFinishPractice, children: "Save Results & Finish" }), _jsx(DialogClose, { asChild: true, children: _jsx(Button, { variant: "outline", size: "lg", className: "w-full", children: "Close Without Saving" }) })] })] }));
    };
    const renderContent = () => {
        if (isLoading || questionGenerationStatus === 'loading') {
            return (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary mb-4" }), _jsx("p", { className: "text-muted-foreground", children: process
                            ? `Generating personalized questions for ${process.position} at ${process.companyName}...`
                            : 'Loading interview questions...' })] }));
        }
        if (questionGenerationStatus === 'error' || !questions || questions.length === 0) {
            return (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsx("p", { className: "text-muted-foreground mb-4", children: "Failed to load interview questions. Please try again." }), _jsx(Button, { onClick: onClose, children: "Close" })] }));
        }
        return (_jsxs(AnimatePresence, { mode: "wait", children: [gameState === 'intro' && renderIntroScreen(), gameState === 'question' && renderQuestionScreen(), gameState === 'feedback' && renderFeedbackScreen(), gameState === 'summary' && renderSummaryScreen()] }));
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[700px] max-h-[85vh] p-0 overflow-hidden", children: [_jsxs(DialogHeader, { className: "p-6 pb-0", children: [_jsx(DialogTitle, { className: "flex items-center text-xl", children: _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600", children: "Interview Practice Challenge" }) }), _jsx(DialogDescription, { children: process
                                ? `Practice for your interview at ${process.companyName} for the ${process.position} position.`
                                : 'General interview practice with common questions.' })] }), _jsx(ScrollArea, { className: "max-h-[65vh]", children: _jsx("div", { className: "p-6", children: renderContent() }) })] }) }));
};
