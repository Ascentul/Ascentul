import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Globe, 
  Server, 
  Zap, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SystemStatusData {
  overall: {
    status: string;
    uptime: number;
    lastIncident: string;
    lastChecked: string;
  };
  components: {
    name: string; 
    status: string; 
    health: number;
    responseTime: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  alerts: {
    title: string;
    description: string;
    severity: string;
    time: string;
  }[];
}

export default function SystemStatusModal({ open, onOpenChange }: SystemStatusModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mock system status data - in a real app, this would come from an API
  const [systemStatus, setSystemStatus] = useState<SystemStatusData>({
    overall: {
      status: 'operational',
      uptime: 99.97,
      lastIncident: '8 days ago',
      lastChecked: new Date().toLocaleTimeString()
    },
    components: [
      { 
        name: 'Web Application', 
        status: 'operational', 
        health: 100,
        responseTime: '42ms',
        icon: Globe
      },
      { 
        name: 'API Services', 
        status: 'operational', 
        health: 98,
        responseTime: '78ms',
        icon: Zap
      },
      { 
        name: 'Database', 
        status: 'degraded', 
        health: 87,
        responseTime: '145ms',
        icon: Database
      },
      { 
        name: 'Payment Processing', 
        status: 'operational', 
        health: 99,
        responseTime: '52ms',
        icon: Activity
      },
      { 
        name: 'Authentication', 
        status: 'operational', 
        health: 100,
        responseTime: '31ms',
        icon: Server
      }
    ],
    alerts: [
      {
        title: 'Database query performance degraded',
        description: 'Some database operations are experiencing increased latency. Our team is investigating.',
        severity: 'warning',
        time: '15 minutes ago'
      }
    ]
  });

  // Function to simulate refreshing status data
  const refreshStatus = () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Update some values to simulate real-time changes
      setSystemStatus(prev => {
        const newComponents = [...prev.components];
        
        // Randomly improve or degrade a component
        const randomIndex = Math.floor(Math.random() * newComponents.length);
        const randomHealth = Math.max(80, Math.min(100, newComponents[randomIndex].health + (Math.random() > 0.5 ? 2 : -2)));
        
        newComponents[randomIndex] = {
          ...newComponents[randomIndex],
          health: randomHealth,
          status: randomHealth > 95 ? 'operational' : randomHealth > 85 ? 'degraded' : 'outage'
        };
        
        return {
          ...prev,
          components: newComponents,
          overall: {
            ...prev.overall,
            uptime: Math.min(100, prev.overall.uptime + (Math.random() > 0.7 ? 0.01 : -0.01)),
            lastChecked: new Date().toLocaleTimeString()
          }
        };
      });
      
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'operational':
        return <Badge className="bg-green-500 hover:bg-green-600">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Degraded</Badge>;
      case 'outage':
        return <Badge className="bg-red-500 hover:bg-red-600">Outage</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Helper function to get alert icon
  const getAlertIcon = (severity: string) => {
    switch(severity) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Status</span>
          </DialogTitle>
          <DialogDescription>
            Real-time overview of CareerTracker.io platform health
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall System Status */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Platform Status</h3>
              <Badge className="bg-green-500 hover:bg-green-600">
                {systemStatus.overall.uptime}% Uptime
              </Badge>
            </div>
            
            <Progress 
              value={parseFloat(systemStatus.overall.uptime.toString())} 
              className="h-2 mb-2" 
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Last incident: {systemStatus.overall.lastIncident}</span>
              <span>Last checked: {systemStatus.overall.lastChecked || 'Now'}</span>
            </div>
          </div>
          
          {/* Component Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemStatus.components.map((component, i) => {
              const Icon = component.icon;
              return (
                <div 
                  key={i} 
                  className={`rounded-lg border p-3 ${
                    component.status === 'operational' 
                      ? 'bg-card' 
                      : component.status === 'degraded'
                      ? 'bg-yellow-50' 
                      : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-full ${
                        component.status === 'operational' 
                          ? 'bg-green-100 text-green-700' 
                          : component.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="font-medium">{component.name}</h4>
                    </div>
                    {getStatusBadge(component.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Progress 
                      value={component.health} 
                      className={`h-1.5 ${
                        component.status === 'operational' 
                          ? 'bg-green-100' 
                          : component.status === 'degraded'
                          ? 'bg-yellow-100' 
                          : 'bg-red-100'
                      }`} 
                    />
                    <span className="ml-3 text-xs text-muted-foreground">
                      Response: {component.responseTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Alerts */}
          {systemStatus.alerts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Active Alerts</h3>
              <div className="space-y-2">
                {systemStatus.alerts.map((alert, i) => (
                  <div key={i} className={`p-3 border rounded-md ${
                    alert.severity === 'warning' 
                      ? 'border-yellow-200 bg-yellow-50'
                      : alert.severity === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        {getAlertIcon(alert.severity)}
                        <span className="font-medium">{alert.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            This data refreshes automatically every 5 minutes
          </div>
          <Button 
            onClick={refreshStatus} 
            disabled={isRefreshing}
            className="px-3"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}