import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Menu, X, Home, Users, BarChart2, Settings, HelpCircle, LogOut, Bell } from 'lucide-react';
import { adminApiClient } from '@/lib/adminApiClient';
import { Button } from '@/components/ui/button';
import { AdminProvider } from '@/contexts/AdminContext';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/config/api';

// Define navigation items
const navigationItems = [
  { label: 'Dashboard', icon: Home, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Support', icon: HelpCircle, path: '/admin/support' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: [endpoints.currentUser],
    retry: false,
  });
  
  // Check if the user is an admin
  useEffect(() => {
    if (!isLoading && currentUser?.userType !== 'admin') {
      // Redirect to login if not an admin
      window.location.href = '/sign-in';
    }
  }, [currentUser, isLoading]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await adminApiClient.logout();
      window.location.href = '/sign-in';
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Unauthorized state
  if (!isLoading && currentUser?.userType !== 'admin') {
    return null; // Will be redirected by the useEffect
  }
  
  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 flex-col border-r bg-background p-4">
          <div className="flex items-center p-2 mb-6">
            <h1 className="text-xl font-bold">CareerTracker Admin</h1>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navigationItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto">
            <Separator className="my-4" />
            <div className="px-4 py-2 flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>
        
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-10 md:hidden">
          <div className="flex items-center justify-between px-4 h-full">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 pt-4">
                <div className="flex items-center p-4 mb-6">
                  <h1 className="text-xl font-bold">CareerTracker Admin</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <a
                          className={`flex items-center px-4 py-3 ${
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="mt-auto">
                  <Separator className="my-4" />
                  <div className="px-4 py-2 flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentUser?.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start mt-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
            
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                  3
                </Badge>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 md:p-8 p-4 md:pt-8 pt-20 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}