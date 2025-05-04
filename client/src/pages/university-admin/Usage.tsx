import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AcademicProgram } from './Settings';
import { Loader2 } from 'lucide-react';
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart2, 
  TrendingUp, 
  Users, 
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Mock data for usage statistics
const monthlyUsageData = [
  { name: 'Jan', logins: 1200, activities: 3800, resumes: 320, interviews: 150 },
  { name: 'Feb', logins: 1350, activities: 4100, resumes: 350, interviews: 180 },
  { name: 'Mar', logins: 1500, activities: 4300, resumes: 380, interviews: 210 },
  { name: 'Apr', logins: 1650, activities: 4600, resumes: 410, interviews: 240 },
  { name: 'May', logins: 1800, activities: 5000, resumes: 450, interviews: 270 },
];

const programUsageData = [
  { name: 'Computer Science (BS)', value: 420, color: '#8884d8' },
  { name: 'Engineering (BS)', value: 350, color: '#83a6ed' },
  { name: 'Business Admin (BS)', value: 280, color: '#8dd1e1' },
  { name: 'Computer Science (MS)', value: 250, color: '#82ca9d' },
  { name: 'MBA', value: 200, color: '#a4de6c' },
  { name: 'Others', value: 150, color: '#d0ed57' },
];

const featureUsageData = [
  { name: 'Resume Builder', value: 420 },
  { name: 'Career Paths', value: 350 },
  { name: 'Interview Prep', value: 280 },
  { name: 'AI Coaching', value: 250 },
  { name: 'Job Applications', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C'];

const usageBreakdown = [
  { id: 1, feature: 'Resume Builder', usage: 4250, change: '+12%', status: 'increase' },
  { id: 2, feature: 'Career Path Explorer', usage: 3570, change: '+8%', status: 'increase' },
  { id: 3, feature: 'Mock Interviews', usage: 2840, change: '+15%', status: 'increase' },
  { id: 4, feature: 'AI Coaching', usage: 2350, change: '+20%', status: 'increase' },
  { id: 5, feature: 'Job Applications', usage: 1920, change: '-3%', status: 'decrease' },
  { id: 6, feature: 'Skills Assessment', usage: 1650, change: '+5%', status: 'increase' },
  { id: 7, feature: 'Portfolio Builder', usage: 1280, change: '+2%', status: 'increase' },
  { id: 8, feature: 'Cover Letter Generator', usage: 960, change: '+18%', status: 'increase' },
];

// Schema for the schedule report form
const scheduleReportSchema = z.object({
  reportName: z.string().min(1, "Report name is required"),
  reportDescription: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly"]),
  recipients: z.string()
    .min(1, "Recipients are required")
    .refine(val => {
      // Simple email list validation with regex
      const emails = val.split(",").map(email => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emails.every(email => emailRegex.test(email));
    }, "Please enter valid emails separated by commas"),
  dataSelection: z.object({
    overview: z.boolean().default(true),
    features: z.boolean().default(true),
    programs: z.boolean().default(true),
  }),
});

type ScheduleReportFormValues = z.infer<typeof scheduleReportSchema>;

export default function Usage() {
  const [dateRange, setDateRange] = useState('last30Days');
  const [programFilter, setProgramFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<ScheduleReportFormValues>({
    resolver: zodResolver(scheduleReportSchema),
    defaultValues: {
      reportName: '',
      reportDescription: '',
      frequency: 'monthly',
      recipients: '',
      dataSelection: {
        overview: true,
        features: true,
        programs: true,
      },
    },
  });
  
  // Handler for scheduling reports
  const onScheduleReport = async (data: ScheduleReportFormValues) => {
    setIsScheduling(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would be an API request:
      // await apiRequest('POST', '/api/schedule-report', data);
      
      console.log('Scheduled report:', data);
      
      // Add to the Recent Reports section (would be done via API/DB in a real implementation)
      const now = new Date();
      const reportDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
      
      // Show success toast
      toast({
        title: "Report Scheduled",
        description: `"${data.reportName}" will be generated ${data.frequency === 'once' ? 'once' : data.frequency}`,
        variant: "default",
      });
      
      // Reset form and close dialog
      form.reset();
      setScheduleDialogOpen(false);
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast({
        title: "Error",
        description: "Failed to schedule the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };
  
  // Function to convert data to CSV format
  const convertToCSV = (data: any[], headerMap: Record<string, string>) => {
    // Get all unique keys from all objects in data
    const allKeys = Array.from(
      new Set(
        data.flatMap(item => Object.keys(item))
      )
    ).filter(key => headerMap[key]); // Only include keys that have headers defined
    
    // Create header row
    const headerRow = allKeys.map(key => headerMap[key]).join(',');
    
    // Create data rows
    const dataRows = data.map(item => {
      return allKeys.map(key => {
        // Handle commas and quotes in the data
        const value = item[key] !== undefined ? item[key] : '';
        const stringValue = String(value);
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
  };
  
  // Handler for exporting data
  const handleExportData = () => {
    setIsExporting(true);
    
    try {
      // Define headers for different datasets
      const monthlyHeaders = {
        name: 'Month',
        logins: 'Total Logins',
        activities: 'Activities',
        resumes: 'Resumes Created',
        interviews: 'Interviews Conducted'
      };
      
      const programHeaders = {
        name: 'Program Name',
        value: 'Usage Count'
      };
      
      const featureHeaders = {
        name: 'Feature Name',
        value: 'Usage Count'
      };
      
      const usageBreakdownHeaders = {
        feature: 'Feature',
        usage: 'Usage Count',
        change: 'Change',
        status: 'Status'
      };
      
      // Get date for filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Combine all data into sections
      let csvContent = '# Ascentul University Usage Data Export\n';
      csvContent += `# Generated: ${now.toLocaleString()}\n\n`;
      
      // Add monthly data
      csvContent += '## Monthly Usage Data\n';
      csvContent += convertToCSV(monthlyUsageData, monthlyHeaders);
      csvContent += '\n\n';
      
      // Add program usage data
      csvContent += '## Program Usage Data\n';
      csvContent += convertToCSV(programUsageData, programHeaders);
      csvContent += '\n\n';
      
      // Add feature usage data
      csvContent += '## Feature Usage Data\n';
      csvContent += convertToCSV(featureUsageData, featureHeaders);
      csvContent += '\n\n';
      
      // Add usage breakdown
      csvContent += '## Usage Breakdown\n';
      csvContent += convertToCSV(usageBreakdown, usageBreakdownHeaders);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `university_usage_report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 100);
    } catch (error) {
      console.error('Error exporting data:', error);
      setIsExporting(false);
    }
  };
  
  // Fetch academic programs from API
  const { 
    data: academicPrograms = [], 
    isLoading: programsLoading, 
    error: programsError 
  } = useQuery({
    queryKey: ['/api/academic-programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/academic-programs');
      if (!response.ok) {
        throw new Error('Failed to fetch academic programs');
      }
      return await response.json();
    }
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Usage</h1>
        <p className="text-muted-foreground">
          Monitor and analyze how students are using the Ascentul Career Development Platform.
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">Last 7 days</SelectItem>
              <SelectItem value="last30Days">Last 30 days</SelectItem>
              <SelectItem value="last90Days">Last 90 days</SelectItem>
              <SelectItem value="lastYear">Last year</SelectItem>
              <SelectItem value="allTime">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[220px]">
              <Layers className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading programs...</span>
                </div>
              ) : programsError ? (
                <div className="text-red-500 p-2 text-sm">
                  Error loading programs
                </div>
              ) : academicPrograms.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No programs found
                </div>
              ) : (
                academicPrograms.map((program: AcademicProgram) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.programName} ({program.degreeType})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setScheduleDialogOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Usage Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Logins
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,437</div>
            <p className="text-xs text-muted-foreground">
              +12% from previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,280</div>
            <p className="text-xs text-muted-foreground">
              85% of total students
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Session Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 min</div>
            <p className="text-xs text-muted-foreground">
              +5 min from previous period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feature Usage
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16,750</div>
            <p className="text-xs text-muted-foreground">
              +18% from previous period
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Usage Data */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>
                Student activity trends over the past 5 months.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyUsageData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="logins" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activities" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resumes" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="interviews" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Feature Usage Distribution</CardTitle>
                <CardDescription>
                  Breakdown of features used by students.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureUsageData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" label={{ position: 'top' }}>
                      {featureUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Feature Popularity</CardTitle>
                <CardDescription>
                  Most used features on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featureUsageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {featureUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feature Usage</CardTitle>
              <CardDescription>
                Breakdown of feature usage with change from previous period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-2">Feature</th>
                      <th className="text-right font-medium p-2">Usage Count</th>
                      <th className="text-right font-medium p-2">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageBreakdown.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.feature}</td>
                        <td className="text-right p-2">{item.usage.toLocaleString()}</td>
                        <td className="text-right p-2">
                          <Badge variant={item.status === 'increase' ? 'default' : 'destructive'}>
                            {item.change}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Program</CardTitle>
                <CardDescription>
                  Distribution of platform usage across different programs.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={programUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {programUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Program</CardTitle>
                <CardDescription>
                  Average engagement score by academic program.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={programUsageData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      scale="band" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {programUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Program Engagement Details</CardTitle>
              <CardDescription>
                Comparison of key metrics across different academic programs.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyUsageData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="logins" stackId="a" fill="#8884d8" />
                  <Bar dataKey="activities" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="resumes" stackId="a" fill="#ffc658" />
                  <Bar dataKey="interviews" stackId="a" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Access and download previously generated reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-2">Report Name</th>
                  <th className="text-left font-medium p-2">Date</th>
                  <th className="text-left font-medium p-2">Type</th>
                  <th className="text-right font-medium p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">April 2025 Monthly Usage Report</td>
                  <td className="p-2">May 01, 2025</td>
                  <td className="p-2">
                    <Badge variant="outline">Monthly</Badge>
                  </td>
                  <td className="text-right p-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Feature Engagement Analysis Q1</td>
                  <td className="p-2">Apr 15, 2025</td>
                  <td className="p-2">
                    <Badge variant="outline">Quarterly</Badge>
                  </td>
                  <td className="text-right p-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Program Comparison Report</td>
                  <td className="p-2">Apr 10, 2025</td>
                  <td className="p-2">
                    <Badge variant="outline">Custom</Badge>
                  </td>
                  <td className="text-right p-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Annual Usage Summary 2024</td>
                  <td className="p-2">Jan 15, 2025</td>
                  <td className="p-2">
                    <Badge variant="outline">Annual</Badge>
                  </td>
                  <td className="text-right p-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Schedule Report Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule New Report</DialogTitle>
            <DialogDescription>
              Create a scheduled report that will be automatically generated and distributed.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onScheduleReport)} className="space-y-5">
              <FormField
                control={form.control}
                name="reportName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Usage Summary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Monthly summary of platform usage and engagement metrics"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipients</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="email@university.edu, dept@university.edu" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Separate multiple email addresses with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border rounded-md p-4">
                <div className="font-medium mb-2">Data to Include</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="dataSelection.overview"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Overview Metrics
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dataSelection.features"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Feature Analysis
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dataSelection.programs"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Program Breakdown
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isScheduling}>
                  {isScheduling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Schedule Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}