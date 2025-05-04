import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  LineChart,
  BarChart3, 
  LineChart as LineChartIcon, 
  Download, 
  Calendar, 
  User, 
  Layers, 
  FileText, 
  Share2, 
  BrainCircuit, 
  Briefcase,
  BookOpen,
  Clock
} from 'lucide-react';

// Define types for usage data
interface FeatureUsage {
  name: string;
  usageCount: number;
  percentageIncrease: number;
  icon: React.ReactNode;
}

interface TopPerformer {
  id: number;
  name: string;
  email: string;
  metric: string;
  value: number;
  change: number;
}

export default function UsageAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Feature usage data
  const featureUsage: FeatureUsage[] = [
    {
      name: 'Resume Builder',
      usageCount: 547,
      percentageIncrease: 12,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      name: 'Career Paths',
      usageCount: 423,
      percentageIncrease: 8,
      icon: <Layers className="h-4 w-4" />,
    },
    {
      name: 'AI Coach',
      usageCount: 389,
      percentageIncrease: 24,
      icon: <BrainCircuit className="h-4 w-4" />,
    },
    {
      name: 'Job Applications',
      usageCount: 312,
      percentageIncrease: 15,
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      name: 'Interview Practice',
      usageCount: 278,
      percentageIncrease: 32,
      icon: <User className="h-4 w-4" />,
    },
    {
      name: 'Resource Library',
      usageCount: 256,
      percentageIncrease: 5,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      name: 'Skills Assessment',
      usageCount: 201,
      percentageIncrease: 18,
      icon: <Share2 className="h-4 w-4" />,
    },
    {
      name: 'Time Tracking',
      usageCount: 187,
      percentageIncrease: -3,
      icon: <Clock className="h-4 w-4" />,
    },
  ];
  
  // Top performers data
  const topPerformers: TopPerformer[] = [
    {
      id: 1,
      name: 'Sofia Rodriguez',
      email: 's.rodriguez@university.edu',
      metric: 'Platform Engagement',
      value: 92,
      change: 8,
    },
    {
      id: 2,
      name: 'Carlos Diaz',
      email: 'cdiaz@university.edu',
      metric: 'Career Path Progress',
      value: 81,
      change: 5,
    },
    {
      id: 3,
      name: 'Priya Patel',
      email: 'ppatel@university.edu',
      metric: 'Resume Completeness',
      value: 87,
      change: 12,
    },
    {
      id: 4,
      name: 'Emma Thompson',
      email: 'emma.t@university.edu',
      metric: 'Skills Development',
      value: 78,
      change: 4,
    },
    {
      id: 5,
      name: 'Hannah Lee',
      email: 'hlee@university.edu',
      metric: 'Resource Utilization',
      value: 76,
      change: 9,
    },
  ];
  
  // Used seats over time data
  // This would typically come from an API
  const usageData = {
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Active Seats',
        data: [65, 72, 78, 85, 81, 90, 95, 98, 98],
      },
      {
        label: 'Total Allocated',
        data: [150, 150, 150, 150, 150, 150, 150, 150, 150],
      }
    ]
  };
  
  // Chart placeholder component
  const ChartPlaceholder = ({ type }: { type: 'bar' | 'line' }) => {
    return (
      <div className="h-64 md:h-80 flex items-center justify-center border rounded-lg bg-muted/20">
        <div className="text-center">
          {type === 'bar' ? (
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
          ) : (
            <LineChartIcon className="h-16 w-16 mx-auto text-muted-foreground" />
          )}
          <p className="text-muted-foreground mt-2">Chart visualization will appear here</p>
          <p className="text-xs text-muted-foreground">Data is being processed</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor student engagement and platform utilization metrics.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select
            defaultValue={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="semester">Current Semester</SelectItem>
              <SelectItem value="year">Academic Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+3%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76/100</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+4 points</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23m 14s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+2m 42s</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Seat Utilization</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65.3%</div>
            <p className="text-xs text-muted-foreground">
              98 of 150 allocated seats
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Usage Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-white">Feature Usage</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-white">Student Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seat Utilization Over Time</CardTitle>
              <CardDescription>
                Track how many of your allocated seats are being actively used.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartPlaceholder type="line" />
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Students with highest engagement and achievement metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((performer) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {performer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">{performer.metric}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{performer.value}/100</p>
                        <p className="text-xs text-green-500">+{performer.change}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Features</CardTitle>
                <CardDescription>
                  Most frequently used platform features by students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featureUsage.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {feature.icon}
                        </div>
                        <span className="font-medium text-sm">{feature.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{feature.usageCount}</span>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            feature.percentageIncrease > 0 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {feature.percentageIncrease > 0 ? '+' : ''}{feature.percentageIncrease}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of how students are utilizing platform features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Usage by Feature</h3>
                  <ChartPlaceholder type="bar" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
                  <ChartPlaceholder type="line" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Feature Breakdown</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {featureUsage.map((feature, index) => (
                    <Card key={index} className="bg-muted/20">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {feature.icon}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${
                              feature.percentageIncrease > 0 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {feature.percentageIncrease > 0 ? '+' : ''}{feature.percentageIncrease}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-2xl font-bold mt-1">{feature.usageCount}</p>
                        <p className="text-xs text-muted-foreground">total uses</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Engagement Analytics</CardTitle>
              <CardDescription>
                Track engagement patterns and identify areas for improvement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Engagement by Class Year</h3>
                  <ChartPlaceholder type="bar" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Engagement by Major</h3>
                  <ChartPlaceholder type="bar" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Student Activity Timeline</h3>
                <ChartPlaceholder type="line" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Student Segments</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <Card className="bg-muted/20">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">High Engagers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-3xl font-bold">32</div>
                      <p className="text-sm text-muted-foreground">students</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Students who log in at least 4x per week and use multiple features
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/20">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Moderate Engagers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-3xl font-bold">48</div>
                      <p className="text-sm text-muted-foreground">students</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Students who log in 1-3x per week and use core features
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/20">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">At Risk</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-3xl font-bold">18</div>
                      <p className="text-sm text-muted-foreground">students</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Students who haven't logged in for 2+ weeks or show minimal activity
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}