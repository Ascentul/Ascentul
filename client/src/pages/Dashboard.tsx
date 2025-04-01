import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import StatCard from '@/components/StatCard';
import CareerJourneyChart from '@/components/CareerJourneyChart';
import LevelProgress from '@/components/LevelProgress';
import GoalCard from '@/components/GoalCard';
import AchievementBadge from '@/components/AchievementBadge';
import CreateGoalModal from '@/components/modals/CreateGoalModal';
import EditGoalModal from '@/components/modals/EditGoalModal';

import { 
  Target, Award, FileText, Clock, Plus, Bot, CheckCircle, Send,
  Briefcase, Mail, Users, Eye
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
import { motion } from 'framer-motion';
import { type Goal, type GoalChecklistItem } from '@shared/schema';

// Define types for our data outside the component
interface Stats {
  activeGoals: number;
  achievementsCount: number;
  resumesCount: number;
  pendingTasks: number;
  monthlyXp: Array<{ month: string; xp: number }>;
}

// We're importing the proper Goal type from schema.ts now, no need for this interface
// This is only kept for reference
/*
interface Goal {
  id: number;
  title: string;
  description?: string;
  progress: number;
  status: string;
  dueDate?: string;
  checklist?: GoalChecklistItem[];
}
*/

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

// Default values
const DEFAULT_STATS: Stats = {
  activeGoals: 0,
  achievementsCount: 0,
  resumesCount: 0,
  pendingTasks: 0,
  monthlyXp: []
};

export default function Dashboard() {
  const { user } = useUser();
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  
  // Modal states
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [editGoalModalOpen, setEditGoalModalOpen] = useState(false);

  // Fetch user statistics
  const { data: statsData } = useQuery<Stats>({
    queryKey: ['/api/users/statistics'],
  });
  
  // Use default stats if data is not available
  const stats: Stats = statsData || DEFAULT_STATS;

  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });
  
  // State to track goals that should be hidden (recently completed)
  const [hiddenGoalIds, setHiddenGoalIds] = useState<number[]>([]);

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

  // Handle when a goal is completed
  const handleGoalCompletion = (id: number) => {
    // Wait for confetti animation to complete before hiding the goal
    setTimeout(() => {
      setHiddenGoalIds(prev => [...prev, id]);
    }, 3500); // Wait a bit longer than the confetti duration (3000ms)
  };

  const handleEditGoal = (id: number) => {
    setSelectedGoalId(id);
    setEditGoalModalOpen(true);
  };

  if (!user || !stats) {
    return <div className="h-full flex items-center justify-center">Loading dashboard data...</div>;
  }
  
  // Animation variants - optimized for performance
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
  };
  
  const subtleUp = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      } 
    }
  };
  
  const cardAnimation = {
    hidden: { opacity: 0, y: 4 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      } 
    }
  };
  
  const staggeredContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
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
                <h2 className="text-lg font-semibold font-poppins">Current Goals</h2>
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
              
              {/* Goals List */}
              <div className="space-y-4">
                {goals && goals.length > 0 ? (
                  goals
                    .filter(goal => !hiddenGoalIds.includes(goal.id)) // Filter out hidden goals
                    .slice(0, 3)
                    .map((goal) => (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.5 } }}
                        className="transition-all duration-500"
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
                    ))
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Target className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                    <p>No goals yet. Create your first career goal!</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setCreateGoalModalOpen(true)}
                    >
                      Create Goal
                    </Button>
                  </div>
                )}
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
              <div className="mb-4">
                <h2 className="text-lg font-semibold font-poppins">Today's Recommendations</h2>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start bg-background p-3 rounded-lg border border-border">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Complete the Python course section on data structures</span>
                </li>
                <li className="flex items-start bg-background p-3 rounded-lg border border-border">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Practice 2 interview questions in the system design category</span>
                </li>
                <li className="flex items-start bg-background p-3 rounded-lg border border-border">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Update your work experience section with quantifiable achievements</span>
                </li>
                <li className="flex items-start bg-background p-3 rounded-lg border border-border">
                  <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Review feedback from your last mock interview session</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* AI Coach & Level Progress */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 will-change-opacity"
        variants={staggeredContainer}
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* AI Coach Preview - Takes up 2/3 width */}
        <motion.div
          className="lg:col-span-2 will-change-transform"
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
                        <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border">
                          <div className="text-xs text-primary font-medium">You</div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
                
                {/* Loading indicator */}
                {isTyping && (
                  <Card className="border border-neutral-200 shadow-none p-3 mb-3">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex space-x-1 items-center">
                          <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              
              {/* Input Area */}
              <div className="mt-auto relative">
                <form className="relative" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Ask your career question..." 
                    className="w-full rounded-md border border-border bg-background px-4 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    disabled={isTyping}
                  />
                  <button 
                    type="submit" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary p-1.5 text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!userQuestion.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  For more in-depth coaching, open the <Link href="/ai-coach" className="text-primary hover:underline">full AI Coach</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Level Progress - Takes up 1/3 width */}
        <motion.div 
          variants={cardAnimation}
          className="will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        >
          <LevelProgress 
            level={user.level}
            xp={user.xp}
            nextLevelXp={nextLevelXp}
            rank={user.rank}
            nextRank={nextRank}
          />
        </motion.div>
      </motion.div>
      
      {/* Recent Achievements */}
      <motion.div 
        className="mt-6 will-change-opacity"
        variants={subtleUp}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold font-poppins">Recent Achievements</h2>
          <Link href="/achievements">
            <Button variant="link" className="text-sm text-primary p-0 h-auto">
              View All
            </Button>
          </Link>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          variants={staggeredContainer}
        >
          {achievements && achievements.length > 0 ? (
            achievements.slice(0, 4).map((achievement) => (
              <motion.div 
                key={achievement.id}
                variants={cardAnimation}
                className="will-change-transform"
                style={{ transform: 'translateZ(0)' }}
              >
                <AchievementBadge 
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.icon}
                  xpReward={achievement.xpReward}
                  unlocked={true}
                  earnedAt={new Date(achievement.earnedAt)}
                />
              </motion.div>
            ))
          ) : (
            <>
              <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
                <AchievementBadge 
                  name="First Resume"
                  description="Created your first resume"
                  icon="rocket"
                  xpReward={100}
                  unlocked={true}
                  earnedAt={new Date()}
                />
              </motion.div>
              <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
                <AchievementBadge 
                  name="Goal Setter"
                  description="Set 5 career goals"
                  icon="target"
                  xpReward={150}
                  unlocked={true}
                  earnedAt={new Date()}
                />
              </motion.div>
              <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
                <AchievementBadge 
                  name="Skill Builder"
                  description="Added 10+ skills"
                  icon="graduation-cap"
                  xpReward={200}
                  unlocked={true}
                  earnedAt={new Date()}
                />
              </motion.div>
              <motion.div variants={cardAnimation} className="will-change-transform" style={{ transform: 'translateZ(0)' }}>
                <AchievementBadge 
                  name="Job Master"
                  description="Apply to 10 jobs"
                  icon="briefcase"
                  xpReward={300}
                  unlocked={false}
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
      
      {/* Goal Modals */}
      <CreateGoalModal 
        isOpen={createGoalModalOpen}
        onClose={() => setCreateGoalModalOpen(false)}
      />
      <EditGoalModal 
        isOpen={editGoalModalOpen}
        onClose={() => setEditGoalModalOpen(false)}
        goalId={selectedGoalId}
        goals={goals}
      />
    </motion.div>
  );
}
