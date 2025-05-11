import { ReactNode, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { useUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { ModelNotificationContainer } from '@/components/ModelNotification';
import { useModelNotifications } from '@/hooks/use-model-notifications';
import { HeaderBar } from '@/components/HeaderBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useUser();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Initialize model notifications hook
  const { hasNewModels } = useModelNotifications();
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Model notification banner - appears above everything */}
      {hasNewModels && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <ModelNotificationContainer />
        </div>
      )}
      
      {/* Fixed sidebar on the left */}
      <aside className="hidden md:block w-[250px] flex-shrink-0">
        <Sidebar isOpen={true} />
      </aside>
      
      {/* Mobile sidebar with overlay */}
      {mobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden" 
            onClick={toggleMobileSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleMobileSidebar} />
          </div>
        </>
      )}
      
      {/* Content area with header and main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header - only visible on mobile */}
        <div className="md:hidden">
          <MobileHeader onMenuToggle={toggleMobileSidebar} />
        </div>
        
        {/* Header bar at top of content area */}
        <div className="h-[60px] flex-shrink-0">
          <HeaderBar />
        </div>
        
        {/* Main scrollable content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}