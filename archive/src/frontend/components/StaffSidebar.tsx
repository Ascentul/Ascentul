import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  TicketCheck, 
  BarChart3, 
  Settings, 
  LogOut,
  ShieldAlert,
  BookOpen,
  MessageSquare,
  Bell,
  ServerCog,
  Zap
} from 'lucide-react';

export default function StaffSidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();

  if (!user) return null;

  // Staff navigation items
  const staffNavigationItems = [
    { href: '/staff', icon: <LayoutDashboard className="w-5 h-5 mr-3" />, label: 'Dashboard' },
    { href: '/staff/users', icon: <Users className="w-5 h-5 mr-3" />, label: 'User Management' },
    { href: '/staff/support', icon: <TicketCheck className="w-5 h-5 mr-3" />, label: 'Support Tickets' },
    { href: '/staff/content', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Content Manager' },
    { href: '/staff/analytics', icon: <BarChart3 className="w-5 h-5 mr-3" />, label: 'Analytics' },
    { href: '/staff/notifications', icon: <Bell className="w-5 h-5 mr-3" />, label: 'Notifications' },
    { href: '/staff/knowledge', icon: <BookOpen className="w-5 h-5 mr-3" />, label: 'Knowledge Base' },
    { href: '/staff/system', icon: <ServerCog className="w-5 h-5 mr-3" />, label: 'System Health' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white shadow-md z-10">
      <div className="flex items-center justify-center h-16 border-b bg-primary text-white">
        <ShieldAlert className="w-5 h-5 mr-2" />
        <h1 className="text-xl font-bold font-poppins">Staff Portal</h1>
      </div>
      
      {/* User Profile Summary */}
      <div className="flex flex-col items-center py-6 border-b">
        <Avatar className="w-16 h-16 border-2 border-primary">
          {user.profileImage ? (
            <AvatarImage src={user.profileImage} alt={user.name} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <h2 className="mt-3 font-medium text-lg">{user.name}</h2>
        <div className="mt-1 text-sm text-neutral-400 capitalize">{user.userType}</div>
        
        {/* Staff badge */}
        <div className="mt-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Staff Access
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-6 py-2 text-xs font-medium text-neutral-400 uppercase">
          Staff Tools
        </div>
        
        {/* Staff Navigation Items */}
        {staffNavigationItems.map((item) => (
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
      </nav>
      
      {/* Quick Actions */}
      <div className="border-t py-2">
        <div className="px-6 py-2 text-xs font-medium text-neutral-400 uppercase">
          Quick Actions
        </div>
        <Link 
          href="/staff/broadcast"
          className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5`}
        >
          <MessageSquare className="w-5 h-5 mr-3" />
          Send Broadcast
        </Link>
        <Link 
          href="/staff/maintenance"
          className={`flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5`}
        >
          <Zap className="w-5 h-5 mr-3" />
          Maintenance Mode
        </Link>
      </div>
      
      {/* Settings & Logout */}
      <div className="border-t py-4">
        <Link 
          href="/staff/settings" 
          className="flex items-center px-6 py-3 text-sm hover:bg-primary/5 transition-colors"
        >
          <Settings className="w-5 h-5 mr-3" />
          Staff Settings
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