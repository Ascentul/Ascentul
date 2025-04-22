import { useUser } from '@/lib/useUserData';
import { useEffect, useState } from 'react';

export default function ImageDebugTest() {
  const { user } = useUser();
  // We no longer need to continuously refresh the timestamp
  // as we've fixed the image source in all components
  
  if (!user || !user.profileImage) return null;
  
  return (
    <div className="fixed top-0 right-0 bg-white border p-4 shadow-lg z-50 w-64">
      <h3 className="text-sm font-bold mb-2">Image Debug</h3>
      <p className="text-xs mb-2">URL: {user.profileImage}</p>
      
      <div className="border rounded-lg overflow-hidden">
        <img 
          src={user.profileImage}
          alt="Debug view" 
          className="w-full h-auto object-cover"
        />
      </div>
      
      <div className="mt-2 text-xs">
        <p>Loaded at: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}