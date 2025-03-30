import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UserRound, CheckCircle, XCircle, ThumbsUp, ThumbsDown, MessageCircle, BookOpen, Search, BadgeCheck } from 'lucide-react';

export default function Interview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  
  // Fields for AI generated questions
  const [jobTitle, setJobTitle] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);

  // Fetch interview questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/interview/questions', category],
    queryFn: async ({ queryKey }) => {
      const url = category && category !== "all"
        ? `/api/interview/questions?category=${encodeURIComponent(category)}` 
        : '/api/interview/questions';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    }
  });

  // Fetch practice history
  const { data: practiceHistory } = useQuery({
    queryKey: ['/api/interview/practice-history'],
  });

  // Save practice answer mutation
  const savePracticeMutation = useMutation({
    mutationFn: async ({ questionId, userAnswer, confidence }: { questionId: number, userAnswer: string, confidence: number }) => {
      return apiRequest('POST', '/api/interview/practice', {
        questionId,
        userAnswer,
        confidence
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview/practice-history'] });
      toast({
        title: 'Practice Saved',
        description: 'Your answer has been recorded',
      });
      setUserAnswer('');
      setConfidenceLevel(3);
      setPracticeMode(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save practice: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Generate AI questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = skills.split(',').map(s => s.trim());
      const res = await apiRequest('POST', '/api/interview/generate-questions', {
        jobTitle,
        skills: skillsArray
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedQuestions(data);
      toast({
        title: 'Questions Generated',
        description: 'AI has generated interview questions based on your job target',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate questions: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleStartPractice = (questionId: number) => {
    setSelectedQuestionId(questionId);
    setUserAnswer('');
    setConfidenceLevel(3);
    setPracticeMode(true);
  };

  const handleSubmitPractice = () => {
    if (!selectedQuestionId || !userAnswer) {
      toast({
        title: 'Missing Information',
        description: 'Please provide an answer before submitting',
        variant: 'destructive',
      });
      return;
    }

    savePracticeMutation.mutate({
      questionId: selectedQuestionId,
      userAnswer,
      confidence: confidenceLevel
    });
  };

  const handleGenerateQuestions = () => {
    if (!jobTitle || !skills) {
      toast({
        title: 'Missing Information',
        description: 'Please provide job title and skills',
        variant: 'destructive',
      });
      return;
    }

    generateQuestionsMutation.mutate();
  };

  const filteredQuestions = () => {
    if (!questions) return [];
    
    let filtered = questions;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) || 
        (q.suggestedAnswer && q.suggestedAnswer.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Interview Preparation</h1>
          <p className="text-neutral-500">Practice and prepare for your job interviews</p>
        </div>
      </div>
      
      <Tabs defaultValue="questions">
        <TabsList className="mb-6">
          <TabsTrigger value="questions">Question Library</TabsTrigger>
          <TabsTrigger value="practice">Practice History</TabsTrigger>
          <TabsTrigger value="generator">AI Question Generator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Filter by Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="situational">Situational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Search Questions</label>
                      <div className="relative">
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Question Difficulty</h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded">Easy</div>
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded">Medium</div>
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded">Hard</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : practiceMode ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Question</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">
                        {questions?.find(q => q.id === selectedQuestionId)?.question}
                      </h3>
                      <div className="text-sm text-neutral-500">
                        Category: <span className="font-medium text-primary">
                          {questions?.find(q => q.id === selectedQuestionId)?.category.charAt(0).toUpperCase() + 
                            questions?.find(q => q.id === selectedQuestionId)?.category.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Answer</label>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">How confident are you about your answer?</label>
                      <div className="flex items-center space-x-2">
                        <ThumbsDown className="text-red-500 h-5 w-5" />
                        <Slider
                          value={[confidenceLevel]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(value) => setConfidenceLevel(value[0])}
                          className="flex-1"
                        />
                        <ThumbsUp className="text-green-500 h-5 w-5" />
                      </div>
                      <div className="text-center text-sm text-neutral-500">
                        {confidenceLevel === 1 && "Not confident at all"}
                        {confidenceLevel === 2 && "Slightly confident"}
                        {confidenceLevel === 3 && "Moderately confident"}
                        {confidenceLevel === 4 && "Very confident"}
                        {confidenceLevel === 5 && "Extremely confident"}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setPracticeMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitPractice} disabled={!userAnswer}>
                      Submit Answer
                    </Button>
                  </CardFooter>
                </Card>
              ) : filteredQuestions().length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions().map((question) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-1 text-xs rounded-full ${
                                question.category === 'behavioral' ? 'bg-blue-100 text-blue-800' :
                                question.category === 'technical' ? 'bg-purple-100 text-purple-800' :
                                'bg-teal-100 text-teal-800'
                              }`}>
                                {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
                              </div>
                              <div className={`px-2 py-1 text-xs rounded-full ${
                                question.difficultyLevel === 1 ? 'bg-green-100 text-green-800' :
                                question.difficultyLevel === 2 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.difficultyLevel === 1 ? 'Easy' :
                                 question.difficultyLevel === 2 ? 'Medium' : 'Hard'}
                              </div>
                            </div>
                            <h3 className="text-lg font-medium">{question.question}</h3>
                          </div>
                          <Button onClick={() => handleStartPractice(question.id)}>
                            Practice
                          </Button>
                        </div>
                        
                        <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="text-primary h-4 w-4" />
                            <h4 className="text-sm font-medium">Suggested Approach</h4>
                          </div>
                          <p className="text-sm text-neutral-700">{question.suggestedAnswer}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <UserRound className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Questions Found</h3>
                  <p className="text-neutral-500 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="practice">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Practice Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span>Questions Practiced</span>
                        <span className="font-medium">{practiceHistory?.length || 0}</span>
                      </div>
                      <Progress value={Math.min(100, ((practiceHistory?.length || 0) / 20) * 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span>Average Confidence</span>
                        <span className="font-medium">
                          {practiceHistory?.length
                            ? (practiceHistory.reduce((sum, p) => sum + p.confidence, 0) / practiceHistory.length).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <Progress 
                        value={
                          practiceHistory?.length
                            ? (practiceHistory.reduce((sum, p) => sum + p.confidence, 0) / practiceHistory.length / 5) * 100
                            : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Category Breakdown</h3>
                      {practiceHistory?.length ? (
                        <div className="space-y-3">
                          {['behavioral', 'technical', 'situational'].map(cat => {
                            const count = practiceHistory.filter(p => {
                              const question = questions?.find(q => q.id === p.questionId);
                              return question?.category === cat;
                            }).length;
                            
                            return (
                              <div key={cat}>
                                <div className="flex justify-between items-center mb-1 text-xs">
                                  <span className="capitalize">{cat}</span>
                                  <span>{count} questions</span>
                                </div>
                                <Progress 
                                  value={(count / (practiceHistory.length || 1)) * 100} 
                                  className="h-1.5" 
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500">No practice data yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              {practiceHistory?.length ? (
                <div className="space-y-4">
                  {practiceHistory.map((practice) => {
                    const question = questions?.find(q => q.id === practice.questionId);
                    
                    return (
                      <Card key={practice.id}>
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{question?.question || "Question not found"}</h3>
                                <div className={`px-2 py-1 text-xs rounded-full ${
                                  question?.category === 'behavioral' ? 'bg-blue-100 text-blue-800' :
                                  question?.category === 'technical' ? 'bg-purple-100 text-purple-800' :
                                  'bg-teal-100 text-teal-800'
                                }`}>
                                  {question?.category.charAt(0).toUpperCase() + question?.category.slice(1) || "Unknown"}
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {new Date(practice.practiceDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              Your Answer
                            </h4>
                            <p className="text-sm bg-neutral-50 p-3 rounded-md border">
                              {practice.userAnswer}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1 text-sm">
                              <span>Confidence:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-2 w-5 mx-0.5 rounded-sm ${
                                      level <= practice.confidence
                                        ? 'bg-primary'
                                        : 'bg-neutral-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary">
                              <BadgeCheck className="h-4 w-4 mr-1" />
                              Compare with Suggested
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <UserRound className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Practice History</h3>
                  <p className="text-neutral-500 mb-4">
                    Start practicing interview questions to build your history
                  </p>
                  <Button
                    onClick={() => document.querySelector('[data-value="questions"]')?.click()}
                  >
                    Practice Questions
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Generate Custom Interview Questions</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Job Title</label>
                    <Input
                      placeholder="e.g., Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Skills (comma separated)</label>
                    <Input
                      placeholder="e.g., JavaScript, React, Project Management"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateQuestions}
                    disabled={generateQuestionsMutation.isPending}
                  >
                    {generateQuestionsMutation.isPending ? 'Generating...' : 'Generate Questions'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Generated Questions</h3>
                
                {generatedQuestions ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Behavioral Questions</h4>
                      {generatedQuestions.behavioral.map((q, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-md border border-blue-100">
                          <h5 className="font-medium mb-2">{q.question}</h5>
                          <div className="text-sm">
                            <span className="font-medium">Suggested Approach: </span>
                            {q.suggestedAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Technical Questions</h4>
                      {generatedQuestions.technical.map((q, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-md border border-purple-100">
                          <h5 className="font-medium mb-2">{q.question}</h5>
                          <div className="text-sm">
                            <span className="font-medium">Suggested Approach: </span>
                            {q.suggestedAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UserRound className="h-12 w-12 text-neutral-300 mb-4" />
                    <p className="text-neutral-500">
                      Fill out the form to generate customized interview questions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
