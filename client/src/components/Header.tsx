import { Menu, Bell, Settings, GraduationCap } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUserData';
import { Link } from 'wouter';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useUser();
  const isUniversityUser = user?.userType === 'university_student' || user?.userType === 'university_admin';

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="md:hidden mr-2 text-neutral-700 p-2"
            onClick={onMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="md:hidden text-lg font-bold text-primary font-poppins">CareerQuest</h1>
        </div>
        <div className="flex items-center">
          {/* University Toggle - only for university users */}
          {isUniversityUser && (
            <Link
                href="/university"
                className="mr-3 border border-primary rounded-md px-3 py-1.5 text-primary hover:bg-primary/5 flex items-center cursor-pointer"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">University Edition</span>
              </Link>
          )}
          
          <Button variant="ghost" size="icon" className="relative text-neutral-700 hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="ml-2 text-neutral-700 hover:text-primary">
            <Settings className="h-5 w-5" />
          </Button>
          {user && (
            <Avatar className="ml-3 h-8 w-8 md:hidden">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
