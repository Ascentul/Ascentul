import { OverviewCards } from '@/components/admin/OverviewCards';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

export function AdminOverview() {
  const { refreshDashboard, isLoading } = useAdmin();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshDashboard}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      <OverviewCards />
    </div>
  );
}