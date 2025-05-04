import { ReactNode, useState } from 'react';
import { useUser } from '@/lib/useUserData';
import { useLocation, Link } from 'wouter';
import { 
  Loader2, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings,
  LogOut,
  School,
  Bell,
  BookOpen,
  CalendarDays,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface UniversityAdminLayoutProps {
  children: ReactNode;
}

export default function UniversityAdminLayout({ children }: UniversityAdminLayoutProps) {
  const { user, isLoading, logout } = useUser();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user or not a university admin, show access denied
  if (!user || user.userType !== 'university_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You don't have permission to access the university admin portal.</p>
        <Button onClick={() => window.location.href = '/sign-in'}>
          Return to Login
        </Button>
      </div>
    );
  }
  
  // Get university name from user profile (or fallback to a default)
  const universityName = user.universityName || 'University Admin Portal';
  
  // Navigation items for university admin portal sidebar
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/university-admin', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: 'Students', 
      href: '/university-admin/students', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      name: 'Invite Students', 
      href: '/university-admin/invite', 
      icon: <UserPlus className="h-5 w-5" /> 
    },
    { 
      name: 'Usage Analytics', 
      href: '/university-admin/usage', 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      name: 'Settings', 
      href: '/university-admin/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];
  
  // Additional tools that might be helpful for university admins
  const additionalTools = [
    { 
      name: 'Announcements', 
      href: '/university-admin/announcements', 
      icon: <Bell className="h-5 w-5" /> 
    },
    { 
      name: 'Resources', 
      href: '/university-admin/resources', 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      name: 'Events', 
      href: '/university-admin/events', 
      icon: <CalendarDays className="h-5 w-5" /> 
    },
    { 
      name: 'Support', 
      href: '/university-admin/support', 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
  ];
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-white shadow-md"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out lg:relative flex flex-col w-64 h-screen bg-white border-r border-gray-200 z-40`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center p-6 border-b">
          <div className="flex items-center">
            <School className="h-8 w-8 text-primary mr-2" />
            <div>
              <h2 className="text-xl font-bold text-primary">Ascentul</h2>
              <p className="text-xs text-muted-foreground">University Portal</p>
            </div>
          </div>
        </div>
        
        {/* University Name */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-muted-foreground">INSTITUTION</h3>
          <p className="mt-1 text-base font-medium truncate">{universityName}</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Main Navigation</h3>
          
          {/* Primary Navigation Items */}
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          {/* Additional Tools Section */}
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Additional Tools</h3>
          <div className="space-y-1">
            {additionalTools.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold">University Admin Portal</h1>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 hidden md:flex"
              onClick={() => window.open('https://ascentul.com/university-help', '_blank')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Help Center
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 hidden md:flex"
              onClick={() => window.location.href = '/university-admin/support'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Support
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
      
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}