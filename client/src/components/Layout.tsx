import { ReactNode, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { useUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { ModelNotificationContainer } from '@/components/ModelNotification';
import { useModelNotifications } from '@/hooks/use-model-notifications';

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Model notification banner */}
      {hasNewModels && <ModelNotificationContainer />}
      
      <MobileHeader onMenuToggle={toggleMobileSidebar} />
      
      {/* Mobile overlay backdrop - only visible when mobile sidebar is open */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 md:hidden" 
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleMobileSidebar} />
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}