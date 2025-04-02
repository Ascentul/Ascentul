import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useUser, useIsUniversityUser } from '@/lib/useUserData';
import StatCard from '@/components/StatCard';
import CareerJourneyChart from '@/components/CareerJourneyChart';
import LevelProgress from '@/components/LevelProgress';
import GoalCard from '@/components/GoalCard';
import AchievementBadge from '@/components/AchievementBadge';
import CreateGoalModal from '@/components/modals/CreateGoalModal';
import EditGoalModal from '@/components/modals/EditGoalModal';
import Confetti from '@/components/Confetti';
import TodaysRecommendations from '@/components/TodaysRecommendations';

import { 
  Target, Award, FileText, Clock, Plus, Bot, CheckCircle, Send,
  Briefcase, Mail, Users, Eye, Edit, Calendar, ChevronDown, ChevronUp, 
  Square, CheckSquare, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  checklist: GoalChecklistItem[] | null;
  xpReward: number;
  createdAt: Date;
}

interface GoalChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Stats {
  activeGoals: number;
  achievementsCount: number;
  resumesCount: number;
  pendingTasks: number;
  monthlyXp: Array<{ month: string; xp: number }>;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt: string;
}

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  createdAt: string;
}

// Default stats for when the API doesn't return data
const DEFAULT_STATS: Stats = {
  activeGoals: 0,
  achievementsCount: 0,
  resumesCount: 0,
  pendingTasks: 0,
  monthlyXp: [
    { month: 'Jan', xp: 120 },
    { month: 'Feb', xp: 240 },
    { month: 'Mar', xp: 180 },
    { month: 'Apr', xp: 320 },
    { month: 'May', xp: 290 },
    { month: 'Jun', xp: 450 }
  ]
};

