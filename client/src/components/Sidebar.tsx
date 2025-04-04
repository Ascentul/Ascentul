import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser } from '@/lib/useUserData';
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
  School,
  ShieldCheck,
  GitBranch
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const isUnivUser = useIsUniversityUser();
  const isAdmin = useIsAdminUser();

  if (!user) return null;

  // Calculate XP progress percentage - only for university users
  let progressPercentage = 0;
  
  if (isUnivUser && user.xp !== undefined && user.level !== undefined) {
    const xpToNextLevel = 1000; // For simplicity, each level requires 1000 XP
    const currentLevelBaseXP = ((user.level || 1) - 1) * xpToNextLevel;
    const xpInCurrentLevel = (user.xp || 0) - currentLevelBaseXP;
    progressPercentage = Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100);
  }

  // Career app navigation items
  const careerNavigationItems = [
    { href: '/career-dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" />, label: 'Dashboard' },
    { href: '/goals', icon: <Target className="w-5 h-5 mr-3" />, label: 'Career Goals' },
    { href: '/interviews', icon: <UserRound className="w-5 h-5 mr-3" />, label: 'Interview Tracker' },
    { href: '/resume', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Resume Builder' },
    { href: '/cover-letter', icon: <Mail className="w-5 h-5 mr-3" />, label: 'Cover Letters' },
    { href: '/ai-coach', icon: <Bot className="w-5 h-5 mr-3" />, label: 'AI Coach' },
    { href: '/career-path-explorer', icon: <GitBranch className="w-5 h-5 mr-3" />, label: 'Career Path Explorer' },
    { href: '/work-history', icon: <Briefcase className="w-5 h-5 mr-3" />, label: 'Work History' },
    { href: '/achievements', icon: <Trophy className="w-5 h-5 mr-3" />, label: 'Achievements' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white shadow-md z-10">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary font-poppins">CareerTracker.io</h1>
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
          {/* Only show level badge for university users */}
          {isUnivUser && user.level !== undefined && (
            <div className="absolute -top-1 -right-1 bg-[#8bc34a] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {user.level}
            </div>
          )}
        </div>
        <h2 className="mt-3 font-medium text-lg">{user.name}</h2>
        
        {/* Only show rank for university users */}
        {isUnivUser && user.rank && (
          <div className="mt-1 text-sm text-neutral-400">{user.rank}</div>
        )}
        
        {/* XP Progress - only show for university users */}
        {isUnivUser && user.xp !== undefined && user.level !== undefined && (
          <div className="mt-3 w-full px-6">
            <div className="flex justify-between text-xs mb-1">
              <span>Level {user.level}</span>
              <span>{user.xp} XP</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        {/* University user badge - only show for university users */}
        {isUnivUser && (
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
        {isUnivUser && (
          <>
            <div className="px-6 py-3 mt-4 text-xs font-medium text-neutral-400 uppercase">
              University Resources
            </div>
            
            <Link 
              href="/university-dashboard"
              className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
                ${location === "/university-dashboard" || location === "/university" ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
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
      
      {/* Admin Dashboard - only show for admin users */}
      {isAdmin && (
        <div className="border-t py-2">
          <div className="px-6 py-2 text-xs font-medium text-neutral-400 uppercase">
            Administration
          </div>
          <Link 
            href="/admin-dashboard"
            className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
              ${location.startsWith("/admin") || location === "/admin-dashboard" ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
          >
            <ShieldCheck className="w-5 h-5 mr-3" />
            Admin Dashboard
          </Link>
        </div>
      )}
      
      {/* Settings */}
      <div className="border-t py-4">
        <a href="/account" className="flex items-center px-6 py-3 text-sm hover:bg-primary/5 transition-colors cursor-pointer">
          <Settings className="w-5 h-5 mr-3" />
          Account Settings
        </a>
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
