import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Building2,
  FileSpreadsheet,
  Calendar,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Mock data until we have API endpoints
const UNIVERSITY_COLORS = {
  primary: "#4F46E5",
  secondary: "#10B981",
  background: "#F9FAFB",
  border: "#E5E7EB",
};

// University Admin Dashboard
export default function UniversityAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: universityStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/university/stats"],
    queryFn: async () => {
      // Mock data for now
      return {
        totalStudents: 3241,
        activeLicenses: 3000,
        licenseCapacity: 5000,
        departments: 12,
        learningModules: 87,
        completedLearningModules: 2345,
        totalCourses: 205,
        studyPlans: 1564,
        averageCompletionRate: 76,
        recentActivity: [
          {
            id: 1,
            type: "enrollment",
            user: "John Doe",
            item: "Career Planning Fundamentals",
            date: "2025-03-28T10:30:00Z",
          },
          {
            id: 2,
            type: "completion",
            user: "Sarah Williams",
            item: "Interview Skills Workshop",
            date: "2025-03-28T09:15:00Z",
          },
          {
            id: 3,
            type: "new_student",
            user: "Michael Johnson",
            item: "Computer Science",
            date: "2025-03-27T16:45:00Z",
          },
          {
            id: 4,
            type: "study_plan",
            user: "Emily Brown",
            item: "Spring 2025 Semester Plan",
            date: "2025-03-27T14:20:00Z",
          },
          {
            id: 5,
            type: "achievement",
            user: "David Miller",
            item: "Resume Master",
            date: "2025-03-27T11:10:00Z",
          },
        ],
        departmentStats: [
          { name: "Computer Science", students: 540, modules: 18, completionRate: 82 },
          { name: "Business", students: 785, modules: 22, completionRate: 75 },
          { name: "Engineering", students: 620, modules: 16, completionRate: 79 },
          { name: "Arts & Humanities", students: 435, modules: 12, completionRate: 68 },
          { name: "Health Sciences", students: 390, modules: 14, completionRate: 81 },
          { name: "Sciences", students: 310, modules: 15, completionRate: 77 },
        ],
        moduleEngagement: [
          { name: "Resume Building", completed: 876, inProgress: 432 },
          { name: "Interview Prep", completed: 543, inProgress: 678 },
          { name: "Career Planning", completed: 765, inProgress: 345 },
          { name: "Job Search", completed: 432, inProgress: 234 },
          { name: "Networking", completed: 321, inProgress: 432 },
        ],
      };
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/university/students"],
    queryFn: async () => {
      const response = await fetch('/api/university/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
        {
          id: 1,
          name: "Emma Wilson",
          email: "emma.wilson@university.edu",
          department: "Computer Science",
          studentId: "CS2023145",
          gradYear: 2026,
          lastActive: "2025-03-28T11:43:00Z",
          progress: 68,
        },
        {
          id: 2,
          name: "James Smith",
          email: "james.smith@university.edu",
          department: "Business",
          studentId: "BZ2022098",
          gradYear: 2025,
          lastActive: "2025-03-28T10:15:00Z",
          progress: 92,
        },
        {
          id: 3,
          name: "Olivia Martinez",
          email: "olivia.m@university.edu",
          department: "Engineering",
          studentId: "EG2023047",
          gradYear: 2026,
          lastActive: "2025-03-27T16:30:00Z",
          progress: 43,
        },
        {
          id: 4,
          name: "William Johnson",
          email: "w.johnson@university.edu",
          department: "Arts & Humanities",
          studentId: "AH2022156",
          gradYear: 2025,
          lastActive: "2025-03-26T09:22:00Z",
          progress: 76,
        },
        {
          id: 5,
          name: "Sophia Lee",
          email: "sophia.lee@university.edu",
          department: "Health Sciences",
          studentId: "HS2024023",
          gradYear: 2027,
          lastActive: "2025-03-28T08:50:00Z",
          progress: 21,
        },
      ];
    },
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/university/learning-modules"],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          title: "Career Planning Fundamentals",
          department: "Career Center",
          category: "Career Development",
          level: "Beginner",
          enrollments: 543,
          completionRate: 76,
          published: true,
        },
        {
          id: 2,
          title: "Advanced Resume Workshop",
          department: "Career Center",
          category: "Document Preparation",
          level: "Intermediate",
          enrollments: 412,
          completionRate: 82,
          published: true,
        },
        {
          id: 3,
          title: "Technical Interview Skills",
          department: "Computer Science",
          category: "Interview Preparation",
          level: "Advanced",
          enrollments: 326,
          completionRate: 68,
          published: true,
        },
        {
          id: 4,
          title: "Business Networking Essentials",
          department: "Business",
          category: "Professional Skills",
          level: "Intermediate",
          enrollments: 289,
          completionRate: 71,
          published: true,
        },
        {
          id: 5,
          title: "Portfolio Development for Arts",
          department: "Arts & Humanities",
          category: "Document Preparation",
          level: "Intermediate",
          enrollments: 178,
          completionRate: 59,
          published: false,
        },
      ];
    },
  });

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["/api/university/departments"],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          name: "Computer Science",
          code: "CS",
          students: 540,
          modules: 18,
          administrators: ["Dr. Alan Turing", "Dr. Ada Lovelace"],
        },
        {
          id: 2,
          name: "Business",
          code: "BZ",
          students: 785,
          modules: 22,
          administrators: ["Dr. Peter Drucker", "Dr. Mary Parker"],
        },
        {
          id: 3,
          name: "Engineering",
          code: "EG",
          students: 620,
          modules: 16,
          administrators: ["Dr. Nikola Tesla", "Dr. Grace Hopper"],
        },
        {
          id: 4,
          name: "Arts & Humanities",
          code: "AH",
          students: 435,
          modules: 12,
          administrators: ["Dr. Leonardo Vinci", "Dr. Virginia Woolf"],
        },
        {
          id: 5,
          name: "Health Sciences",
          code: "HS",
          students: 390,
          modules: 14,
          administrators: ["Dr. Jonas Salk", "Dr. Elizabeth Blackwell"],
        },
      ];
    },
  });

  // Chart colors
  const COLORS = ["#4F46E5", "#10B981", "#EC4899", "#F59E0B", "#6366F1", "#8B5CF6"];

  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "completion":
        return <Award className="h-4 w-4 text-green-500" />;
      case "new_student":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "study_plan":
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-pink-500" />;
      default:
        return <FileSpreadsheet className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  };

  // Loading state
  if (statsLoading || studentsLoading || modulesLoading || departmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">University Administration</h1>
          <p className="text-muted-foreground">
            Manage student licenses, learning modules, and performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button>
            <GraduationCap className="mr-2 h-4 w-4" />
            Add Student Licenses
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="modules">Learning Modules</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{universityStats?.totalStudents?.toLocaleString() || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Across {universityStats?.departments || 0} departments
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">License Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {universityStats?.activeLicenses?.toLocaleString() || 0} / {universityStats?.licenseCapacity?.toLocaleString() || 0}
                  </div>
                </div>
                <Progress 
                  value={universityStats?.activeLicenses && universityStats?.licenseCapacity 
                    ? (universityStats.activeLicenses / universityStats.licenseCapacity) * 100 
                    : 0
                  } 
                  className="mt-2 h-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Learning Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{universityStats?.learningModules?.toLocaleString() || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {universityStats?.completedLearningModules?.toLocaleString() || 0} module completions
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{universityStats?.averageCompletionRate || 0}%</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Average across all modules
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Student completion rates by department</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={universityStats?.departmentStats}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill={UNIVERSITY_COLORS.primary} name="Completion Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Module Engagement</CardTitle>
                <CardDescription>Completed vs. in-progress modules</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={universityStats?.moduleEngagement}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="completed" stackId="a" fill={UNIVERSITY_COLORS.primary} name="Completed" />
                    <Bar dataKey="inProgress" stackId="a" fill={UNIVERSITY_COLORS.secondary} name="In Progress" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest student actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {universityStats?.recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="bg-muted rounded-full p-2">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.date)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === "enrollment" && `Enrolled in "${activity.item}"`}
                        {activity.type === "completion" && `Completed "${activity.item}"`}
                        {activity.type === "new_student" && `New student in ${activity.item}`}
                        {activity.type === "study_plan" && `Created study plan: ${activity.item}`}
                        {activity.type === "achievement" && `Earned achievement: ${activity.item}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage student accounts and progress</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">Import Students</Button>
                  <Button>Add Student</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Grad Year</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div>
                          {student.name}
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.gradYear}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="h-2 w-20" />
                          <span className="text-xs">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatRelativeTime(student.lastActive)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing 5 of {universityStats?.totalStudents || 0} students
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Learning Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Learning Modules</CardTitle>
                  <CardDescription>Create and manage educational content</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">Import Modules</Button>
                  <Button>Create Module</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules?.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.title}</TableCell>
                      <TableCell>{module.department}</TableCell>
                      <TableCell>{module.category}</TableCell>
                      <TableCell>{module.level}</TableCell>
                      <TableCell>{module.enrollments}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={module.completionRate} className="h-2 w-20" />
                          <span className="text-xs">{module.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {module.published ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-800">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing 5 of {universityStats?.learningModules || 0} modules
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage academic departments</CardDescription>
                </div>
                <Button>Add Department</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments?.map((dept) => (
                  <Card key={dept.id} className="border bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <Badge variant="outline">{dept.code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">{dept.students}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Learning Modules:</span>
                          <span className="font-medium">{dept.modules}</span>
                        </div>
                        <div className="pt-1">
                          <p className="text-sm text-muted-foreground mb-1">Administrators:</p>
                          <div className="flex flex-wrap gap-1">
                            {dept.administrators?.map((admin, idx) => (
                              <Badge key={idx} variant="secondary" className="font-normal">
                                {admin}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-0">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}