import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import StatCard from '@/components/StatCard';
import CareerJourneyChart from '@/components/CareerJourneyChart';
import LevelProgress from '@/components/LevelProgress';
import GoalCard from '@/components/GoalCard';
import AchievementBadge from '@/components/AchievementBadge';
import { Target, Award, FileText, Clock, Plus, Bot, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Define types for our data outside the component
interface Stats {
  activeGoals: number;
  achievementsCount: number;
  resumesCount: number;
  pendingTasks: number;
  monthlyXp: Array<{ month: string; xp: number }>;
}

interface Goal {
  id: number;
  title: string;
  description?: string;
  progress: number;
  status: string;
  dueDate?: string;
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

  // Fetch achievements
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements/user'],
  });

  // Fetch AI coach conversations for preview
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/ai-coach/conversations'],
  });

  // Calculate next level XP requirement
  const nextLevelXp = 1000;
  const nextRank = user && user.level < 5 
    ? "Career Adventurer" 
    : user && user.level < 10 
      ? "Career Navigator" 
      : "Career Master";

  const handleEditGoal = (id: number) => {
    setSelectedGoalId(id);
    // In a real app, this would open a modal or navigate to edit page
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
          <Link href="/goals">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </Link>
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
                <Link href="/goals">
                  <Button variant="link" className="text-sm text-primary p-0 h-auto">
                    View All
                  </Button>
                </Link>
              </div>
              
              {/* Goals List */}
              <div className="space-y-4">
                {goals && goals.length > 0 ? (
                  goals.slice(0, 3).map((goal) => (
                    <GoalCard
                      key={goal.id}
                      id={goal.id}
                      title={goal.title}
                      description={goal.description || ''}
                      progress={goal.progress}
                      status={goal.status}
                      dueDate={goal.dueDate ? new Date(goal.dueDate) : undefined}
                      onEdit={handleEditGoal}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Target className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                    <p>No goals yet. Create your first career goal!</p>
                    <Link href="/goals">
                      <Button variant="link" className="mt-2">Create Goal</Button>
                    </Link>
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
                    Open Coach
                  </Button>
                </Link>
              </div>
              
              {conversations && conversations[0] ? (
                <Card className="border border-neutral-200 shadow-none p-3 mb-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium">Career Coach</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        I noticed you're making good progress on your LinkedIn profile goal. Would you like some tips to make your profile stand out?
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border border-neutral-200 shadow-none p-3 mb-4 flex-1">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium">Career Coach</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Welcome to CareerQuest! I'm your AI career coach. How can I help you today?
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              
              <div className="mt-auto">
                <Link href="/ai-coach">
                  <Button className="w-full">
                    Ask Career Question
                  </Button>
                </Link>
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
    </motion.div>
  );
}
