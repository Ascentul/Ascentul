import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLocation } from 'wouter';
import { AdminOverview } from './AdminOverview';
import { UserManagement } from './UserManagement';
import { Analytics } from './Analytics';
import { Settings } from './Settings';
import { Support } from './Support';

export default function AdminDashboard() {
  const [location] = useLocation();
  
  // Render the appropriate content based on the current location
  const renderContent = () => {
    switch (location) {
      case '/admin':
        return <AdminOverview />;
      case '/admin/users':
        return <UserManagement />;
      case '/admin/analytics':
        return <Analytics />;
      case '/admin/settings':
        return <Settings />;
      case '/admin/support':
        return <Support />;
      default:
        return <AdminOverview />;
    }
  };
  
  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  );
}