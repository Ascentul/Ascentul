import { useState } from 'react';
import React from 'react';
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
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  PlayCircle,
  ExternalLink,
  AlertCircle,
  FileCog,
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
        title: string;
        description: string;
        severity: string;
        timeDetected: string;
        suggestedAction?: string;
      }[];
      logs?: {
        timestamp: string;
        message: string;
        level: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<typeof systemStatus.components[0] | null>(null);
  
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
              title: 'Occasional timeout on heavy requests',
              description: 'Some complex queries experience timeouts during peak loads.',
              severity: 'low',
              timeDetected: '2 days ago',
              suggestedAction: 'Implement request caching for complex operations'
            }
          ],
          logs: [
            { timestamp: '13:21:05', message: 'Rate limiting applied to IP 192.168.1.45', level: 'warning' },
            { timestamp: '11:42:32', message: 'API versioning update completed', level: 'info' }
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
              title: 'Database query performance degraded',
              description: 'Elevated query times caused by index fragmentation and increasing table sizes.',
              severity: 'medium',
              timeDetected: '15 hours ago',
              suggestedAction: 'Run VACUUM ANALYZE on primary tables and rebuild indexes'
            },
            { 
              title: 'Connection pool nearing capacity',
              description: 'High number of concurrent connections during peak hours.',
              severity: 'low',
              timeDetected: '2 days ago',
              suggestedAction: 'Increase max_connections parameter and implement connection pooling'
            }
          ],
          logs: [
            { timestamp: '14:35:22', message: 'Slow query detected: SELECT * FROM interview_processes WHERE...', level: 'warning' },
            { timestamp: '12:18:43', message: 'Temporary disk space shortage during backup', level: 'warning' },
            { timestamp: '08:42:15', message: 'Automated backup completed successfully', level: 'info' }
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

  // Function to handle actions for specific issues
  const handleActionClick = (action: string) => {
    // In a real app, this would trigger API calls or execute commands
    alert(`Action initiated: ${action}`);
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
                                onClick={() => handleActionClick(issue.suggestedAction || '')}
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
                              ? 'text-yellow-600'
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
              </div>
              
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
    </>
  );
}