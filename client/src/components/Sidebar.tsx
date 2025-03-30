import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Mail, 
  UserRound, 
  Briefcase, 
  Trophy, 
  Bot, 
  Settings, 
  LogOut,
  GraduationCap,
  BookOpen,
  School
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const isUniversityUser = user?.userType === 'university_student' || user?.userType === 'university_admin';

  if (!user) return null;

  // Calculate XP progress percentage
  const xpToNextLevel = 1000; // For simplicity, each level requires 1000 XP
  const currentLevelBaseXP = (user.level - 1) * xpToNextLevel;
  const xpInCurrentLevel = user.xp - currentLevelBaseXP;
  const progressPercentage = Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100);

  // Career app navigation items
  const careerNavigationItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" />, label: 'Dashboard' },
    { href: '/goals', icon: <Target className="w-5 h-5 mr-3" />, label: 'Career Goals' },
    { href: '/resume', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Resume Builder' },
    { href: '/cover-letter', icon: <Mail className="w-5 h-5 mr-3" />, label: 'Cover Letters' },
    { href: '/interviews', icon: <UserRound className="w-5 h-5 mr-3" />, label: 'Interview Prep' },
    { href: '/work-history', icon: <Briefcase className="w-5 h-5 mr-3" />, label: 'Work History' },
    { href: '/achievements', icon: <Trophy className="w-5 h-5 mr-3" />, label: 'Achievements' },
    { href: '/ai-coach', icon: <Bot className="w-5 h-5 mr-3" />, label: 'AI Coach' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white shadow-md z-10">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary font-poppins">CareerQuest</h1>
      </div>
      
      {/* User Profile Summary */}
      <div className="flex flex-col items-center py-6 border-b">
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-primary">
            {user.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute -top-1 -right-1 bg-[#8bc34a] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {user.level}
          </div>
        </div>
        <h2 className="mt-3 font-medium text-lg">{user.name}</h2>
        <div className="mt-1 text-sm text-neutral-400">{user.rank}</div>
        
        {/* XP Progress */}
        <div className="mt-3 w-full px-6">
          <div className="flex justify-between text-xs mb-1">
            <span>Level {user.level}</span>
            <span>{user.xp} XP</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* University user badge - only show for university users */}
        {isUniversityUser && (
          <div className="mt-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center">
            <GraduationCap className="w-3 h-3 mr-1" />
            University User
          </div>
        )}
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Career App Navigation Items */}
        {careerNavigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
              ${location === item.href ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        
        {/* University Quick Access - only show for university users */}
        {isUniversityUser && (
          <>
            <div className="px-6 py-3 mt-4 text-xs font-medium text-neutral-400 uppercase">
              University Resources
            </div>
            
            <Link 
              href="/university"
              className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
                ${location === "/university" ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
            >
              <School className="w-5 h-5 mr-3" />
              University Dashboard
            </Link>
            
            <Link 
              href="/university/study-plan"
              className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
                ${location === "/university/study-plan" ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
            >
              <Target className="w-5 h-5 mr-3" />
              Study Plan
            </Link>
            
            <Link 
              href="/university/learning"
              className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
                ${location === "/university/learning" ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Learning Modules
            </Link>
          </>
        )}
      </nav>
      
      {/* Settings */}
      <div className="border-t py-4">
        <Link href="/settings" className="flex items-center px-6 py-3 text-sm hover:bg-primary/5 transition-colors">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
        <button 
          className="flex items-center px-6 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
