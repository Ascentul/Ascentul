import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useUser } from "@/lib/useUserData";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { 
  Users, 
  GraduationCap, 
  CalendarDays, 
  TrendingUp, 
  Bell, 
  FileText, 
  BookOpen, 
  Activity, 
  Calendar, 
  Mail, 
  MessageSquare,
  Loader2,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// Mock data for the dashboard
interface UniversityStats {
  totalStudents: number;
  activeStudents: number;
  totalSeats: number;
  contractExpirationDate: string;
  avgEngagementScore: number;
  recentLogins: RecentLogin[];
}

interface RecentLogin {
  id: number;
  studentName: string;
  email: string;
  lastLoginTime: string;
  profileImage?: string;
}

// Data for charts
const usageData = [
  { name: 'Jan', logins: 1200, activities: 3400 },
  { name: 'Feb', logins: 1350, activities: 3800 },
  { name: 'Mar', logins: 1500, activities: 4200 },
  { name: 'Apr', logins: 1650, activities: 4600 },
  { name: 'May', logins: 1800, activities: 5000 },
];

const featureUsageData = [
  { name: 'Resume Builder', value: 420 },
  { name: 'Career Paths', value: 350 },
  { name: 'Interview Prep', value: 280 },
  { name: 'AI Coaching', value: 250 },
  { name: 'Job Search', value: 200 },
];

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

// Define validation schema for email form
const emailFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function Dashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });
  
  // Handle email form submission
  const handleSendEmail = async (data: EmailFormValues) => {
    setIsSending(true);
    
    try {
      // In a real application, this would make an API call
      // await apiRequest('POST', '/api/email/send-mass', {
      //   subject: data.subject,
      //   message: data.message,
      //   recipients: 'all'
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email Sent Successfully",
        description: `Email sent to all students with subject "${data.subject}"`,
        variant: "default",
      });
      
      form.reset();
      setEmailDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsSending(false);
  };

  // Mock stats for the university
  const mockStats: UniversityStats = {
    totalStudents: 1500,
    activeStudents: 1280,
    totalSeats: 2000,
    contractExpirationDate: 'May 15, 2026',
    avgEngagementScore: 7.8,
    recentLogins: [
      {
        id: 1,
        studentName: 'Emma Johnson',
        email: 'emma.johnson@stanford.edu',
        lastLoginTime: '2 minutes ago',
        profileImage: 'https://i.pravatar.cc/150?img=1'
      },
      {
        id: 2,
        studentName: 'Michael Chang',
        email: 'michael.chang@stanford.edu',
        lastLoginTime: '15 minutes ago',
        profileImage: 'https://i.pravatar.cc/150?img=2'
      },
      {
        id: 3,
        studentName: 'Sophia Martinez',
        email: 'sophia.martinez@stanford.edu',
        lastLoginTime: '37 minutes ago',
        profileImage: 'https://i.pravatar.cc/150?img=3'
      },
      {
        id: 4,
        studentName: 'James Wilson',
        email: 'james.wilson@stanford.edu',
        lastLoginTime: '1 hour ago',
        profileImage: 'https://i.pravatar.cc/150?img=4'
      },
      {
        id: 5,
        studentName: 'Olivia Brown',
        email: 'olivia.brown@stanford.edu',
        lastLoginTime: '2 hours ago',
        profileImage: 'https://i.pravatar.cc/150?img=5'
      }
    ]
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {user?.universityName || 'Stanford University'}'s platform usage and student engagement.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockStats.activeStudents / mockStats.totalStudents) * 100)}% active this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              License Utilization
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalStudents}/{mockStats.totalSeats}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockStats.totalStudents / mockStats.totalSeats) * 100)}% of licensed seats used
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contract Expiration
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.contractExpirationDate}</div>
            <p className="text-xs text-muted-foreground">
              One year institutional license
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Engagement Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avgEngagementScore}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Platform Usage</CardTitle>
            <CardDescription>
              Monthly logins and activities over the last 5 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={usageData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="logins" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="activities" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>
              Most popular features among students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featureUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {featureUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Recent Logins */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Recent Student Logins</CardTitle>
            <CardDescription>
              Students who recently accessed the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.recentLogins.map(login => (
                <div key={login.id} className="flex items-center">
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src={login.profileImage} alt={login.studentName} />
                    <AvatarFallback>{getInitials(login.studentName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{login.studentName}</p>
                    <p className="text-sm text-muted-foreground">{login.email}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{login.lastLoginTime}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events & Notifications */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Recent alerts and upcoming events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">License Renewal Reminder</p>
                  <p className="text-sm text-muted-foreground">Your institutional license expires in 375 days</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Monthly Usage Report</p>
                  <p className="text-sm text-muted-foreground">May 2025 report has been generated</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Career Fair Scheduled</p>
                  <p className="text-sm text-muted-foreground">May 15, 2025 - Reminder sent to all students</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">New Learning Module Available</p>
                  <p className="text-sm text-muted-foreground">Interview Preparation course now available</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Engagement Milestone</p>
                  <p className="text-sm text-muted-foreground">Over 1,000 resumes created this month!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button 
          className="h-auto py-4 flex flex-col items-center justify-center gap-2" 
          variant="outline"
          onClick={() => setEmailDialogOpen(true)}
        >
          <Mail className="h-6 w-6" />
          <span>Email All Students</span>
        </Button>
        <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline">
          <FileText className="h-6 w-6" />
          <span>Download Reports</span>
        </Button>
        <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline">
          <MessageSquare className="h-6 w-6" />
          <span>Support Chat</span>
        </Button>
      </div>
      
      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Email All Students</DialogTitle>
            <DialogDescription>
              Send an email to all students enrolled in your university.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendEmail)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here..."
                        className="min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setEmailDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
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