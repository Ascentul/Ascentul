import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  BarChart,
  ClipboardList,
  Clock,
  Building,
  Calendar,
  FileEdit,
  PanelLeft,
  PanelRight,
  ChevronsLeft,
  Menu,
  User as UserIcon,
  Mic,
  HelpCircle,
  Bell
} from 'lucide-react';

// Sidebar section types
type SidebarSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: SidebarItem[];
  href?: string;
}

type SidebarItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  pro?: boolean;
}

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps = {}) {
  const [location] = useLocation();
  const { user, logout, updateUser, updateProfile, uploadProfileImage } = useUser();
  const isUnivUser = useIsUniversityUser();
  const isAdmin = useIsAdminUser();
  // Check if user is on free plan and not a university admin
  const isFreeUser = user?.planType === 'free' && user?.role !== 'university_admin';
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(
    localStorage.getItem('sidebarExpanded') !== 'false'
  );
  const [menuPositions, setMenuPositions] = useState<Record<string, number>>({});
  
  // Support ticket related state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('Other'); // Default issue type
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notifications related state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
    if (location.startsWith('/application-tracker') || location.startsWith('/apply')) {
      setActiveSection('job-search');
    } else if (location.startsWith('/goals') || location.startsWith('/career-path') || location.startsWith('/contacts')) {
      setActiveSection('career-growth');
    } else if (location.startsWith('/projects') || location.startsWith('/resume') || location.startsWith('/cover-letter')) {
      setActiveSection('portfolio');
    } else if (location.startsWith('/ai-coach')) {
      setActiveSection('ai-coach');
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
  
  // Fetch notifications when modal opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Fetch notifications function
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      
      // Optionally mark them as read
      await fetch('/api/notifications/mark-read', { method: 'POST' });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle support ticket submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !description) {
      alert('Please fill out all required fields');
      return;
    }
    
    if (!user) {
      alert('You must be logged in to submit a support ticket');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/support-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          description,
          userId: user?.id,
          userEmail: user?.email,
          source: 'in-app',
          issueType: issueType,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        alert('Support ticket submitted successfully!');
        setShowSupportModal(false);
        setSubject('');
        setDescription('');
        setIssueType('Other');
      } else {
        alert('There was an issue submitting your ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('An error occurred while submitting your ticket. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
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
        { href: '/application-tracker', icon: <Briefcase className="w-5 h-5 mr-3" />, label: 'Application Tracker' },
      ]
    },
    {
      id: 'career-growth',
      title: 'Career Growth',
      icon: <LineChart className="w-5 h-5" />,
      items: [
        { href: '/goals', icon: <Target className="w-5 h-5 mr-3" />, label: 'Career Goal Tracker' },
        { href: '/career-path-explorer', icon: <GitBranch className="w-5 h-5 mr-3" />, label: 'Career Path Explorer' },
        { href: '/contacts', icon: <UserRound className="w-5 h-5 mr-3" />, label: 'Network Hub' },
      ]
    },
    // Removed Career Profile button - now integrated into Account page
    {
      id: 'portfolio',
      title: 'Portfolio & Assets',
      icon: <FolderGit2 className="w-5 h-5" />,
      items: [
        { href: '/projects', icon: <FolderGit2 className="w-5 h-5 mr-3" />, label: 'Project Portfolio' },
        { href: '/resume', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Resume Studio' },
        { href: '/cover-letter', icon: <Mail className="w-5 h-5 mr-3" />, label: 'Cover Letter Coach' },

      ]
    },
    {
      id: 'ai-coach',
      title: 'AI Career Coach',
      icon: <Bot className="w-5 h-5" />,
      href: '/ai-coach',
    },
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
      className={`flex-col transition-all duration-300 ease-in-out bg-white shadow-md z-30 
        ${expanded ? 'w-64' : 'w-16'} 
        ${isOpen ? 'flex fixed inset-y-0 left-0 md:relative' : 'hidden md:flex'}`} 
      data-expanded={expanded ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between h-16 border-b px-3">
        {expanded && (
          <img src={ascentulLogo} alt="Ascentul" className="h-6 ml-2" />
        )}
        
        {/* Desktop sidebar toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar}
          className="ml-auto hidden md:flex"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <PanelLeft size={18} /> : <PanelRight size={18} />}
        </Button>
        
        {/* Mobile close button */}
        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto md:hidden"
            aria-label="Close sidebar"
          >
            <ChevronsLeft className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      {/* User Profile Summary */}
      <div className="flex flex-col items-center py-6 border-b">
        <div className="relative">
          <div className="inline-block">
            <ProfileImageUploader
              onImageUploaded={async (imageDataUrl) => {
                console.log("Sidebar image upload started...");
                
                try {
                  // Use the centralized uploadProfileImage function from useUserData context
                  const updatedUser = await uploadProfileImage(imageDataUrl);
                  console.log("Profile successfully updated from sidebar:", updatedUser);
                  return updatedUser;
                } catch (error) {
                  console.error("Error updating profile with image:", error);
                  alert("Failed to update your profile image. Please try again or contact support.");
                  throw error;
                }
              }}
              currentImage={user.profileImage}
            >
              <div>
                <Avatar className={`border-2 border-primary cursor-pointer hover:opacity-90 transition-opacity ${expanded ? 'w-16 h-16' : 'w-10 h-10'}`}>
                  {user.profileImage ? (
                    <AvatarImage 
                      src={user.profileImage || ''} 
                      alt={user.name} 
                      onError={(e) => {
                        console.log("Error loading image, falling back to text");
                        // Hide the broken image icon
                        e.currentTarget.style.display = 'none';
                      }}
                      className="object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </ProfileImageUploader>
          </div>
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
                    {expanded && section.items && section.items.length > 0 && (
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
                        {section.items && section.items.map((item) => (
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
                        {section.items && section.items.map((item) => (
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
            href="/admin"
            className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm transition-colors hover:bg-primary/5 rounded-md ${expanded ? 'mx-3' : 'mx-1'}
              ${location.startsWith("/admin") ? 'text-primary bg-primary/10' : ''}`}
            title={!expanded ? 'Admin Dashboard' : undefined}
          >
            <ShieldCheck className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
            {expanded && 'Admin Dashboard'}
          </Link>
        </div>
      )}
      
      {/* Settings */}
      <div className="border-t py-4">
        {/* Upgrade Button - Only shown for free users */}
        {isFreeUser && (
          <Link 
            to="/upgrade"
            className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm mb-2 bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`}
            title={!expanded ? 'Upgrade' : undefined}
          >
            <ZapIcon className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
            {expanded && 'Upgrade'}
          </Link>
        )}
        
        <button 
          onClick={() => setShowNotifications(true)}
          className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`}
          title={!expanded ? 'Notifications' : undefined}
        >
          <Bell className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
          {expanded && 'Notifications'}
        </button>
        
        <button 
          onClick={() => setShowSupportModal(true)}
          className={`flex items-center ${expanded ? 'px-6' : 'px-2 justify-center'} py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer rounded-md ${expanded ? 'mx-3' : 'mx-1'} w-full text-left`}
          title={!expanded ? 'Support' : undefined}
        >
          <HelpCircle className={`w-5 h-5 ${expanded ? 'mr-3' : ''}`} />
          {expanded && 'Support'}
        </button>
        
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
      
      {/* Support Ticket Modal */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
            <DialogDescription>
              Need help with something? Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your issue"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="issueType" className="text-sm font-medium">
                Issue Type
              </label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account_access">Account Access</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="Bug">Bug Report</SelectItem>
                  <SelectItem value="Feedback">Feedback</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about your issue or question"
                rows={5}
                required
              />
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Notifications Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Your latest updates and alerts
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No new notifications</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {notifications.map((notif: any) => (
                  <li key={notif.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{notif.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{notif.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