export default function Dashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const isUnivUser = useIsUniversityUser();
  
  // Modal states
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [editGoalModalOpen, setEditGoalModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Get stats data from API
  const { data: statsData } = useQuery<Stats>({
    queryKey: ['/api/users/statistics'],
  });
  
  // Use default stats if data is not available
  const stats: Stats = statsData || DEFAULT_STATS;

  // State to track goals that should be hidden (recently completed)
  // Only track completely hidden goals (after animation completes)
  const [hiddenGoalIds, setHiddenGoalIds] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle when a goal is completed - updated to show in Completed Goals section
  const handleGoalCompletion = (id: number) => {
    // Show confetti for completed goals
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
    
    // Find the completed goal element and apply dissolve effect manually
    const goalElement = document.getElementById(`goal-${id}`);
    if (goalElement) {
      setTimeout(() => {
        // Apply dissolve effect manually to only the completed goal
        goalElement.style.transition = 'all 0.75s ease';
        goalElement.style.opacity = '0';
        goalElement.style.filter = 'blur(4px)';
        goalElement.style.transform = 'scale(0.95)';
        goalElement.style.height = '0';
        goalElement.style.marginBottom = '0';
        goalElement.style.overflow = 'hidden';
      }, 2200);
    }
    
    // Temporarily hide the goal during animation
    setTimeout(() => {
      setHiddenGoalIds(prev => [...prev, id]);
      
      // Then after another short delay, remove it from hidden list
      // so it appears in the Completed Goals section
      setTimeout(() => {
        setHiddenGoalIds(prev => prev.filter(goalId => goalId !== id));
      }, 500);
    }, 3000); // Longer delay to allow for confetti and dissolve animation
  };
  
  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals']
  });
  
  // Auto-dissolve completed goals when goals data changes
  useEffect(() => {
    if (!goals || !Array.isArray(goals)) return;
    
    // Auto-dissolve any completed goals that have all checklist items completed
    goals.forEach((goal: Goal) => {
      if (
        goal.status === 'completed' && 
        goal.checklist && 
        goal.checklist.length > 0 && 
        goal.checklist.every((item: GoalChecklistItem) => item.completed)
      ) {
        // Add a small delay to let the UI render first
        setTimeout(() => {
          handleGoalCompletion(goal.id);
        }, 500);
      }
    });
  }, [goals]);

  // Fetch achievements
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements/user'],
  });

  // Fetch AI coach conversations for preview
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/ai-coach/conversations'],
  });
  
  // States for dashboard AI coach mini-conversation
  const [userQuestion, setUserQuestion] = useState('');
  const [miniCoachMessages, setMiniCoachMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Welcome to CareerQuest! I\'m your AI career coach. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  
  // Function to handle sending a message to the coach
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    
    // Add user's question to the conversation
    const newMessages = [
      ...miniCoachMessages,
      { role: 'user', content: userQuestion.trim() }
    ];
    setMiniCoachMessages(newMessages);
    setUserQuestion('');
    setIsTyping(true);
    
    // Simulate AI response - in a real app, this would call an API
    setTimeout(() => {
      let response = '';
      
      // Simple pattern matching for demo purposes - in real app we'd use the backend
      if (userQuestion.toLowerCase().includes('resume')) {
        response = "For your resume, focus on highlighting relevant skills, quantifiable achievements, and using industry keywords. Make sure your resume is tailored for each job application.";
      } else if (userQuestion.toLowerCase().includes('interview')) {
        response = "To prepare for interviews, research the company, practice common questions, prepare your own questions, and plan your attire. Don't forget to follow up with a thank-you note afterward.";
      } else {
        response = "That's a great question! I'd recommend focusing on continuous learning, networking, and setting SMART goals. Would you like more specific guidance on this topic?";
      }
      
      setMiniCoachMessages([...newMessages, { role: 'assistant', content: response }]);
      setIsTyping(false);
      
      // Scroll to bottom of conversation
      if (conversationRef.current) {
        conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
      }
    }, 1000);
  };
  
  // Auto-scroll conversation to bottom when new messages appear
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [miniCoachMessages]);

  // Calculate next level XP requirement
  const nextLevelXp = 1000;
  const nextRank = user && user.level < 5 
    ? "Career Adventurer" 
    : user && user.level < 10 
      ? "Career Navigator" 
      : "Career Master";

  const handleEditGoal = (id: number) => {
    setSelectedGoalId(id);
    setEditGoalModalOpen(true);
  };

  if (!user || !stats) {
    return <div className="h-full flex items-center justify-center">Loading dashboard data...</div>;
  }
  
  // Animation variants - instant (no animations for smooth adding/removing)
  const fadeIn = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { duration: 0 } }
  };
  
  const subtleUp = {
    hidden: { opacity: 1, y: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0
      } 
    }
  };
  
  const cardAnimation = {
    hidden: { opacity: 1, y: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0
      } 
    }
  };
  
  const staggeredContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  return (
    <motion.div 
      className="container mx-auto"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Global Confetti component for goal completion celebrations */}
      <Confetti active={showConfetti} duration={2000} />
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between mb-6 will-change-opacity will-change-transform"
        variants={subtleUp}
        style={{ transform: 'translateZ(0)' }}
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins">Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {user.name}! Here's your career progress.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Quick Actions
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Quick Actions</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-2 py-4">
                <div 
                  className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => {
                    setCreateGoalModalOpen(true);
                  }}
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Create a Goal</div>
                    <div className="text-xs text-muted-foreground">Track your career objectives</div>
                  </div>
                </div>
                
                <Link href="/resume" className="w-full">
                  <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Create a Resume</div>
                      <div className="text-xs text-muted-foreground">Build a professional resume</div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/cover-letter" className="w-full">
                  <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Mail className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="font-medium">Create a Cover Letter</div>
                      <div className="text-xs text-muted-foreground">Craft a compelling cover letter</div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/interviews?create=true" className="w-full">
                  <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium">Start Interview Process</div>
                      <div className="text-xs text-muted-foreground">Track your job applications</div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/work-history" className="w-full">
                  <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-medium">Add Work History</div>
                      <div className="text-xs text-muted-foreground">Record your work experience</div>
                    </div>
                  </div>
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
      
      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 will-change-opacity"
        variants={staggeredContainer}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <StatCard 
            icon={<Target className="h-5 w-5 text-primary" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
            label="Active Goals"
            value={stats.activeGoals}
            change={{
              type: 'increase',
              text: '2 more than last month'
            }}
          />
        </motion.div>
        
        <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <StatCard 
            icon={<Award className="h-5 w-5 text-[#8bc34a]" />}
            iconBgColor="bg-[#8bc34a]/10"
            iconColor="text-[#8bc34a]"
            label="Achievements"
            value={stats.achievementsCount}
            change={{
              type: 'increase',
              text: '3 new this week'
            }}
          />
        </motion.div>
        
        <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <StatCard 
            icon={<FileText className="h-5 w-5 text-secondary" />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
            label="Resumes"
            value={stats.resumesCount}
            change={{
              type: 'no-change',
              text: 'No change'
            }}
          />
        </motion.div>
        
        <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
          <StatCard 
            icon={<Clock className="h-5 w-5 text-[#ff9800]" />}
            iconBgColor="bg-[#ff9800]/10"
            iconColor="text-[#ff9800]"
            label="Pending Tasks"
            value={stats.pendingTasks}
            change={{
              type: 'increase',
              text: '2 more due this week'
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Current Goals & Today's Recommendations */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 will-change-opacity"
        variants={staggeredContainer}
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* Current Goals */}
        <motion.div 
          className="will-change-transform"
          variants={cardAnimation}
          style={{ transform: 'translateZ(0)' }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-poppins">Career Goals</h2>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => setCreateGoalModalOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Create Goal
                  </Button>
                  <Link href="/goals">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Goals Section */}
              <div>
                <div className="space-y-4">
                  {Array.isArray(goals) && goals.filter((goal: Goal) => goal.status !== 'completed' && !hiddenGoalIds.includes(goal.id)).length > 0 ? (
                    <AnimatePresence mode="sync">
                      {goals
                        .filter((goal: Goal) => goal.status !== 'completed' && !hiddenGoalIds.includes(goal.id))
                        .slice(0, 3)
                        .map((goal: Goal) => (
                          <motion.div
                            key={goal.id}
                            id={`goal-${goal.id}`}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            className="mb-4"
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
                              onComplete={handleGoalCompletion}
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 bg-muted/30 rounded-lg">
                      <Target className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                      <p>No active goals. Create your first career goal!</p>
                      <Button 
                        variant="link" 
                        className="mt-1"
                        onClick={() => setCreateGoalModalOpen(true)}
                      >
                        Create Goal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Today's Recommendations */}
        <motion.div
          variants={cardAnimation}
          className="will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        >
          <Card>
            <CardContent className="p-5">
              {/* Replace static recommendations with the new TodaysRecommendations component */}
              <TodaysRecommendations />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* AI Coach & Level Progress (if university user) - Moved up right after Career Goals */}
      <motion.div 
        className={`grid grid-cols-1 ${isUnivUser ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 mb-6 will-change-opacity`}
        variants={staggeredContainer}
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* AI Coach Preview - Takes up 2/3 width if university user, full width otherwise */}
        <motion.div
          className={`${isUnivUser ? 'lg:col-span-2' : ''} will-change-transform`}
          variants={cardAnimation}
          style={{ transform: 'translateZ(0)' }}
        >
          <Card className="h-full">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-poppins">AI Coach</h2>
                <Link href="/ai-coach">
                  <Button variant="link" className="text-sm text-primary p-0 h-auto">
                    Open Full Coach
                  </Button>
                </Link>
              </div>
              
              {/* Conversation Area */}
              <div 
                ref={conversationRef}
                className="flex-1 min-h-[240px] max-h-[400px] overflow-y-auto mb-4 pr-1 conversation-container"
              >
                {/* Map through all messages */}
                {miniCoachMessages.map((message, index) => (
                  message.role === 'assistant' ? (
                    <Card key={index} className="border border-neutral-200 shadow-none p-3 mb-3">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium">Career Coach</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div key={index} className="pl-11 pr-1 mb-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-sm relative">
                        <p>{message.content}</p>
                      </div>
                    </div>
                  )
                ))}
                
                {/* Show typing indicator */}
                {isTyping && (
                  <Card className="border border-neutral-200 shadow-none p-3 mb-3">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Career Coach</p>
                        <div className="flex space-x-1 mt-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="mt-auto">
                <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                  <Input
                    type="text"
                    placeholder="Ask me anything about your career..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-none"
                    disabled={isTyping || !userQuestion.trim()}
                  >
                    <Send className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Level Progress - Takes up 1/3 width - only for university users */}
        {isUnivUser && (
          <motion.div
            variants={cardAnimation}
            className="will-change-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            <Card className="h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold font-poppins">Your Level</h2>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1">
                  <LevelProgress 
                    level={user.level || 1}
                    xp={user.xp || 0}
                    nextLevelXp={nextLevelXp}
                    rank={user.rank || 'Career Novice'}
                    nextRank={nextRank}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
      
      {/* Career Journey Chart & Recent Achievements - Only for university users */}
      {isUnivUser && (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 will-change-opacity"
          variants={staggeredContainer}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Career Journey - Takes up 2/3 width */}
          <motion.div
            className="lg:col-span-2 will-change-transform"
            variants={cardAnimation}
            style={{ transform: 'translateZ(0)' }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold font-poppins">Career Journey</h2>
                  <p className="text-xs text-neutral-500">Your XP growth over time</p>
                </div>
                
                <div className="h-[300px]">
                  <CareerJourneyChart data={stats.monthlyXp} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Recent Achievements - Takes up 1/3 width */}
          <motion.div
            variants={cardAnimation}
            className="will-change-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold font-poppins">Recent Achievements</h2>
                </div>
                
                <div className="space-y-4">
                  {Array.isArray(achievements) && achievements.length > 0 ? (
                    achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-neutral-500">{achievement.description}</p>
                          <p className="text-xs text-primary mt-1">+{achievement.xpReward} XP</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Award className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                      <p>No achievements yet. Complete goals to earn rewards!</p>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Link href="/achievements">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Achievements
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
      
      {/* Modals */}
      {createGoalModalOpen && (
        <CreateGoalModal 
          isOpen={createGoalModalOpen} 
          onClose={() => setCreateGoalModalOpen(false)} 
        />
      )}
      
      {editGoalModalOpen && selectedGoalId && (
        <EditGoalModal 
          isOpen={editGoalModalOpen} 
          onClose={() => setEditGoalModalOpen(false)}
          goalId={selectedGoalId}
          goals={Array.isArray(goals) ? goals : []}
        />
      )}
    </motion.div>
  );
}