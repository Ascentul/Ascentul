import { Menu, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUserData';
import ProfileImageUploader from './ProfileImageUploader';
import { ModelNotificationIcon } from './ModelNotification';
import { NotificationBell } from '@/components/NotificationBell';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const { user, updateUser, uploadProfileImage } = useUser();

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm z-10 md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 text-neutral-700 p-2"
            onClick={onMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-primary font-poppins">Ascentul</h1>
        </div>
        <div className="flex items-center">
          {/* Dynamic AI Model notification icon */}
          <ModelNotificationIcon />
          {/* In-app notifications bell */}
          <div className="ml-1">
            <NotificationBell />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 text-neutral-700 hover:text-primary"
            onClick={() => window.location.href = '/account'}
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <div className="inline-block">
            <ProfileImageUploader
              onImageUploaded={async (imageDataUrl) => {
                console.log("Mobile header image upload started...");
                
                try {
                  // Use the centralized uploadProfileImage function from useUserData context
                  const updatedUser = await uploadProfileImage(imageDataUrl);
                  console.log("Profile successfully updated from mobile header:", updatedUser);
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
                <Avatar className="ml-3 h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity">
                  {user.profileImage ? (
                    <AvatarImage 
                      src={user.profileImage || ''} 
                      alt={user.name} 
                      onError={(e) => {
                        console.log("Error loading image in mobile header, falling back to text");
                        e.currentTarget.style.display = 'none';
                      }}
                      className="object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </ProfileImageUploader>
          </div>
        </div>
      </div>
    </header>
  );
}