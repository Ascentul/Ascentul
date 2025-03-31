import { useState, ReactNode } from 'react';
import StaffSidebar from '@/components/StaffSidebar';
import StaffHeader from '@/components/StaffHeader';
import { useUser } from '@/lib/useUserData';
import { useIsStaffUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isLoading, user } = useUser();
  const isStaff = useIsStaffUser();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Check if the user is staff or admin
  if (!isStaff) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <h1 className="text-2xl font-bold text-primary mb-4">Staff Portal</h1>
        <p className="text-neutral-500">Access denied. Staff privileges required.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <StaffSidebar />
      
      {/* Mobile Sidebar (conditionally rendered) */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        >
          <div 
            className="absolute top-0 left-0 h-full w-64 bg-white z-50 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StaffSidebar />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader onMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4">
          <div className="container mx-auto py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}