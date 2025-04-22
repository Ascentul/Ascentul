import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProfileImageUploader from './ProfileImageUploader';
import { motion, AnimatePresence } from 'framer-motion';
import ascentulLogo from '@/assets/ascentul-logo.png';
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
  GitBranch,
  Linkedin,
  FolderGit2,
  Search,
  ChevronRight,
  LineChart,
  ClipboardList,
  Clock,
  Building,
  Calendar,
  FileEdit,
  PanelLeft,
  PanelRight,
  ChevronsLeft,
  Menu,
  User as UserIcon
} from 'lucide-react';

// Sidebar section types
type SidebarSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  href?: string;
}

type SidebarItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  pro?: boolean;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, updateUser, updateProfile, refetch } = useUser();
  const isUnivUser = useIsUniversityUser();
  const isAdmin = useIsAdminUser();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(
    localStorage.getItem('sidebarExpanded') !== 'false'
  );
  const [menuPositions, setMenuPositions] = useState<Record<string, number>>({});
  
  // Update menu positions when active section changes
  useEffect(() => {
    if (!expanded && activeSection) {
      const element = document.querySelector(`[data-section-id="${activeSection}"]`) as HTMLElement;
      if (element) {
        setMenuPositions(prev => ({
          ...prev,
          [activeSection]: element.getBoundingClientRect().top
        }));
      }
    }
  }, [activeSection, expanded]);
  
  // Handle click outside for collapsed sidebar popup menus
  useEffect(() => {
    if (!expanded && activeSection) {
      const handleClickOutside = (event: MouseEvent) => {
        // Check if the click is outside the sidebar and the active popup
        const sidebar = sidebarRef.current;
        const popup = document.querySelector(`.popup-menu-${activeSection}`);
        
        if (sidebar && popup && 
            !sidebar.contains(event.target as Node) && 
            !popup.contains(event.target as Node)) {
          setActiveSection(null);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [expanded, activeSection]);
  
  // Auto-detect the current section based on location
  useEffect(() => {
    if (location.startsWith('/interview') || location.startsWith('/resume') || location.startsWith('/cover-letter') || location.startsWith('/linkedin-optimizer') || location.startsWith('/apply')) {
      setActiveSection('job-search');
    } else if (location.startsWith('/goals') || location.startsWith('/ai-coach') || location.startsWith('/career-path') || location.startsWith('/skill-stacker')) {
      setActiveSection('career-growth');
    } else if (location.startsWith('/projects')) {
      setActiveSection('portfolio');
    } else if (location.startsWith('/exit-plan') || location.startsWith('/momentum-coach') || location.startsWith('/weekly-recap')) {
      setActiveSection('planning');
    } else {
      setActiveSection(null);
    }
  }, [location]);
  
  // Toggle sidebar expanded state
  const toggleSidebar = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem('sidebarExpanded', newState.toString());
  };

  if (!user) return null;

  // Calculate XP progress percentage - only for university users
  let progressPercentage = 0;
  
  if (isUnivUser && user.xp !== undefined && user.level !== undefined) {
    const xpToNextLevel = 1000; // For simplicity, each level requires 1000 XP
    const currentLevelBaseXP = ((user.level || 1) - 1) * xpToNextLevel;
    const xpInCurrentLevel = (user.xp || 0) - currentLevelBaseXP;
    progressPercentage = Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100);
  }

  // The main navigation items
  const sidebarSections: SidebarSection[] = [
    {
      id: 'job-search',
      title: 'Job Search',
      icon: <Search className="w-5 h-5" />,
      items: [
        { href: '/apply', icon: <FileEdit className="w-5 h-5 mr-3" />, label: 'Application Agent' },
        { href: '/interviews', icon: <Briefcase className="w-5 h-5 mr-3" />, label: 'Application Tracker' },
        { href: '/contacts', icon: <UserRound className="w-5 h-5 mr-3" />, label: 'Ascentul CRM' },
      ]
    },
    {
      id: 'career-growth',
      title: 'Career Growth',
      icon: <LineChart className="w-5 h-5" />,
      items: [
        { href: '/goals', icon: <Target className="w-5 h-5 mr-3" />, label: 'Career Goal Tracker' },
        { href: '/skill-stacker', icon: <ClipboardList className="w-5 h-5 mr-3" />, label: 'Skill Stacker', pro: true },
        { href: '/career-path-explorer', icon: <GitBranch className="w-5 h-5 mr-3" />, label: 'Career Path Explorer' },
        { href: '/ai-coach', icon: <Bot className="w-5 h-5 mr-3" />, label: 'AI Career Coach' },
      ]
    },
    // Removed Career Profile button - now integrated into Account page
    {
      id: 'portfolio',
      title: 'Portfolio & Assets',
      icon: <FolderGit2 className="w-5 h-5" />,
      items: [
        { href: '/projects', icon: <FolderGit2 className="w-5 h-5 mr-3" />, label: 'Project Portfolio' },
        { href: '/resume', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Resume Builder' },
        { href: '/cover-letter', icon: <Mail className="w-5 h-5 mr-3" />, label: 'Cover Letter Coach' },
        { href: '/linkedin-optimizer', icon: <Linkedin className="w-5 h-5 mr-3" />, label: 'LinkedIn Optimizer' },
      ]
    },
    {
      id: 'planning',
      title: 'Planning & Transitions',
      icon: <Calendar className="w-5 h-5" />,
      items: [
        { href: '/exit-plan', icon: <Clock className="w-5 h-5 mr-3" />, label: 'Exit Plan', pro: true },
        { href: '/momentum-coach', icon: <Target className="w-5 h-5 mr-3" />, label: 'Momentum Coach' },
        { href: '/weekly-recap', icon: <ClipboardList className="w-5 h-5 mr-3" />, label: 'Weekly Recap / Journal' },
      ]
    }
  ];

  // Dashboard link - always visible
  const dashboardLink = { 
    href: '/career-dashboard', 
    icon: <LayoutDashboard className="w-5 h-5 mr-3" />, 
    label: 'Dashboard'
  };

  return (
    <div 
      ref={sidebarRef}
      className={`hidden md:flex flex-col transition-all duration-300 ease-in-out bg-white shadow-md z-30 ${expanded ? 'w-64' : 'w-16'}`} 
      data-expanded={expanded ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between h-16 border-b px-3">
        {expanded && (
          <img src={ascentulLogo} alt="Ascentul" className="h-6 ml-2" />
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar} 
          className="ml-auto"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <PanelLeft size={18} /> : <PanelRight size={18} />}
        </Button>
      </div>
      
      {/* User Profile Summary */}
      <div className="flex flex-col items-center py-6 border-b">
        <div className="relative">
          <ProfileImageUploader
            onImageUploaded={async (imageUrl) => {
              console.log("Image uploaded, URL:", imageUrl);
              
              // We won't use the ProfileImageUploader component's built-in update
              // Instead, we'll handle everything here in the callback for better control
              
              try {
                // First make a direct call to update the user profile with this URL
                const profileUpdateResponse = await fetch('/api/users/profile', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    profileImage: imageUrl
                  }),
                });
                
                if (!profileUpdateResponse.ok) {
                  throw new Error('Failed to update profile with new image');
                }
                
                const updatedUserData = await profileUpdateResponse.json();
                console.log("Profile successfully updated:", updatedUserData);
                
                // Update local state
                updateUser({
                  ...user,
                  profileImage: imageUrl
                });
                
                // Force a cache invalidation by fetching the user data again
                // We don't have direct access to refetchUser here
                
                // Short delay to ensure everything is updated before reload
                setTimeout(() => {
                  window.location.reload();
                }, 750);
              } catch (error) {
                console.error("Error updating profile with image:", error);
                alert("Your image was uploaded but we couldn't update your profile. Please try again or contact support.");
              }
            }}
            currentImage={user.profileImage}
          >
            <Avatar className={`border-2 border-primary cursor-pointer hover:opacity-90 transition-opacity ${expanded ? 'w-16 h-16' : 'w-10 h-10'}`}>
              {user.profileImage ? (
                <AvatarImage 
                  src={`${user.profileImage}?v=${new Date().getTime()}`} 
                  alt={user.name} 
                  onError={(e) => {
                    console.log("Error loading image, falling back to text");
                    // Hide the broken image icon
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          </ProfileImageUploader>
          {/* Only show level badge for university users */}
          {isUnivUser && user.level !== undefined && expanded && (
            <div className="absolute -top-1 -right-1 bg-[#8bc34a] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {user.level}
            </div>
          )}
        </div>
        
        {expanded && (
          <>
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
          </>
        )}
      </div>
      
      {/* Navigation with four main sections */}
      <nav className="flex-1 overflow-hidden py-4 flex flex-col">
        {/* Dashboard link is always visible */}
        <Link
          href={dashboardLink.href}
          className={`flex items-center ${expanded ? 'px-6' : 'px-3 justify-center'} py-3 text-sm transition-colors hover:bg-primary/5
            ${location === dashboardLink.href ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
          title={!expanded ? dashboardLink.label : undefined}
        >
          <div className={expanded ? 'mr-3' : ''}>
            {dashboardLink.icon}
          </div>
          {expanded && dashboardLink.label}
        </Link>

        <div className={`mt-3 ${expanded ? 'px-3' : 'px-0'}`}>
          {expanded && (
            <div className="text-xs font-medium text-neutral-400 uppercase mb-2 px-3">
              Features
            </div>
          )}
          
          {/* Four main sections with flyout animation */}
          <div className="space-y-1">
            {sidebarSections.map((section) => (
              <div key={section.id} className="relative">
                {/* Section header */}
                {section.href ? (
                  <Link
                    href={section.href}
                    data-section-id={section.id}
                    className={`w-full flex items-center ${expanded ? 'justify-between' : 'justify-center'} rounded-md ${expanded ? 'px-3' : 'px-2'} py-2 text-sm transition-colors
                      ${location === section.href ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'}`}
                    onMouseEnter={() => setHoverSection(section.id)}
                    onMouseLeave={() => setHoverSection(null)}
                    title={!expanded ? section.title : undefined}
                  >
                    <div className="flex items-center">
                      <span className={expanded ? 'mr-3' : ''}>{section.icon}</span>
                      {expanded && <span>{section.title}</span>}
                    </div>
                    {expanded && section.items.length > 0 && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Link>
                ) : (
                  <button
                    data-section-id={section.id}
                    className={`w-full flex items-center ${expanded ? 'justify-between' : 'justify-center'} rounded-md ${expanded ? 'px-3' : 'px-2'} py-2 text-sm transition-colors
                      ${activeSection === section.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'}`}
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    onMouseEnter={() => setHoverSection(section.id)}
                    onMouseLeave={() => setHoverSection(null)}
                    title={!expanded ? section.title : undefined}
                  >
                    <div className="flex items-center">
                      <span className={expanded ? 'mr-3' : ''}>{section.icon}</span>
                      {expanded && <span>{section.title}</span>}
                    </div>
                    {expanded && (
                      <motion.div
                        animate={{ rotate: activeSection === section.id ? 0 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeSection === section.id ? 
                          <ChevronRight className="w-4 h-4 transform rotate-90" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </motion.div>
                    )}
                  </button>
                )}
                
                {/* Flyout content - only show in expanded mode or as popup in collapsed mode */}
                <AnimatePresence>
                  {activeSection === section.id && expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pl-7 pb-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors my-1
                              ${location === item.href ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'}`}
                          >
                            <div className="flex items-center">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            {item.pro && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-medium">
                                PRO
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Popup menu for collapsed mode */}
                  {!expanded && activeSection === section.id && (
                    <div className={`popup-menu-${section.id} fixed left-16 top-auto mt-0 bg-white rounded-md shadow-md z-50 min-w-64 border overflow-hidden`}
                         style={{ top: `${menuPositions[section.id] || 0}px` }}
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 font-medium border-b mb-1 flex items-center">
                          {section.icon}
                          <span className="ml-2">{section.title}</span>
                        </div>
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/5
                              ${location === item.href ? 'bg-primary/10 text-primary' : ''}`}
                          >
                            <div className="flex items-center">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            {item.pro && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-medium ml-2">
                                PRO
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        
        {/* University Quick Access - only show for university users */}
        {isUnivUser && (
          <div className={`mt-4 ${expanded ? 'px-6' : 'px-2'}`}>
            {expanded && (
              <div className="text-xs font-medium text-neutral-400 uppercase mb-2">
                University Resources
              </div>
            )}
            
            <Link 
              href="/university-dashboard"
              className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university-dashboard" || location === "/university" ? 'text-primary bg-primary/10' : ''}`}
              title={!expanded ? 'University Dashboard' : undefined}
            >
              <School className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
              {expanded && 'University Dashboard'}
            </Link>
            
            <Link 
              href="/university/study-plan"
              className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university/study-plan" ? 'text-primary bg-primary/10' : ''}`}
              title={!expanded ? 'Study Plan' : undefined}
            >
              <Target className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
              {expanded && 'Study Plan'}
            </Link>
            
            <Link 
              href="/university/learning"
              className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md
                ${location === "/university/learning" ? 'text-primary bg-primary/10' : ''}`}
              title={!expanded ? 'Learning Modules' : undefined}
            >
              <BookOpen className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
              {expanded && 'Learning Modules'}
            </Link>
          </div>
        )}
        
        {/* Spacer to push settings to bottom */}
        <div className="flex-1"></div>
      </nav>
      
      {/* Admin Dashboard - only show for admin users */}
      {isAdmin && (
        <div className="border-t py-2">
          {expanded && (
            <div className="px-6 py-2 text-xs font-medium text-neutral-400 uppercase">
              Administration
            </div>
          )}
          <Link 
            href="/admin-dashboard"
            className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md ${expanded ? 'mx-3' : 'mx-1'}
              ${location.startsWith("/admin") || location === "/admin-dashboard" ? 'text-primary bg-primary/10' : ''}`}
            title={!expanded ? 'Admin Dashboard' : undefined}
          >
            <ShieldCheck className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
            {expanded && 'Admin Dashboard'}
          </Link>
        </div>
      )}
      
      {/* Settings */}
      <div className="border-t py-4">
        <a 
          href="/account" 
          className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'}`}
          title={!expanded ? 'Account Settings' : undefined}
        >
          <Settings className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
          {expanded && 'Account Settings'}
        </a>
        <button 
          className={`flex items-center ${expanded ? 'px-6 text-left' : 'px-2 justify-center'} py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full rounded-md ${expanded ? 'mx-3' : 'mx-1'}`}
          onClick={() => logout()}
          title={!expanded ? 'Logout' : undefined}
        >
          <LogOut className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
          {expanded && 'Logout'}
        </button>
      </div>
    </div>
  );
}
