import { useUser } from '@/lib/useUserData';
import { useEffect, useState } from 'react';

export default function ImageDebugTest() {
  const { user } = useUser();
  const [timestamp, setTimestamp] = useState(Date.now());
  
  useEffect(() => {
    // Refresh the timestamp every second to force re-render
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!user || !user.profileImage) return null;
  
  return (
    <div className="fixed top-0 right-0 bg-white border p-4 shadow-lg z-50 w-64">
      <h3 className="text-sm font-bold mb-2">Image Debug</h3>
      <p className="text-xs mb-2">URL: {user.profileImage}</p>
      
      <div className="border rounded-lg overflow-hidden">
        <img 
          src={`${user.profileImage}?debug=true&t=${timestamp}`}
          alt="Debug view" 
          className="w-full h-auto"
        />
      </div>
      
      <div className="mt-2 text-xs">
        <p>Timestamp: {timestamp}</p>
        <p>Loaded at: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}