import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Clock, 
  Compass, 
  FileText, 
  PlayCircle, 
  AlertCircle, 
  Heart,
  BarChart3,
  CheckCircle2,
  Plus,
  CalendarClock,
  BookOpen,
  Code2,
  PenTool,
  Target,
  Laptop,
  ClipboardList,
  Star
} from 'lucide-react';

// Form imports
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/lib/useUserData';

// Types for our skill stacker data
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

// Form schema for creating a new skill stacker plan
const createPlanSchema = z.object({
  goalId: z.string().min(1, "Please select a goal"),
  week: z.string().min(1, "Please enter a week number"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters")
});

// Form schema for adding a new task to a plan
const addTaskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  estimatedHours: z.string().min(1, "Please enter estimated hours"),
  type: z.enum(["learning", "practice", "project"]),
  resources: z.string().optional()
});

export default function SkillStacker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlan, setSelectedPlan] = useState<SkillStackerPlan | null>(null);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Query to fetch all skill stacker plans
  const { data: allPlans, isLoading, error } = useQuery({
    queryKey: ['/api/skill-stacker'],
    enabled: !!user
  });

  // Query to fetch goals for the dropdown in new plan form
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/goals'],
    enabled: !!user
  });

  // Mutation to create a new plan
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/skill-stacker', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      setShowNewPlanDialog(false);
      toast({
        title: "Plan created",
        description: "Your skill development plan has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the plan.",
        variant: "destructive"
      });
    }
  });

  // Mutation to generate a plan with AI
  const generatePlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/skill-stacker/generate', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      setShowGenerateDialog(false);
      toast({
        title: "Plan generated",
        description: "Your AI-powered skill development plan has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while generating the plan.",
        variant: "destructive"
      });
    }
  });

  // Mutation to add a task to a plan
  const addTaskMutation = useMutation({
    mutationFn: (data: { planId: number, task: any }) => 
      apiRequest(`/api/skill-stacker/${data.planId}`, 'PUT', {
        tasks: [...(selectedPlan?.tasks || []), {
          id: crypto.randomUUID(),
          ...data.task,
          status: 'incomplete',
          completedAt: null,
          resources: data.task.resources ? data.task.resources.split(',').map((r: string) => r.trim()) : []
        }]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      setShowTaskDialog(false);
      toast({
        title: "Task added",
        description: "Your new task has been added to the plan.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while adding the task.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update a task status
  const updateTaskStatusMutation = useMutation({
    mutationFn: (data: { planId: number, taskId: string, status: 'complete' | 'incomplete', rating?: number }) => 
      apiRequest(`/api/skill-stacker/${data.planId}/task/${data.taskId}`, 'PUT', {
        status: data.status,
        rating: data.rating
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      toast({
        title: "Task updated",
        description: "Your task status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating the task.",
        variant: "destructive"
      });
    }
  });

  // Mutation to complete a skill plan
  const completePlanMutation = useMutation({
    mutationFn: (planId: number) => 
      apiRequest(`/api/skill-stacker/${planId}/complete`, 'PUT', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
      toast({
        title: "Plan completed",
        description: "Congratulations! You've completed this skill development plan.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Have you completed all tasks?",
        variant: "destructive"
      });
    }
  });

  // Set up forms
  const createPlanForm = useForm<z.infer<typeof createPlanSchema>>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      goalId: "",
      week: "",
      title: "",
      description: ""
    }
  });

  const addTaskForm = useForm<z.infer<typeof addTaskSchema>>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      estimatedHours: "",
      type: "learning",
      resources: ""
    }
  });

  const generatePlanForm = useForm<{
    goalId: string;
    week: string;
    currentSkillLevel: string;
  }>({
    defaultValues: {
      goalId: "",
      week: "",
      currentSkillLevel: "beginner"
    }
  });

  const [taskRating, setTaskRating] = useState<number | null>(null);

  // Filter plans based on active tab
  const filteredPlans = allPlans ? allPlans.filter((plan: SkillStackerPlan) => {
    if (activeTab === "current") return !plan.isCompleted && plan.status === "active";
    if (activeTab === "completed") return plan.isCompleted || plan.status === "completed";
    if (activeTab === "all") return true;
    return true;
  }) : [];

  // Reset form when dialog closes
  useEffect(() => {
    if (!showNewPlanDialog) {
      createPlanForm.reset();
    }
    if (!showTaskDialog) {
      addTaskForm.reset();
      setSelectedTaskId(null);
    }
    if (!showGenerateDialog) {
      generatePlanForm.reset();
    }
  }, [showNewPlanDialog, showTaskDialog, showGenerateDialog, createPlanForm, addTaskForm, generatePlanForm]);

  // Submit handlers
  const onCreatePlanSubmit = (data: z.infer<typeof createPlanSchema>) => {
    createPlanMutation.mutate({
      goalId: parseInt(data.goalId),
      week: parseInt(data.week),
      title: data.title,
      description: data.description,
      tasks: [],
      status: "active"
    });
  };

  const onAddTaskSubmit = (data: z.infer<typeof addTaskSchema>) => {
    if (!selectedPlan) return;
    
    addTaskMutation.mutate({
      planId: selectedPlan.id,
      task: {
        title: data.title,
        description: data.description,
        estimatedHours: parseInt(data.estimatedHours),
        type: data.type,
        resources: data.resources
      }
    });
  };

  const onGeneratePlanSubmit = (data: any) => {
    generatePlanMutation.mutate({
      goalId: parseInt(data.goalId),
      week: parseInt(data.week),
      currentSkillLevel: data.currentSkillLevel
    });
  };

  // Helper functions
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return <BookOpen className="w-4 h-4" />;
      case 'practice':
        return <PenTool className="w-4 h-4" />;
      case 'project':
        return <Laptop className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'learning':
        return "Learning";
      case 'practice':
        return "Practice";
      case 'project':
        return "Project";
      default:
        return "Task";
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'learning':
        return "bg-blue-100 text-blue-800";
      case 'practice':
        return "bg-amber-100 text-amber-800";
      case 'project':
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskProgress = (tasks: SkillStackerTask[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'complete').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const canCompletePlan = (plan: SkillStackerPlan) => {
    if (!plan.tasks || plan.tasks.length === 0) return false;
    return plan.tasks.every(task => task.status === 'complete');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Skill Stacker</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 animate-pulse">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Skill Stacker</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading skill stacker plans</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>There was an error loading your skill development plans. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Skill Stacker</h1>
          <p className="text-gray-500 mt-1">Build your skills progressively with structured weekly plans</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Compass className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate a Skill Development Plan</DialogTitle>
                <DialogDescription>
                  Let AI create a structured learning plan for one of your career goals
                </DialogDescription>
              </DialogHeader>
              <Form {...generatePlanForm}>
                <form onSubmit={generatePlanForm.handleSubmit(onGeneratePlanSubmit)} className="space-y-4">
                  <FormField
                    control={generatePlanForm.control}
                    name="goalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select a goal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {goals.map((goal: Goal) => (
                              <SelectItem key={goal.id} value={goal.id.toString()}>
                                {goal.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generatePlanForm.control}
                    name="week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week Number</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Which week of learning is this? (1, 2, 3, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generatePlanForm.control}
                    name="currentSkillLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Current Skill Level</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="beginner" />
                              </FormControl>
                              <FormLabel className="font-normal">Beginner</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="intermediate" />
                              </FormControl>
                              <FormLabel className="font-normal">Intermediate</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="advanced" />
                              </FormControl>
                              <FormLabel className="font-normal">Advanced</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={generatePlanMutation.isPending}>
                      {generatePlanMutation.isPending ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Compass className="w-4 h-4 mr-2" />
                          Generate Plan
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Skill Development Plan</DialogTitle>
                <DialogDescription>
                  Create a structured plan to develop a specific skill over time
                </DialogDescription>
              </DialogHeader>
              <Form {...createPlanForm}>
                <form onSubmit={createPlanForm.handleSubmit(onCreatePlanSubmit)} className="space-y-4">
                  <FormField
                    control={createPlanForm.control}
                    name="goalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select a goal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {goals.map((goal: Goal) => (
                              <SelectItem key={goal.id} value={goal.id.toString()}>
                                {goal.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createPlanForm.control}
                    name="week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week Number</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Which week of learning is this? (1, 2, 3, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createPlanForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Week 1: Python Fundamentals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createPlanForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what skills you'll be developing in this plan" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createPlanMutation.isPending}>
                      {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Plans</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredPlans.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-xl font-medium">No plans found</h3>
              <p className="mt-2 text-gray-500">
                {activeTab === "current" 
                  ? "You don't have any active skill development plans. Create one to get started!" 
                  : activeTab === "completed" 
                    ? "You haven't completed any skill development plans yet." 
                    : "You don't have any skill development plans yet."}
              </p>
              <Button className="mt-4" onClick={() => setShowNewPlanDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPlans.map((plan: SkillStackerPlan) => (
                <Card key={plan.id} className={plan.isCompleted ? "border-green-200 bg-green-50/30" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle>{plan.title}</CardTitle>
                          {plan.isCompleted && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                            </Badge>
                          )}
                          {!plan.isCompleted && plan.status === "active" && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              <PlayCircle className="w-3 h-3 mr-1" /> In Progress
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {plan.description}
                        </CardDescription>
                      </div>
                      <div className="text-sm text-gray-500 flex flex-col items-end">
                        <div className="flex items-center">
                          <CalendarClock className="w-4 h-4 mr-1" />
                          <span>Week {plan.week}</span>
                        </div>
                        {plan.streak > 0 && (
                          <div className="flex items-center mt-1 text-amber-600">
                            <Flame className="w-4 h-4 mr-1" />
                            <span>Streak: {plan.streak}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{getTaskProgress(plan.tasks)}%</span>
                      </div>
                      <Progress value={getTaskProgress(plan.tasks)} className="h-2 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plan.tasks && plan.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {plan.tasks.map((task) => (
                          <div key={task.id} className="flex items-start p-3 bg-white rounded-md border">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Badge variant="outline" className={`mr-2 ${getTaskTypeColor(task.type)}`}>
                                  {getTaskTypeIcon(task.type)}
                                  <span className="ml-1">{getTaskTypeLabel(task.type)}</span>
                                </Badge>
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                              {task.resources && task.resources.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-500">Resources:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {task.resources.map((resource, i) => (
                                      <Badge key={i} variant="outline" className="bg-gray-100">
                                        {resource}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{task.estimatedHours} hours</span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end space-y-2">
                              {!plan.isCompleted && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant={task.status === 'complete' ? "outline" : "default"}
                                      size="sm"
                                      onClick={() => setSelectedTaskId(task.id)}
                                    >
                                      {task.status === 'complete' ? (
                                        <>
                                          <Check className="w-4 h-4 mr-1" />
                                          Completed
                                        </>
                                      ) : (
                                        "Mark Complete"
                                      )}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        {task.status === 'complete' 
                                          ? "Update task status" 
                                          : "Complete this task"}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {task.status === 'complete'
                                          ? "You can mark this task as incomplete if needed"
                                          : "Rate how useful this task was for your skill development"}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <h3 className="font-medium mb-2">{task.title}</h3>
                                      <p className="text-sm text-gray-500 mb-4">{task.description}</p>
                                      
                                      {task.status !== 'complete' && (
                                        <div className="mb-4">
                                          <h4 className="text-sm font-medium mb-2">Rate this task (optional)</h4>
                                          <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                              <button
                                                key={rating}
                                                type="button"
                                                className="p-1 rounded-full hover:bg-gray-100"
                                                onClick={() => setTaskRating(rating)}
                                              >
                                                <Star
                                                  className={`w-6 h-6 ${
                                                    (taskRating || 0) >= rating 
                                                      ? "text-yellow-400 fill-yellow-400" 
                                                      : "text-gray-300"
                                                  }`}
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <DialogFooter className="flex space-x-2">
                                      {task.status === 'complete' && (
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            updateTaskStatusMutation.mutate({
                                              planId: plan.id,
                                              taskId: task.id,
                                              status: 'incomplete'
                                            });
                                            setTaskRating(null);
                                          }}
                                        >
                                          Mark as Incomplete
                                        </Button>
                                      )}
                                      {task.status !== 'complete' && (
                                        <Button
                                          onClick={() => {
                                            updateTaskStatusMutation.mutate({
                                              planId: plan.id,
                                              taskId: task.id,
                                              status: 'complete',
                                              rating: taskRating || undefined
                                            });
                                            setTaskRating(null);
                                          }}
                                        >
                                          <Check className="w-4 h-4 mr-1" />
                                          Complete Task
                                        </Button>
                                      )}
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {task.status === 'complete' && task.completedAt && (
                                <span className="text-xs text-gray-500">
                                  Completed {new Date(task.completedAt).toLocaleDateString()}
                                </span>
                              )}
                              {task.rating && (
                                <div className="flex text-yellow-400">
                                  {Array.from({ length: task.rating }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-md">
                        <ClipboardList className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">No tasks added yet</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      {!plan.isCompleted && (
                        <Dialog open={showTaskDialog && selectedPlan?.id === plan.id} onOpenChange={(open) => {
                          setShowTaskDialog(open);
                          if (open) setSelectedPlan(plan);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Task
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add a New Task</DialogTitle>
                              <DialogDescription>
                                Add a learning, practice, or project task to your skill plan
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...addTaskForm}>
                              <form onSubmit={addTaskForm.handleSubmit(onAddTaskSubmit)} className="space-y-4">
                                <FormField
                                  control={addTaskForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Task Title</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Learn Python Data Structures" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={addTaskForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Describe what you'll learn or practice" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={addTaskForm.control}
                                    name="estimatedHours"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Estimated Hours</FormLabel>
                                        <FormControl>
                                          <Input type="number" min="1" placeholder="2" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={addTaskForm.control}
                                    name="type"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Task Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="learning">Learning</SelectItem>
                                            <SelectItem value="practice">Practice</SelectItem>
                                            <SelectItem value="project">Project</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={addTaskForm.control}
                                  name="resources"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Resources (Optional)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Documentation, YouTube links, etc. (comma separated)" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        List resources separated by commas
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" disabled={addTaskMutation.isPending}>
                                    {addTaskMutation.isPending ? "Adding..." : "Add Task"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <div>
                      {!plan.isCompleted && canCompletePlan(plan) && (
                        <Button
                          onClick={() => completePlanMutation.mutate(plan.id)}
                          disabled={completePlanMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {completePlanMutation.isPending ? "Completing..." : "Complete Week"}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}