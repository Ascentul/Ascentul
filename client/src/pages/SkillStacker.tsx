import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, BookOpen, Code, Flame, Calendar, Clock, PlusCircle, Medal, Star, BarChart, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

// Types
interface SkillStackerTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  resources: string[];
  type: 'learning' | 'practice' | 'project';
  status: 'complete' | 'incomplete';
  completedAt: Date | null;
  rating?: number;
}

interface SkillStackerPlan {
  id: number;
  userId: number;
  goalId: number;
  week: number;
  title: string;
  description: string;
  tasks: SkillStackerTask[];
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  completedAt: Date | null;
  streak: number;
}

interface Goal {
  id: number;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  progress: number;
  completed: boolean;
}

// Skill level options for generating plans
const skillLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// Helper function to determine task icon
const getTaskIcon = (type: string) => {
  switch (type) {
    case 'learning':
      return <BookOpen className="h-5 w-5 mr-2" />;
    case 'practice':
      return <Code className="h-5 w-5 mr-2" />;
    case 'project':
      return <Flame className="h-5 w-5 mr-2" />;
    default:
      return <BookOpen className="h-5 w-5 mr-2" />;
  }
};

// Helper function to format task type for display
const formatTaskType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export default function SkillStacker() {
  const { toast } = useToast();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('beginner');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SkillStackerPlan | null>(null);
  const [currentTab, setCurrentTab] = useState('active');

  // Fetch all skill stacker plans
  const { data: allPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/skill-stacker'],
    queryFn: () => apiRequest<SkillStackerPlan[]>({ url: '/api/skill-stacker' }),
  });

  // Fetch goals for dropdown
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: () => apiRequest<Goal[]>({ url: '/api/goals' }),
  });

  // Filter plans based on selected tab
  const filteredPlans = allPlans ? allPlans.filter((plan: SkillStackerPlan) => {
    if (currentTab === 'active') return plan.status === 'active';
    if (currentTab === 'completed') return plan.status === 'completed';
    if (currentTab === 'archived') return plan.status === 'archived';
    return true;
  }) : [];

  // Mutation for generating a new skill stacker plan
  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest<SkillStackerPlan>({
      url: '/api/skill-stacker/generate',
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      setIsGenerating(false);
      setIsGenerateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      toast({
        title: 'Success!',
        description: 'Your skill development plan has been created.',
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: 'Failed to generate skill plan. Please try again.',
        variant: 'destructive',
      });
      console.error('Error generating skill plan:', error);
    },
  });

  // Mutation for completing a task
  const completeTaskMutation = useMutation({
    mutationFn: ({ planId, taskId, status, rating }: { planId: number; taskId: string; status: 'complete' | 'incomplete'; rating?: number }) => 
      apiRequest<SkillStackerPlan>({
        url: `/api/skill-stacker/${planId}/task/${taskId}`,
        method: 'PUT',
        data: { status, rating },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      setSelectedPlan(data);
      toast({
        title: 'Task updated',
        description: 'Your progress has been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
      console.error('Error updating task:', error);
    },
  });

  // Mutation for completing a plan
  const completePlanMutation = useMutation({
    mutationFn: (planId: number) => 
      apiRequest<SkillStackerPlan>({
        url: `/api/skill-stacker/${planId}/complete`,
        method: 'PUT',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      setSelectedPlan(data);
      toast({
        title: 'Congratulations!',
        description: 'You completed this week\'s skill development plan.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to complete plan. Make sure all tasks are finished.',
        variant: 'destructive',
      });
      console.error('Error completing plan:', error);
    },
  });

  // Handle generating a new skill plan
  const handleGeneratePlan = () => {
    if (!selectedGoal) {
      toast({
        title: 'Error',
        description: 'Please select a goal first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      goalId: selectedGoal,
      week: selectedWeek,
      currentSkillLevel: selectedSkillLevel,
    });
  };

  // Handle task completion
  const handleTaskStatusChange = (planId: number, taskId: string, currentStatus: 'complete' | 'incomplete') => {
    const newStatus = currentStatus === 'complete' ? 'incomplete' : 'complete';
    completeTaskMutation.mutate({ planId, taskId, status: newStatus });
  };

  // Check if a plan can be completed (all tasks complete)
  const canCompletePlan = (plan: SkillStackerPlan) => {
    return plan.tasks.every(task => task.status === 'complete') && !plan.isCompleted;
  };

  // Calculate progress percentage
  const calculateProgress = (plan: SkillStackerPlan) => {
    if (!plan.tasks.length) return 0;
    const completedTasks = plan.tasks.filter(task => task.status === 'complete').length;
    return Math.round((completedTasks / plan.tasks.length) * 100);
  };

  // Handle viewing a plan's details
  const handleViewPlan = (plan: SkillStackerPlan) => {
    setSelectedPlan(plan);
  };

  // Handle completing a plan
  const handleCompletePlan = (planId: number) => {
    completePlanMutation.mutate(planId);
  };

  if (isLoadingPlans || isLoadingGoals) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Stacker</h1>
          <p className="text-muted-foreground">Build skills progressively with AI-powered learning paths</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Skill Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Skill Development Plan</DialogTitle>
                <DialogDescription>
                  Select a goal and skill level to generate a personalized learning path.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goal">Select a Goal</Label>
                  <Select 
                    value={selectedGoal?.toString() || ''} 
                    onValueChange={(value) => setSelectedGoal(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals && goals.map((goal: Goal) => (
                        <SelectItem key={goal.id} value={goal.id.toString()}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="week">Week Number</Label>
                  <Input 
                    id="week" 
                    type="number" 
                    min="1" 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="skill-level">Your Current Skill Level</Label>
                  <Select 
                    value={selectedSkillLevel} 
                    onValueChange={setSelectedSkillLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={isGenerating || !selectedGoal}
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs for filtering plans */}
      <Tabs defaultValue="active" onValueChange={setCurrentTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active Plans</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        {/* Plans List */}
        <TabsContent value="active" className="space-y-4">
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                <p className="mb-4 text-center text-muted-foreground">No active skill development plans.</p>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan: SkillStackerPlan) => (
                <Card key={plan.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{plan.title}</CardTitle>
                      <Badge variant={plan.isCompleted ? "success" : "default"}>
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Week {plan.week}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Medal className="h-4 w-4 mr-1 text-amber-500" />
                        <span className="text-sm">
                          {plan.streak > 0 ? `${plan.streak} week streak` : 'No streak'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(plan)}%</span>
                      </div>
                      <Progress value={calculateProgress(plan)} className="h-2" />
                    </div>
                    
                    <div className="space-y-2 mb-2">
                      {plan.tasks.slice(0, 2).map((task) => (
                        <div key={task.id} className="flex items-start justify-between">
                          <div className="flex items-start">
                            {task.status === 'complete' ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-1" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-1" />
                            )}
                            <span className="text-sm line-clamp-1">{task.title}</span>
                          </div>
                          <Badge variant="outline" className="shrink-0 ml-2">
                            {formatTaskType(task.type)}
                          </Badge>
                        </div>
                      ))}
                      {plan.tasks.length > 2 && (
                        <div className="text-sm text-muted-foreground text-center pt-1">
                          +{plan.tasks.length - 2} more tasks
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPlan(plan)}
                    >
                      View Details
                    </Button>
                    
                    {canCompletePlan(plan) && (
                      <Button 
                        size="sm" 
                        onClick={() => handleCompletePlan(plan.id)}
                      >
                        Complete Week
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="flex justify-center pt-6 pb-6">
                <p className="text-center text-muted-foreground">No completed skill development plans yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan: SkillStackerPlan) => (
                <Card key={plan.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{plan.title}</CardTitle>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Week {plan.week}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {plan.completedAt && format(new Date(plan.completedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center mb-2">
                        <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {plan.tasks.length} tasks completed
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Medal className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">
                          {plan.streak > 0 ? `${plan.streak} week streak` : 'No streak'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPlan(plan)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived">
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="flex justify-center pt-6 pb-6">
                <p className="text-center text-muted-foreground">No archived skill development plans.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan: SkillStackerPlan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.title}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPlan(plan)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Plan Detail Dialog */}
      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-2xl">{selectedPlan.title}</DialogTitle>
                <Badge variant={selectedPlan.isCompleted ? "success" : "default"}>
                  {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                </Badge>
              </div>
              <DialogDescription>
                {selectedPlan.description}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Week {selectedPlan.week}</span>
              </div>
              
              <div className="flex items-center">
                <Medal className="h-4 w-4 mr-2 text-amber-500" />
                <span className="text-sm">
                  {selectedPlan.streak > 0 ? `${selectedPlan.streak} week streak` : 'No streak'}
                </span>
              </div>
              
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Progress: {calculateProgress(selectedPlan)}%
                </span>
              </div>
              
              {selectedPlan.completedAt && (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">
                    Completed on {format(new Date(selectedPlan.completedAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-4" />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Tasks</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPlan.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        {task.status === 'complete' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">{task.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTaskIcon(task.type)}
                          {formatTaskType(task.type)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{task.estimatedHours}h</TableCell>
                      <TableCell className="text-right">
                        {!selectedPlan.isCompleted && (
                          <Button
                            variant={task.status === 'complete' ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleTaskStatusChange(selectedPlan.id, task.id, task.status)}
                          >
                            {task.status === 'complete' ? 'Mark Incomplete' : 'Complete'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator className="my-4" />
            
            <h3 className="text-lg font-medium mb-2">Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {selectedPlan.tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      {getTaskIcon(task.type)}
                      <CardTitle className="text-base">{task.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {task.resources.map((resource, index) => (
                        <li key={index} className="text-sm">{resource}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <DialogFooter>
              {canCompletePlan(selectedPlan) && (
                <Button onClick={() => handleCompletePlan(selectedPlan.id)}>
                  Complete Week
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}