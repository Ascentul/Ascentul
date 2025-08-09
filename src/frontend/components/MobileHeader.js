import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUserData';
import ProfileImageUploader from './ProfileImageUploader';
import { ModelNotificationIcon } from './ModelNotification';
export default function MobileHeader({ onMenuToggle }) {
    const { user, updateUser, uploadProfileImage } = useUser();
    if (!user)
        return null;
    return (_jsx("header", { className: "bg-white shadow-sm z-10 md:hidden", children: _jsxs("div", { className: "flex items-center justify-between h-16 px-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Button, { variant: "ghost", className: "mr-2 text-neutral-700 p-2", onClick: onMenuToggle, children: _jsx(Menu, { className: "h-6 w-6" }) }), _jsx("h1", { className: "text-lg font-bold text-primary font-poppins", children: "Ascentul" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(ModelNotificationIcon, {}), _jsx(Button, { variant: "ghost", size: "icon", className: "ml-2 text-neutral-700 hover:text-primary", onClick: () => window.location.href = '/account', children: _jsx(Settings, { className: "h-5 w-5" }) }), _jsx("div", { className: "inline-block", children: _jsx(ProfileImageUploader, { onImageUploaded: async (imageDataUrl) => {
                                    console.log("Mobile header image upload started...");
                                    try {
                                        // Use the centralized uploadProfileImage function from useUserData context
                                        const updatedUser = await uploadProfileImage(imageDataUrl);
                                        console.log("Profile successfully updated from mobile header:", updatedUser);
                                        return updatedUser;
                                    }
                                    catch (error) {
                                        console.error("Error updating profile with image:", error);
                                        alert("Failed to update your profile image. Please try again or contact support.");
                                        throw error;
                                    }
                                }, currentImage: user.profileImage, children: _jsx("div", { children: _jsx(Avatar, { className: "ml-3 h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity", children: user.profileImage ? (_jsx(AvatarImage, { src: user.profileImage || '', alt: user.name, onError: (e) => {
                                                console.log("Error loading image in mobile header, falling back to text");
                                                e.currentTarget.style.display = 'none';
                                            }, className: "object-cover", style: { objectPosition: 'center' } })) : (_jsx(AvatarFallback, { className: "bg-primary/10 text-primary", children: user.name.charAt(0) })) }) }) }) })] })] }) }));
}
