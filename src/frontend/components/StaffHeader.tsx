import { useUser } from '@/lib/useUserData';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Search, ShieldAlert } from 'lucide-react';

interface StaffHeaderProps {
  onMenuToggle: () => void;
}

export default function StaffHeader({ onMenuToggle }: StaffHeaderProps) {
  const { user } = useUser();

  return (
    <header className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-4">
      {/* Mobile menu button */}
      <button 
        className="md:hidden flex items-center justify-center h-10 w-10 rounded-md hover:bg-neutral-100"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo (visible on mobile only) */}
      <div className="md:hidden flex items-center">
        <ShieldAlert className="w-5 h-5 text-primary mr-2" />
        <span className="font-bold text-primary">Staff Portal</span>
      </div>

      {/* Search bar */}
      <div className="hidden md:flex items-center flex-1 ml-4 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, tickets, content..."
            className="pl-8 w-full bg-neutral-50 border-neutral-200"
          />
        </div>
      </div>

      {/* Right side - notifications and profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 border-l border-neutral-200"></div>

        {/* Profile dropdown */}
        <div className="flex items-center">
          <div className="mr-3 text-right hidden md:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.userType}</p>
          </div>
          <Link href="/staff/profile">
            <Avatar className="h-9 w-9 cursor-pointer">
              {user?.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}