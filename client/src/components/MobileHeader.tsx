import { Menu, Bell, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUserData';
import ProfileImageUploader from './ProfileImageUploader';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const { user, updateUser } = useUser();

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
          <Button variant="ghost" size="icon" className="relative text-neutral-700 hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              3
            </span>
          </Button>
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
              onImageUploaded={async (imageUrl) => {
                console.log("Mobile header image uploaded, URL:", imageUrl);
                
                try {
                  // First make a direct call to update the user profile with this URL
                  const profileUpdateResponse = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      profileImage: imageUrl.split('?')[0] // Send without timestamp to server
                    }),
                  });
                  
                  if (!profileUpdateResponse.ok) {
                    throw new Error('Failed to update profile with new image');
                  }
                  
                  const updatedUserData = await profileUpdateResponse.json();
                  console.log("Profile successfully updated from mobile header:", updatedUserData);
                  
                  // Update local state
                  updateUser({
                    ...user,
                    profileImage: imageUrl // Keep timestamp for UI
                  });
                  
                  // Force a cache invalidation by fetching the user data again
                  try {
                    const userResponse = await fetch('/api/users/me');
                    if (userResponse.ok) {
                      const userData = await userResponse.json();
                      // Force browser to re-download the image by appending timestamp
                      if (userData.profileImage) {
                        userData.profileImage = `${userData.profileImage}?t=${new Date().getTime()}`;
                      }
                      // Update with the fresh user data
                      updateUser(userData);
                    }
                  } catch (error) {
                    console.error("Error refreshing user data:", error);
                  }
                } catch (error) {
                  console.error("Error updating profile with image:", error);
                  alert("Your image was uploaded but we couldn't update your profile. Please try again or contact support.");
                }
              }}
              currentImage={user.profileImage}
            >
              <div>
                <Avatar className="ml-3 h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity">
                  {user.profileImage ? (
                    <AvatarImage 
                      src={`${user.profileImage}?v=${new Date().getTime()}`} 
                      alt={user.name} 
                      onError={(e) => {
                        console.log("Error loading image in mobile header, falling back to text");
                        e.currentTarget.style.display = 'none';
                      }}
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