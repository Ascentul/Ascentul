import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DownloadCloud, BarChart2, UserCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Define interfaces
interface OpenAILogEntry {
  userId: string | number;
  timestamp: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  endpoint?: string;
  status?: 'success' | 'error';
  error?: string;
}

interface ModelStats {
  requests: number;
  success_requests: number;
  error_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost: number;
}

interface UserStats {
  requests: number;
  total_tokens: number;
  models_used: string[];
  estimated_cost: number;
}

export default function AdminOpenAILogsPage() {
  const { isAdmin, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('logs');

  // Fetch OpenAI logs from API
  const { data: logs, isLoading: isLogsLoading, error: logsError } = useQuery<OpenAILogEntry[], Error>({
    queryKey: ['/api/admin/openai-logs'],
    queryFn: async () => {
      const response = await apiRequest({ url: '/api/admin/openai-logs' });
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch model stats from API
  const { data: modelStats, isLoading: isModelStatsLoading, error: modelStatsError } = useQuery<Record<string, ModelStats>, Error>({
    queryKey: ['/api/admin/openai-stats/models'],
    queryFn: async () => {
      const response = await apiRequest({ url: '/api/admin/openai-stats/models' });
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch user stats from API
  const { data: userStats, isLoading: isUserStatsLoading, error: userStatsError } = useQuery<Record<string, UserStats>, Error>({
    queryKey: ['/api/admin/openai-stats/users'],
    queryFn: async () => {
      const response = await apiRequest({ url: '/api/admin/openai-stats/users' });
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Function to handle log export
  const handleExportLogs = () => {
    window.open('/api/admin/openai-logs/export', '_blank');
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  // Format cost as dollars
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(5)}`;
  };

  // If user is not an admin, redirect to dashboard
  if (!isAuthLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = isLogsLoading || isModelStatsLoading || isUserStatsLoading;
  const hasError = logsError || modelStatsError || userStatsError;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">OpenAI API Usage Dashboard</h1>
        <Button
          onClick={handleExportLogs}
          variant="outline"
          className="flex items-center gap-2"
        >
          <DownloadCloud className="h-4 w-4" />
          Export as CSV
        </Button>
      </div>

      <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="logs">API Logs</TabsTrigger>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
          <TabsTrigger value="users">User Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>API Call Logs</CardTitle>
              <CardDescription>
                Review recent OpenAI API calls made by users in the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLogsLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : logsError ? (
                <div className="bg-destructive/20 text-destructive p-4 rounded-md">
                  Error loading logs: {logsError.message}
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>{log.userId}</TableCell>
                          <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell>{log.model}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              log.status === 'success' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {log.status || 'unknown'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {log.total_tokens.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No API logs found. Logs will appear here once users start using OpenAI features.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Statistics</CardTitle>
              <CardDescription>
                Review token usage and costs broken down by AI model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isModelStatsLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : modelStatsError ? (
                <div className="bg-destructive/20 text-destructive p-4 rounded-md">
                  Error loading model statistics: {modelStatsError.message}
                </div>
              ) : modelStats && Object.keys(modelStats).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Success Rate</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(modelStats).map(([modelId, stats]) => (
                        <TableRow key={modelId}>
                          <TableCell className="font-medium">{modelId}</TableCell>
                          <TableCell className="text-right">{stats.requests.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {stats.requests > 0 
                              ? `${((stats.success_requests / stats.requests) * 100).toFixed(1)}%` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">{stats.total_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{formatCost(stats.estimated_cost)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Calculate totals */}
                      {Object.values(modelStats).length > 0 && (
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">
                            {Object.values(modelStats).reduce((sum, stat) => sum + stat.requests, 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {Object.values(modelStats).reduce((sum, stat) => sum + stat.success_requests, 0) /
                              Object.values(modelStats).reduce((sum, stat) => sum + stat.requests, 0) * 100}%
                          </TableCell>
                          <TableCell className="text-right">
                            {Object.values(modelStats)
                              .reduce((sum, stat) => sum + stat.total_tokens, 0)
                              .toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCost(
                              Object.values(modelStats).reduce((sum, stat) => sum + stat.estimated_cost, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No model statistics available yet. They will appear here once users start using OpenAI features.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Usage Statistics</CardTitle>
              <CardDescription>
                Review token usage and costs broken down by user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUserStatsLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : userStatsError ? (
                <div className="bg-destructive/20 text-destructive p-4 rounded-md">
                  Error loading user statistics: {userStatsError.message}
                </div>
              ) : userStats && Object.keys(userStats).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead>Models Used</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(userStats).map(([userId, stats]) => (
                        <TableRow key={userId}>
                          <TableCell className="font-medium">{userId}</TableCell>
                          <TableCell className="text-right">{stats.requests.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{stats.total_tokens.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {stats.models_used.map(model => (
                                <span key={model} className="px-2 py-1 text-xs bg-primary/10 rounded-full">
                                  {model.split('-')[1] || model}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCost(stats.estimated_cost)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Calculate totals */}
                      {Object.values(userStats).length > 0 && (
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">
                            {Object.values(userStats)
                              .reduce((sum, stat) => sum + stat.requests, 0)
                              .toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {Object.values(userStats)
                              .reduce((sum, stat) => sum + stat.total_tokens, 0)
                              .toLocaleString()}
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="text-right">
                            {formatCost(
                              Object.values(userStats).reduce((sum, stat) => sum + stat.estimated_cost, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No user statistics available yet. They will appear here once users start using OpenAI features.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : logs ? (
                logs.length.toLocaleString()
              ) : (
                '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total OpenAI API calls tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens Used</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : logs ? (
                logs
                  .reduce((sum, log) => sum + log.total_tokens, 0)
                  .toLocaleString()
              ) : (
                '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all models and requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : modelStats ? (
                formatCost(
                  Object.values(modelStats).reduce(
                    (sum, stat) => sum + stat.estimated_cost,
                    0
                  )
                )
              ) : (
                '$0.00'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current OpenAI pricing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}