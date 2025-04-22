import { ReactNode, useState } from 'react';
import { Link } from 'wouter';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface StaticLayoutProps {
  children: ReactNode;
}

export default function StaticLayout({ children }: StaticLayoutProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Toggle sidebar expanded state
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  // Mock user data
  const user = {
    id: 3,
    name: 'Test User',
    username: 'testuser',
    profileImage: null
  };
  
  // The main navigation items
  const sidebarSections = [
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
        { href: '/skill-stacker', icon: <ClipboardList className="w-5 h-5 mr-3" />, label: 'Skill Stacker' },
        { href: '/career-path-explorer', icon: <GitBranch className="w-5 h-5 mr-3" />, label: 'Career Path Explorer' },
        { href: '/ai-coach', icon: <Bot className="w-5 h-5 mr-3" />, label: 'AI Career Coach' },
      ]
    },
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
        { href: '/exit-plan', icon: <Clock className="w-5 h-5 mr-3" />, label: 'Exit Plan' },
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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`flex-col transition-all duration-300 ease-in-out bg-white shadow-md z-30 flex
            ${expanded ? 'w-64' : 'w-16'}`} 
          data-expanded={expanded ? 'true' : 'false'}
        >
          <div className="flex items-center justify-between h-16 border-b px-3">
            {expanded && (
              <div className="text-xl font-bold text-primary">Ascentul</div>
            )}
            
            {/* Desktop sidebar toggle */}
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
              <Avatar className={`border-2 border-primary cursor-pointer hover:opacity-90 transition-opacity ${expanded ? 'w-16 h-16' : 'w-10 h-10'}`}>
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {expanded && (
              <h2 className="mt-3 font-medium text-lg">{user.name}</h2>
            )}
          </div>
          
          {/* Navigation with four main sections */}
          <nav className="flex-1 overflow-hidden py-4 flex flex-col">
            {/* Dashboard link is always visible */}
            <a
              href={dashboardLink.href}
              className={`flex items-center ${expanded ? 'px-6' : 'px-3 justify-center'} py-3 text-sm transition-colors hover:bg-primary/5
                border-l-4 border-primary text-primary bg-primary/10`}
              title={!expanded ? dashboardLink.label : undefined}
            >
              <div className={expanded ? 'mr-3' : ''}>
                {dashboardLink.icon}
              </div>
              {expanded && dashboardLink.label}
            </a>

            <div className={`mt-3 ${expanded ? 'px-3' : 'px-0'}`}>
              {expanded && (
                <div className="text-xs font-medium text-neutral-400 uppercase mb-2 px-3">
                  Features
                </div>
              )}
              
              {/* Four main sections */}
              <div className="space-y-1">
                {sidebarSections.map((section) => (
                  <div key={section.id} className="relative">
                    {/* Section header */}
                    <button
                      className={`w-full flex items-center ${expanded ? 'justify-between' : 'justify-center'} rounded-md ${expanded ? 'px-3' : 'px-2'} py-2 text-sm transition-colors
                        ${activeSection === section.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/5'}`}
                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                      title={!expanded ? section.title : undefined}
                    >
                      <div className="flex items-center">
                        <span className={expanded ? 'mr-3' : ''}>{section.icon}</span>
                        {expanded && <span>{section.title}</span>}
                      </div>
                      {expanded && (
                        <ChevronRight 
                          className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'transform rotate-90' : ''}`} 
                        />
                      )}
                    </button>
                    
                    {/* Sub-items */}
                    {expanded && activeSection === section.id && (
                      <div className="pl-7 mt-1 space-y-1">
                        {section.items.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/5"
                          >
                            <span className="mr-3">{item.icon}</span>
                            <span>{item.label}</span>
                            {/* Pro badge removed for simplicity */}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </nav>
          
          {/* Bottom links for account and logout */}
          <div className="border-t py-4">
            <div className={`space-y-1 ${expanded ? 'px-3' : 'px-0'}`}>
              <a
                href="/profile"
                className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm rounded-md transition-colors hover:bg-primary/5`}
                title={!expanded ? "Profile" : undefined}
              >
                <span className={expanded ? 'mr-3' : ''}>
                  <UserIcon className="w-5 h-5" />
                </span>
                {expanded && "Profile"}
              </a>
              
              <a
                href="/account"
                className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm rounded-md transition-colors hover:bg-primary/5`}
                title={!expanded ? "Account" : undefined}
              >
                <span className={expanded ? 'mr-3' : ''}>
                  <Settings className="w-5 h-5" />
                </span>
                {expanded && "Account"}
              </a>
              
              <a
                href="/sign-in"
                className={`flex items-center ${expanded ? 'px-3' : 'px-2 justify-center'} py-2 text-sm text-red-500 rounded-md transition-colors hover:bg-red-50`}
                title={!expanded ? "Logout" : undefined}
              >
                <span className={expanded ? 'mr-3' : ''}>
                  <LogOut className="w-5 h-5" />
                </span>
                {expanded && "Logout"}
              </a>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}