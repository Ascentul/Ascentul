import { useState, useEffect } from 'react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
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
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  PlayCircle,
  ExternalLink,
  AlertCircle,
  FileCog,
  Code,
  ClipboardCopy,
  RotateCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

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
    id: string;
    name: string; 
    status: string; 
    health: number;
    responseTime: string;
    icon: React.ComponentType<{ className?: string }>;
    details?: {
      description: string;
      metrics: {
        name: string;
        value: string;
        change?: string;
        trend?: 'up' | 'down' | 'stable';
      }[];
      issues?: {
        id: string;
        title: string;
        description: string;
        severity: string;
        timeDetected: string;
        suggestedAction?: string;
        impact?: string;
        status?: 'open' | 'in_progress' | 'resolved';
      }[];
      logs?: {
        timestamp: string;
        message: string;
        level: string;
      }[];
      suggestedActions?: {
        id: string;
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'easy' | 'medium' | 'complex';
        eta: string;
        command?: string;
        requiresConfirmation?: boolean;
        requiresCredentials?: boolean;
        status?: 'available' | 'in_progress' | 'completed' | 'failed';
      }[];
    };
  }[];
  alerts: {
    title: string;
    description: string;
    severity: string;
    time: string;
  }[];
}

export default function SystemStatusModal({ open, onOpenChange }: SystemStatusModalProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<{id: string, status: 'completed' | 'failed'} | null>(null);

  // Use a default status object for initial state
  const defaultStatus: SystemStatusData = {
    overall: {
      status: 'loading',
      uptime: 0,
      lastIncident: 'Loading...',
      lastChecked: new Date().toLocaleTimeString()
    },
    components: [
      { 
        id: 'web-app',
        name: 'Web Application', 
        status: 'operational', 
        health: 100,
        responseTime: '42ms',
        icon: Globe
      }
    ],
    alerts: []
  };

  const { data: systemStatus, isLoading, error } = useQuery({
    queryKey: ['/api/system/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1
  });

  // Use the selectedComponent state after defining systemStatus
  const [selectedComponent, setSelectedComponent] = useState<typeof defaultStatus.components[0] | null>(null);

  // Set local status from the API result or use default
  const [localSystemStatus, setLocalSystemStatus] = useState<SystemStatusData>({
    overall: {
      status: 'loading',
      uptime: 0,
      lastIncident: 'Loading...',
      lastChecked: new Date().toLocaleTimeString()
    },
    components: [
      { 
        id: 'web-app',
        name: 'Web Application', 
        status: 'operational', 
        health: 100,
        responseTime: '42ms',
        icon: Globe,
        details: {
          description: 'Frontend application serving user interface components and client-side functionality.',
          metrics: [
            { name: 'Load Time', value: '0.82s', change: '-0.1s', trend: 'down' },
            { name: 'Error Rate', value: '0.01%', change: '0%', trend: 'stable' },
            { name: 'Active Users', value: '1,482', change: '+23', trend: 'up' }
          ],
          logs: [
            { timestamp: '12:42:15', message: 'CDN cache refreshed successfully', level: 'info' },
            { timestamp: '09:15:33', message: 'Frontend bundle rebuilt and deployed', level: 'info' }
          ]
        }
      },
      { 
        id: 'api-services',
        name: 'API Services', 
        status: 'operational', 
        health: 98,
        responseTime: '78ms',
        icon: Zap,
        details: {
          description: 'Backend API services handling data processing, authentication, and business logic.',
          metrics: [
            { name: 'Avg Response', value: '78ms', change: '+3ms', trend: 'up' },
            { name: 'Request Rate', value: '450/min', change: '+22', trend: 'up' },
            { name: 'Error Rate', value: '0.4%', change: '-0.1%', trend: 'down' }
          ],
          issues: [
            { 
              id: 'api-timeout',
              title: 'Occasional timeout on heavy requests',
              description: 'Some complex queries experience timeouts during peak loads.',
              severity: 'low',
              timeDetected: '2 days ago',
              suggestedAction: 'Implement request caching for complex operations',
              impact: 'Affects approximately 2% of API requests during peak hours',
              status: 'open'
            }
          ],
          logs: [
            { timestamp: '13:21:05', message: 'Rate limiting applied to IP 192.168.1.45', level: 'warning' },
            { timestamp: '11:42:32', message: 'API versioning update completed', level: 'info' }
          ],
          suggestedActions: [
            {
              id: 'api-cache',
              title: 'Implement API Response Caching',
              description: 'Add Redis caching layer for frequently accessed endpoints to reduce database load and improve response times.',
              impact: 'high',
              effort: 'medium',
              eta: '30 minutes',
              command: 'npm run deploy:cache-layer',
              requiresConfirmation: true,
              status: 'available'
            },
            {
              id: 'api-optimize',
              title: 'Optimize Query Execution Plans',
              description: 'Analyze and optimize the execution plans for the most resource-intensive API queries.',
              impact: 'medium',
              effort: 'easy',
              eta: '15 minutes',
              command: 'npm run optimize-queries',
              requiresConfirmation: false,
              status: 'available'
            }
          ]
        }
      },
      { 
        id: 'database',
        name: 'Database', 
        status: 'degraded', 
        health: 87,
        responseTime: '145ms',
        icon: Database,
        details: {
          description: 'PostgreSQL database storing user data, application state, and business records.',
          metrics: [
            { name: 'Query Time', value: '145ms', change: '+65ms', trend: 'up' },
            { name: 'Connection Pool', value: '78%', change: '+12%', trend: 'up' },
            { name: 'Disk Usage', value: '76%', change: '+5%', trend: 'up' },
            { name: 'Index Fragmentation', value: '32%', change: '+15%', trend: 'up' }
          ],
          issues: [
            { 
              id: 'db-query-performance',
              title: 'Database query performance degraded',
              description: 'Elevated query times caused by index fragmentation and increasing table sizes.',
              severity: 'medium',
              timeDetected: '15 hours ago',
              suggestedAction: 'Run VACUUM ANALYZE on primary tables and rebuild indexes',
              impact: 'Affecting response time of data-intensive operations',
              status: 'open'
            },
            { 
              id: 'db-connection-pool',
              title: 'Connection pool nearing capacity',
              description: 'High number of concurrent connections during peak hours.',
              severity: 'low',
              timeDetected: '2 days ago',
              suggestedAction: 'Increase max_connections parameter and implement connection pooling',
              impact: 'May cause connection timeouts during high traffic periods',
              status: 'in_progress'
            }
          ],
          logs: [
            { timestamp: '14:35:22', message: 'Slow query detected: SELECT * FROM interview_processes WHERE...', level: 'warning' },
            { timestamp: '12:18:43', message: 'Temporary disk space shortage during backup', level: 'warning' },
            { timestamp: '08:42:15', message: 'Automated backup completed successfully', level: 'info' }
          ],
          suggestedActions: [
            {
              id: 'db-vacuum',
              title: 'Run Database Maintenance',
              description: 'Execute VACUUM ANALYZE to reclaim space and update statistics for better query planning.',
              impact: 'high',
              effort: 'easy',
              eta: '10 minutes',
              command: 'VACUUM ANALYZE interview_processes, users, work_history;',
              requiresConfirmation: true,
              status: 'available'
            },
            {
              id: 'db-index-rebuild',
              title: 'Rebuild Fragmented Indexes',
              description: 'Drop and recreate heavily fragmented indexes to improve query performance.',
              impact: 'high',
              effort: 'medium',
              eta: '20 minutes',
              command: 'npm run db:rebuild-indexes',
              requiresConfirmation: true,
              status: 'available'
            },
            {
              id: 'db-optimize-config',
              title: 'Optimize PostgreSQL Configuration',
              description: 'Update PostgreSQL configuration parameters for better performance with current workload.',
              impact: 'medium',
              effort: 'complex',
              eta: '45 minutes',
              requiresCredentials: true,
              status: 'available'
            }
          ]
        }
      },
      { 
        id: 'payment-processing',
        name: 'Payment Processing', 
        status: 'operational', 
        health: 99,
        responseTime: '52ms',
        icon: Activity,
        details: {
          description: 'Stripe integration for handling subscription payments and billing operations.',
          metrics: [
            { name: 'Transaction Time', value: '52ms', change: '-8ms', trend: 'down' },
            { name: 'Success Rate', value: '99.8%', change: '+0.1%', trend: 'up' },
            { name: 'Daily Volume', value: '$4,235', change: '+$175', trend: 'up' }
          ],
          logs: [
            { timestamp: '15:12:08', message: 'Webhook received: invoice.payment_succeeded', level: 'info' },
            { timestamp: '09:47:23', message: 'Stripe API key rotated successfully', level: 'info' }
          ]
        }
      },
      { 
        id: 'authentication',
        name: 'Authentication', 
        status: 'operational', 
        health: 100,
        responseTime: '31ms',
        icon: Server,
        details: {
          description: 'User authentication, session management, and access control services.',
          metrics: [
            { name: 'Auth Time', value: '31ms', change: '-2ms', trend: 'down' },
            { name: 'Active Sessions', value: '1,248', change: '+54', trend: 'up' },
            { name: 'Failed Logins', value: '2.1%', change: '-0.3%', trend: 'down' }
          ],
          logs: [
            { timestamp: '14:22:56', message: 'Password policy updated system-wide', level: 'info' },
            { timestamp: '10:05:17', message: 'Login attempt rate limiting triggered', level: 'warning' }
          ]
        }
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

  // Update local state when API data is loaded
  useEffect(() => {
    if (systemStatus) {
      setLocalSystemStatus(systemStatus);
    }
  }, [systemStatus]);

  // Function to simulate refreshing status data
  const refreshStatus = () => {
    setIsRefreshing(true);

    // Simulate API call delay
    setTimeout(() => {
      // Update some values to simulate real-time changes
      setLocalSystemStatus(prev => {
        const newComponents = [...prev.components];

        // Randomly improve or degrade a component
        const randomIndex = Math.floor(Math.random() * newComponents.length);
        const randomHealth = Math.max(80, Math.min(100, newComponents[randomIndex].health + (Math.random() > 0.5 ? 2 : -2)));

        // Make sure to preserve all other properties including details
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

  // Helper function to get trend indicator for metrics
  const getTrendIndicator = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null;

    switch(trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  // Function to handle view command for database operations
  const handleViewCommand = (actionId: string, command: string | undefined) => {
    setCurrentCommand(command || "No command available");
  };

  // Function to close the command view modal
  const closeCommandView = () => {
    setCurrentCommand(null);
  };

  // Function to handle actions for specific issues
  const handleActionClick = (actionId: string, actionTitle: string) => {
    // Set the action in progress
    setActionInProgress(actionId);

    // Simulate API call with a delay
    setTimeout(() => {
      // In a real app, this would make an actual API call to execute the command
      const success = Math.random() > 0.2; // 80% success rate for demo purposes

      // Update component health based on the action
      setLocalSystemStatus(prev => {
        const newComponents = [...prev.components];

        // Find the component we're working with
        const componentIndex = newComponents.findIndex(c => c.id === selectedComponent?.id);
        if (componentIndex === -1) return prev;

        // Modify the component's health based on action success
        const component = {...newComponents[componentIndex]};

        if (success) {
          // Calculate health improvement (between 3-10%)
          const improvement = Math.floor(Math.random() * 8) + 3;
          component.health = Math.min(100, component.health + improvement);

          // Update status based on new health
          component.status = component.health > 95 ? 'operational' : component.health > 85 ? 'degraded' : 'outage';

          // Update the component in the list
          newComponents[componentIndex] = component;

          // Update suggested action status in the component details
          if (component.details?.suggestedActions) {
            const updatedDetails = {...component.details};

            if (updatedDetails.suggestedActions) {
              updatedDetails.suggestedActions = updatedDetails.suggestedActions.map(action => 
                action.id === actionId 
                  ? {...action, status: 'completed' as const} 
                  : action
              );
            }

            // Add a log entry for this action
            if (updatedDetails.logs) {
              const now = new Date();
              const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
              const logsArray = [...updatedDetails.logs];
              updatedDetails.logs = [
                {
                  timestamp,
                  message: `Action completed: ${actionTitle}`,
                  level: 'info'
                },
                ...logsArray
              ];
            }

            // Update the component with the new details
            newComponents[componentIndex] = {
              ...component,
              details: updatedDetails
            };
          }
        } else {
          // Add a log entry for the failed action
          if (component.details?.logs) {
            const now = new Date();
            const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const updatedDetails = {...component.details};
            // Only spread the logs if they exist
            const logsArray = updatedDetails.logs ? [...updatedDetails.logs] : [];
            updatedDetails.logs = [
              {
                timestamp,
                message: `Action failed: ${actionTitle}. Please check system logs for details.`,
                level: 'error'
              },
              ...logsArray
            ];

            // Update the component with the new details
            newComponents[componentIndex] = {
              ...component,
              details: updatedDetails
            };
          }
        }

        return {
          ...prev,
          components: newComponents,
          overall: {
            ...prev.overall,
            lastChecked: new Date().toLocaleTimeString()
          }
        };
      });

      // Clear the action in progress and set success/failure
      setActionInProgress(null);
      setActionSuccess({id: actionId, status: success ? 'completed' : 'failed'});

      // Clear the success/failure message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    }, 1500); // Simulating server-side action execution
  };

  return (
    <>
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

          {error ? (
            <div className="p-4 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">Failed to load system status</p>
              <Button variant="outline" onClick={refreshStatus} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall System Status */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Platform Status</h3>
                  <Badge className="bg-green-500 hover:bg-green-600">
                    {localSystemStatus.overall.uptime}% Uptime
                  </Badge>
                </div>

                <Progress 
                  value={parseFloat(localSystemStatus.overall.uptime.toString())} 
                  className="h-2 mb-2" 
                />

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Last incident: {localSystemStatus.overall.lastIncident}</span>
                  <span>Last checked: {localSystemStatus.overall.lastChecked || 'Now'}</span>
                </div>
              </div>

              {/* Component Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localSystemStatus.components.map((component, i) => {
                  const Icon = component.icon;
                  return (
                    <div 
                      key={i} 
                      className={`rounded-lg border p-3 transition-colors hover:border-primary cursor-pointer ${
                        component.status === 'operational' 
                          ? 'bg-card' 
                          : component.status === 'degraded'
                          ? 'bg-yellow-50' 
                          : 'bg-red-50'
                      }`}
                      onClick={() => setSelectedComponent(component)}
                    >
                      <div className="flex items-start justify-between mb-2">
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
                      {component.status !== 'operational' && (
                        <div className="mt-2 flex justify-end">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View details
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Alerts */}
              {localSystemStatus.alerts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Active Alerts</h3>
                  <div className="space-y-2">
                    {localSystemStatus.alerts.map((alert, i) => (
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
          )}

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

      {/* Component Detail Dialog */}
      <Dialog open={selectedComponent !== null} onOpenChange={(open) => !open && setSelectedComponent(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedComponent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-full ${
                    selectedComponent.status === 'operational' 
                      ? 'bg-green-100 text-green-700' 
                      : selectedComponent.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {React.createElement(selectedComponent.icon, { className: "h-4 w-4" })}
                  </div>
                  <span>{selectedComponent.name} Details</span>
                  {getStatusBadge(selectedComponent.status)}
                </DialogTitle>
                <DialogDescription>
                  {selectedComponent.details?.description || `Detailed information about the ${selectedComponent.name} component.`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Health Overview */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Health: {selectedComponent.health}%</h3>
                    <span className="text-xs text-muted-foreground">Response time: {selectedComponent.responseTime}</span>
                  </div>
                  <Progress 
                    value={selectedComponent.health} 
                    className={`h-2 ${
                      selectedComponent.status === 'operational' 
                        ? 'bg-green-100' 
                        : selectedComponent.status === 'degraded'
                        ? 'bg-yellow-100' 
                        : 'bg-red-100'
                    }`} 
                  />
                </div>

                {/* Metrics Section */}
                {selectedComponent.details?.metrics && selectedComponent.details.metrics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedComponent.details.metrics.map((metric, i) => (
                            <TableRow key={i}>
                              <TableCell>{metric.name}</TableCell>
                              <TableCell>{metric.value}</TableCell>
                              <TableCell>
                                {metric.change && (
                                  <div className="flex items-center space-x-1">
                                    <span>{metric.change}</span>
                                    {getTrendIndicator(metric.trend)}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Issues Section */}
                {selectedComponent.details?.issues && selectedComponent.details.issues.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Active Issues</h3>
                    <div className="space-y-3">
                      {selectedComponent.details.issues.map((issue, i) => (
                        <div key={i} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-2">
                              {issue.severity === 'high' ? (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              ) : issue.severity === 'medium' ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{issue.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">Detected {issue.timeDetected}</span>
                          </div>

                          {issue.suggestedAction && (
                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Suggested action:</span> {issue.suggestedAction}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleActionClick(issue.id || `issue-${i}`, issue.title)}
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Apply Fix
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logs Section */}
                {selectedComponent.details?.logs && selectedComponent.details.logs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Recent Logs</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-3 h-[180px] overflow-y-auto font-mono text-xs">
                      {selectedComponent.details.logs.map((log, i) => (
                        <div key={i} className="flex items-start mb-1.5">
                          <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                          <span className={`mr-2 ${
                            log.level === 'error' 
                              ? 'text-red-500' 
                              : log.level === 'warning'
                              ? 'textyellow-600'
                              : 'text-blue-500'
                          }`}>
                            {log.level.toUpperCase()}:
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Actions Section */}
                {selectedComponent.details?.suggestedActions && selectedComponent.details.suggestedActions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Suggested Actions</h3>
                    <div className="space-y-3">
                      {selectedComponent.details.suggestedActions.map((action, i) => (
                        <div key={i} className="border rounded-md p-3 hover:border-primary transition-colors">
                          <div className="flex items-start space-x-2 mb-2">
                            <div className={`p-1 rounded-full ${
                              action.impact === 'high' 
                                ? 'bg-red-100 text-red-700' 
                                : action.impact === 'medium'
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              <AlertCircle className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{action.title}</h4>
                                <div className="flex items-center space-x-1">
                                  <Badge className={`text-xs ${
                                    action.impact === 'high' 
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                      : action.impact === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}>
                                    {action.impact} impact
                                  </Badge>
                                  <Badge className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                                    {action.effort} effort
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>

                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="mr-2">
                                  <strong>ETA:</strong> {action.eta}
                                </span>
                                {action.requiresConfirmation && (
                                  <span className="mr-2 text-yellow-600">Requires confirmation</span>
                                )}
                                {action.requiresCredentials && (
                                  <span className="text-red-600">Requires credentials</span>
                                )}
                              </div>

                              <div className="mt-3 flex justify-end space-x-2">
                                {action.command && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs"
                                    onClick={() => handleViewCommand(action.id, action.command)}
                                  >
                                    <FileCog className="h-3 w-3 mr-1" />
                                    View Command
                                  </Button>
                                )}
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => handleActionClick(action.id, action.title)}
                                  disabled={action.status === 'completed' || action.status === 'in_progress' || actionInProgress === action.id}
                                >
                                  {actionInProgress === action.id ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                      Applying...
                                    </>
                                  ) : action.status === 'completed' ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Applied
                                    </>
                                  ) : actionSuccess?.id === action.id ? (
                                    actionSuccess.status === 'completed' ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Success!
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Failed
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <PlayCircle className="h-3 w-3 mr-1" />
                                      Apply Fix
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <DialogFooter className="flex justify-between items-center border-t pt-4 mt-2">
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3"
                  onClick={refreshStatus}
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh Data
                </Button>
              </DialogFooter>

              <DialogFooter>
                {selectedComponent.status !== 'operational' && (
                  <div className="flex space-x-2 w-full justify-between">
                    <Button variant="outline" onClick={() => setSelectedComponent(null)}>
                      Cancel
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline">
                        <FileCog className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                      <Button>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Run Diagnostics
                      </Button>
                    </div>
                  </div>
                )}
                {selectedComponent.status === 'operational' && (
                  <Button variant="outline" onClick={() => setSelectedComponent(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Command View Modal */}
      <Dialog open={currentCommand !== null} onOpenChange={(open) => !open && closeCommandView()}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Command Preview</span>
            </DialogTitle>
            <DialogDescription>
              Review this command before executing it on the server
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4 font-mono text-sm overflow-x-auto">
            {currentCommand}
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={closeCommandView}>
              Close
            </Button>
            <Button 
              onClick={() => {
                // In a real app, this would copy to clipboard
                navigator.clipboard.writeText(currentCommand || '');
                toast({
                  title: "Command copied",
                  description: "The command has been copied to your clipboard"
                });
              }}
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}