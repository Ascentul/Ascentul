import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Target, Filter, ArrowUpDown, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import GoalCard from '@/components/GoalCard';
import GoalForm from '@/components/GoalForm';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Goals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('dueDate-asc');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [hiddenGoalIds, setHiddenGoalIds] = useState<number[]>([]);
  // Add a state to track goals that are currently being dissolved
  const [dissolvingGoalIds, setDissolvingGoalIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/goals'],
    placeholderData: [],
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return apiRequest('DELETE', `/api/goals/${goalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete goal: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleEditGoal = (goalId: number) => {
    const goal = goals.find((g: any) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setIsAddGoalOpen(true);
    }
  };

  const handleDeleteGoal = (goalId: number) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoalMutation.mutate(goalId);
    }
  };
  
  const handleReopenGoal = (goalId: number) => {
    // This would actually call an API to update the goal status
    const goal = goals.find((g: any) => g.id === goalId);
    if (goal) {
      toast({
        title: "Goal Reopened",
        description: "The goal has been moved back to active goals.",
      });
      
      // In a real implementation, this would be an API call:
      // apiRequest('PUT', `/api/goals/${goalId}`, { ...goal, status: 'active', completed: false, completedAt: null })
      //   .then(() => queryClient.invalidateQueries({ queryKey: ['/api/goals'] }));
      
      console.log('Reopening goal:', goal.id);
    }
  };
  
  // Handle when a goal has been completed and should dissolve
  const handleGoalComplete = (goalId: number) => {
    // First, mark this goal as dissolving so we know it's in the animation phase
    setDissolvingGoalIds(prev => [...prev, goalId]);
    
    // After the animation completes (1.5s), update the goal status via API and remove from dissolving state
    setTimeout(() => {
      // Find the goal in the current goals list
      const goal = goals.find((g: any) => g.id === goalId);
      if (goal) {
        // Update the goal status to completed via the API
        apiRequest('PUT', `/api/goals/${goalId}`, { 
          ...goal, 
          status: 'completed',
          progress: 100,
          completed: true,
          completedAt: new Date().toISOString()
        })
        .then(() => {
          // Remove goal from dissolving state
          setDissolvingGoalIds(prev => prev.filter(id => id !== goalId));
          
          // Refresh goals data
          queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
          
          toast({
            title: "Goal Saved as Completed",
            description: "Your goal has been moved to the completed section.",
          });
        })
        .catch((error) => {
          console.error('Error updating goal:', error);
          // Remove from dissolving state even if there's an error
          setDissolvingGoalIds(prev => prev.filter(id => id !== goalId));
          
          toast({
            title: "Error",
            description: "Failed to save completed goal. Please try again.",
            variant: "destructive",
          });
        });
      }
    }, 2500); // This should match the CSS transition time (2.5 seconds)
  };

  const sortedAndFilteredGoals = () => {
    if (!goals || !Array.isArray(goals)) return [];
    
    let filteredGoals = [...goals];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredGoals = filteredGoals.filter(
        (goal: any) => 
          goal.title.toLowerCase().includes(query) || 
          (goal.description && goal.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filteredGoals = filteredGoals.filter((goal: any) => goal.status === statusFilter);
    }
    
    // Apply sorting
    const [sortField, sortDirection] = sortOption.split('-');
    filteredGoals.sort((a: any, b: any) => {
      if (sortField === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'progress') {
        return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress;
      } else if (sortField === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      }
      return 0;
    });
    
    return filteredGoals;
  };

  // Animation variants - keeping them subtle
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };
  
  const subtleUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  const listContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    }
  };
  
  const listItem = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
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
          <h1 className="text-2xl font-bold font-poppins">Career Goals</h1>
          <p className="text-neutral-500">Track and manage your career goals</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => {
            setSelectedGoal(null);
            setIsAddGoalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </motion.div>
      
      {/* Filters & Search */}
      <motion.div variants={subtleUp}>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search goals..."
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      {statusFilter || 'Filter by Status'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('on-track')}>
                    On Track
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('at-risk')}>
                    At Risk
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort by
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption('dueDate-asc')}>
                    Due Date (Earliest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('dueDate-desc')}>
                    Due Date (Latest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('progress-desc')}>
                    Progress (Highest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('progress-asc')}>
                    Progress (Lowest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('title-asc')}>
                    Title (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Active Goals Section */}
      <motion.div className="mb-10" variants={subtleUp}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Active Goals</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : goals && Array.isArray(goals) && goals.filter((g: any) => g.status !== 'completed' || dissolvingGoalIds.includes(g.id)).length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={listContainer}
          >
            {/* Regular active goals */}
            {sortedAndFilteredGoals()
              .filter(goal => goal.status !== 'completed' && !dissolvingGoalIds.includes(goal.id))
              .map((goal: any) => (
                <motion.div 
                  key={goal.id} 
                  className="relative group"
                  variants={listItem}
                >
                  <GoalCard
                    id={goal.id}
                    title={goal.title}
                    description={goal.description || ''}
                    progress={goal.progress}
                    status={goal.status}
                    dueDate={goal.dueDate ? new Date(goal.dueDate) : undefined}
                    checklist={goal.checklist || []}
                    onEdit={handleEditGoal}
                    onComplete={handleGoalComplete}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
              
            {/* Dissolving goals that are fading out */}
            {goals
              .filter(goal => dissolvingGoalIds.includes(goal.id))
              .map((goal: any) => (
                <motion.div 
                  key={`dissolving-${goal.id}`} 
                  className="relative group"
                  variants={listItem}
                >
                  <div className="goal-card dissolving">
                    <Card className="border border-neutral-200 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{goal.title}</h3>
                            <p className="text-sm text-neutral-500 mt-1">{goal.description || ''}</p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>100%</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-6 bg-white rounded-lg shadow-sm"
            variants={subtleUp}
          >
            <Target className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Active Goals</h3>
            <p className="text-neutral-500 mb-4">
              Start by creating your first career goal to track your progress
            </p>
            <Button
              onClick={() => {
                setSelectedGoal(null);
                setIsAddGoalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Goal
            </Button>
          </motion.div>
        )}
      </motion.div>
      
      {/* Completed Goals Section */}
      <motion.div variants={subtleUp}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Completed Goals
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : goals && Array.isArray(goals) && goals.filter((g: any) => g.status === 'completed' && !hiddenGoalIds.includes(g.id)).length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <AnimatePresence mode="sync">
                  {goals
                    .filter((goal: any) => goal.status === 'completed' && !hiddenGoalIds.includes(goal.id))
                    .map((goal: any) => (
                      <motion.div
                        key={goal.id}
                        id={`goal-${goal.id}`}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        className="mb-4"
                      >
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border p-4 relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-sm line-through text-neutral-500">{goal.title}</h3>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  Completed
                                </span>
                              </div>
                              {goal.description && (
                                <p className="text-xs text-neutral-500 mt-1 line-through">{goal.description}</p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleReopenGoal(goal.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reopen
                            </Button>
                          </div>
                          {goal.completedAt && (
                            <p className="text-xs text-neutral-400 mt-2">
                              Completed {new Date(goal.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-4 text-neutral-500">
                <CheckCircle className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                <p>No completed goals yet. Complete a goal to see it here!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
      
      {/* Add/Edit Goal Dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          </DialogHeader>
          <GoalForm 
            goal={selectedGoal} 
            onSuccess={() => setIsAddGoalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}