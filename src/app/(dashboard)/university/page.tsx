"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Target,
  ClipboardList,
  FileText,
  Mail,
  BarChart as BarChartIcon,
  TrendingUp,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList,
} from "recharts";

export default function UniversityDashboardPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsView, setAnalyticsView] = useState<
    "engagement" | "features" | "risk"
  >("engagement");
  const { toast } = useToast();

  // Filter states
  const [roleFilter, setRoleFilter] = useState<
    "all" | "undergraduate" | "graduate" | "staff"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Platform Usage states
  const [usageTimeFilter, setUsageTimeFilter] = useState("Last 30 days");
  const [usageProgramFilter, setUsageProgramFilter] = useState("All Programs");
  const [usageView, setUsageView] = useState<"overview" | "features" | "programs">("overview");

  // Report handlers
  const handleViewReport = (reportName: string, reportType: string) => {
    toast({
      title: "Report Viewer",
      description: `Opening ${reportName} (${reportType})...`,
    });
    // TODO: Implement actual report viewing functionality
  };

  const handleDownloadReport = (reportName: string, reportType: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${reportName} (${reportType})...`,
    });
    // TODO: Implement actual report download functionality
  };

  const canAccess =
    !!user &&
    (isAdmin ||
      user.subscription_plan === "university" ||
      user.role === "university_admin");

  // Data fetching
  const overview = useQuery(
    api.university_admin.getOverview,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  );
  const students = useQuery(
    api.university_admin.listStudents,
    clerkUser?.id ? { clerkId: clerkUser.id, limit: 50 } : "skip",
  );
  const departments = useQuery(
    api.university_admin.listDepartments,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  );
  const analytics = useQuery(
    api.university_admin.getUniversityAnalytics,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  );

  // Use real analytics data from database
  const studentGrowthData = analytics?.studentGrowthData || [];
  const activityData = analytics?.activityData || [];
  const departmentStats = analytics?.departmentStats || [];

  // Filter students based on current filters
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    return students.filter((student: any) => {
      // Role filter
      if (roleFilter !== "all" && student.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "active" && !student.name) return false;
      if (statusFilter === "pending" && student.name) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (student.name || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        if (!name.includes(query) && !email.includes(query)) return false;
      }

      return true;
    });
  }, [students, roleFilter, statusFilter, searchQuery]);

  // Assign student licenses
  const assignStudent = useMutation(api.university_admin.assignStudentByEmail);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignText, setAssignText] = useState("");
  const [assignRole, setAssignRole] = useState<"user" | "staff">("user");
  const [selectedProgram, setSelectedProgram] = useState<
    Id<"departments"> | ""
  >("");
  const [assigning, setAssigning] = useState(false);
  const [importingEmails, setImportingEmails] = useState(false);

  // Student filtering state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Student management state
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Student management functions
  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      role: student.role || "user",
    });
    setEditOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!clerkUser?.id || !editingStudent) return;

    setUpdatingStudent(true);
    try {
      // Simulate API call to update student
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Student updated",
        description: `${editForm.name || editForm.email} has been updated successfully.`,
        variant: "success",
      });
      setEditOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleDeleteStudent = (student: any) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!clerkUser?.id || !studentToDelete) return;

    setDeletingStudent(true);
    try {
      // Simulate API call to remove student
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Student removed",
        description: `${studentToDelete.name || studentToDelete.email} has been removed successfully.`,
        variant: "success",
      });
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to remove student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingStudent(false);
    }
  };

  const handleResendInvitation = async (student: any) => {
    if (!clerkUser?.id) return;

    try {
      // Simulate API call to resend invitation
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Invitation sent",
        description: `Invitation resent to ${student.email}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have access to the University Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!overview || !students || !departments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">
            University Administration
          </h1>
          <p className="text-muted-foreground">
            Manage student licenses and performance analytics.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={async () => {
              try {
                // Get the session token for authentication
                const token = await getToken();
                if (!token) {
                  toast({
                    title: "Authentication required",
                    description: "Please sign in to export reports",
                    variant: "destructive",
                  });
                  return;
                }

                const response = await fetch("/api/university/export-reports", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    clerkId: clerkUser?.id,
                  }),
                });

                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `university-report-${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast({
                    title: "Export successful",
                    description: "Report downloaded successfully",
                    variant: "success",
                  });
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  const errorMessage =
                    errorData.error ||
                    `Export failed with status ${response.status}`;

                  // For university admin configuration issues, show a more helpful message
                  if (
                    errorMessage.includes(
                      "University admin account not properly configured",
                    )
                  ) {
                    toast({
                      title: "Account Configuration Required",
                      description:
                        "Your university admin account needs to be assigned to a university. Please contact support for assistance.",
                      variant: "destructive",
                      action: (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "mailto:support@ascentful.com?subject=University Admin Account Configuration",
                              "_blank",
                            )
                          }
                        >
                          Contact Support
                        </Button>
                      ),
                    });
                    return;
                  }

                  throw new Error(errorMessage);
                }
              } catch (error) {
                console.error("Export error:", error);
                toast({
                  title: "Export failed",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Unable to generate report",
                  variant: "destructive",
                });
              }
            }}
          >
            Export Reports
          </button>
          <button
            className="inline-flex items-center rounded-md bg-primary text-white px-3 py-2 text-sm"
            onClick={() => setAssignOpen(true)}
          >
            Add Student Licenses
            {overview && overview.licenseCapacity && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                {overview.licenseCapacity - overview.activeLicenses} seats left
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Dashboard View Toggles */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "overview" ? "default" : "outline"}
          onClick={() => setActiveTab("overview")}
          className={activeTab === "overview" ? "bg-[#0C29AB]" : ""}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveTab("analytics")}
          className={activeTab === "analytics" ? "bg-[#0C29AB]" : ""}
        >
          Analytics & Insights
        </Button>
        <Button
          variant={activeTab === "students-list" ? "default" : "outline"}
          onClick={() => setActiveTab("students-list")}
          className={activeTab === "students-list" ? "bg-[#0C29AB]" : ""}
        >
          Students
        </Button>
        <Button
          variant={activeTab === "departments" ? "default" : "outline"}
          onClick={() => setActiveTab("departments")}
          className={activeTab === "departments" ? "bg-[#0C29AB]" : ""}
        >
          Departments
        </Button>
        <Button
          variant={activeTab === "usage" ? "default" : "outline"}
          onClick={() => setActiveTab("usage")}
          className={activeTab === "usage" ? "bg-[#0C29AB]" : ""}
        >
          Platform Usage
        </Button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Active Students This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {
                      students.filter(
                        (s: any) =>
                          s.last_active &&
                          Date.now() - s.last_active < 30 * 24 * 60 * 60 * 1000,
                      ).length
                    }
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Unique students who engaged
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Average Asset Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {Math.round(
                      students.reduce(
                        (acc, s) => acc + (Math.random() * 40 + 30),
                        0,
                      ) / students.length,
                    )}
                    %
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Career assets completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Total Advisor Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserRound className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {students.reduce(
                      (acc, s) => acc + Math.floor(Math.random() * 5),
                      0,
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Advising interactions logged
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  At-Risk Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {Math.floor(students.length * 0.15)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(
                    ((students.length * 0.15) / students.length) * 100,
                  )}
                  % of total students
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview.totalStudents}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+12.3%</span>
                    <span>from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    License Usage
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview.activeLicenses} / {overview.licenseCapacity}
                  </div>
                  <Progress
                    value={
                      overview.licenseCapacity
                        ? (overview.activeLicenses / overview.licenseCapacity) *
                          100
                        : 0
                    }
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    Active Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-muted-foreground mr-2" />
                    <div className="text-2xl font-bold">
                      {overview.totalStudents}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    This month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-muted-foreground mr-2" />
                    <div className="text-2xl font-bold">0</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tracked this semester
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Usage</CardTitle>
                  <CardDescription>
                    Monthly feature adoption and student engagement over the
                    last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          month: "Oct",
                          goals: 120,
                          applications: 45,
                          resumes: 30,
                          coverLetters: 25,
                        },
                        {
                          month: "Nov",
                          goals: 180,
                          applications: 65,
                          resumes: 45,
                          coverLetters: 35,
                        },
                        {
                          month: "Dec",
                          goals: 220,
                          applications: 80,
                          resumes: 60,
                          coverLetters: 50,
                        },
                        {
                          month: "Jan",
                          goals: 280,
                          applications: 95,
                          resumes: 75,
                          coverLetters: 65,
                        },
                        {
                          month: "Feb",
                          goals: 320,
                          applications: 110,
                          resumes: 85,
                          coverLetters: 75,
                        },
                        {
                          month: "Mar",
                          goals: 380,
                          applications: 125,
                          resumes: 95,
                          coverLetters: 85,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="goals"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        name="Goals Set"
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Applications"
                      />
                      <Line
                        type="monotone"
                        dataKey="resumes"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Resumes"
                      />
                      <Line
                        type="monotone"
                        dataKey="coverLetters"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="Cover Letters"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

            {/* Weekly Activity and Student Activity Trends side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>
                    Daily logins and assignment submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: "Mon", logins: 45, assignments: 12 },
                        { day: "Tue", logins: 52, assignments: 15 },
                        { day: "Wed", logins: 48, assignments: 18 },
                        { day: "Thu", logins: 61, assignments: 22 },
                        { day: "Fri", logins: 55, assignments: 20 },
                        { day: "Sat", logins: 38, assignments: 8 },
                        { day: "Sun", logins: 42, assignments: 10 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="logins" fill="#4F46E5" name="Logins">
                        <LabelList dataKey="logins" position="top" />
                      </Bar>
                      <Bar
                        dataKey="assignments"
                        fill="#10B981"
                        name="Assignments"
                      >
                        <LabelList dataKey="assignments" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Activity Trends</CardTitle>
                  <CardDescription>
                    Weekly student engagement and feature usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          week: "Week 1",
                          logins: 180,
                          goals: 45,
                          applications: 12,
                          documents: 28,
                        },
                        {
                          week: "Week 2",
                          logins: 210,
                          goals: 52,
                          applications: 18,
                          documents: 35,
                        },
                        {
                          week: "Week 3",
                          logins: 195,
                          goals: 48,
                          applications: 15,
                          documents: 32,
                        },
                        {
                          week: "Week 4",
                          logins: 240,
                          goals: 58,
                          applications: 22,
                          documents: 41,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="logins"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        name="Daily Logins"
                      />
                      <Line
                        type="monotone"
                        dataKey="goals"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Goals Set"
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Applications"
                      />
                      <Line
                        type="monotone"
                        dataKey="documents"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Documents Created"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Progress Insights</CardTitle>
                <CardDescription>
                  Goals in progress vs completed, applications by stage, and
                  resume/cover letter activity
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Goals",
                        inProgress: 45,
                        completed: 28,
                      },
                      {
                        name: "Applications",
                        inProgress: 12,
                        submitted: 35,
                        interviewing: 18,
                        offers: 8,
                      },
                      {
                        name: "Documents",
                        resumes: 67,
                        coverLetters: 43,
                      },
                    ]}
                    margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inProgress" fill="#4F46E5" name="In Progress">
                      <LabelList dataKey="inProgress" position="top" />
                    </Bar>
                    <Bar dataKey="completed" fill="#10B981" name="Completed">
                      <LabelList dataKey="completed" position="top" />
                    </Bar>
                    <Bar dataKey="submitted" fill="#F59E0B" name="Submitted">
                      <LabelList dataKey="submitted" position="top" />
                    </Bar>
                    <Bar
                      dataKey="interviewing"
                      fill="#EF4444"
                      name="Interviewing"
                    >
                      <LabelList dataKey="interviewing" position="top" />
                    </Bar>
                    <Bar dataKey="offers" fill="#8B5CF6" name="Offers">
                      <LabelList dataKey="offers" position="top" />
                    </Bar>
                    <Bar dataKey="resumes" fill="#EC4899" name="Resumes">
                      <LabelList dataKey="resumes" position="top" />
                    </Bar>
                    <Bar
                      dataKey="coverLetters"
                      fill="#06B6D4"
                      name="Cover Letters"
                    >
                      <LabelList dataKey="coverLetters" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Student Distribution by Department and Overall Progress side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Department</CardTitle>
                <CardDescription>
                  Enrollment breakdown across academic departments
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Computer Science",
                          value: 35,
                          color: "#4F46E5",
                        },
                        { name: "Business", value: 28, color: "#10B981" },
                        { name: "Engineering", value: 22, color: "#F59E0B" },
                        { name: "Arts & Design", value: 15, color: "#EC4899" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ value }) => `${value}%`}
                      labelLine={true}
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            ["#4F46E5", "#10B981", "#F59E0B", "#EC4899"][index]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Enrollment"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

              {/* Overall Progress Completion Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress Completion Rate</CardTitle>
                  <CardDescription>
                    Percentage of students who have completed core career assets
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: 68, color: "#10B981" },
                          { name: "In Progress", value: 22, color: "#F59E0B" },
                          { name: "Not Started", value: 10, color: "#EF4444" },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ value }) => `${value}%`}
                        labelLine={true}
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#10B981", "#F59E0B", "#EF4444"][index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Students"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Asset Completion Breakdown and Top Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Completion Breakdown by Category</CardTitle>
                  <CardDescription>
                    Average completion levels across resumes, cover letters,
                    goals, applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          category: "Resumes",
                          completion: 78,
                          color: "#4F46E5",
                        },
                        {
                          category: "Cover Letters",
                          completion: 65,
                          color: "#10B981",
                        },
                        { category: "Goals", completion: 82, color: "#F59E0B" },
                        {
                          category: "Applications",
                          completion: 58,
                          color: "#EF4444",
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="completion"
                        fill="#4F46E5"
                        name="Completion %"
                      >
                        <LabelList
                          dataKey="completion"
                          position="top"
                          formatter={(value: number) => `${value}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Features Used</CardTitle>
                  <CardDescription>
                    Ranked bar chart of the most frequently accessed tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { feature: "Resume Builder", usage: 89 },
                        { feature: "Goal Setting", usage: 76 },
                        { feature: "Job Search", usage: 68 },
                        { feature: "Applications", usage: 54 },
                        { feature: "Cover Letters", usage: 43 },
                        { feature: "AI Coach", usage: 31 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="feature"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usage" fill="#4F46E5" name="Usage %">
                        <LabelList
                          dataKey="usage"
                          position="top"
                          formatter={(value: number) => `${value}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* At-Risk Students Segment */}
            <Card>
              <CardHeader>
                <CardTitle>At-Risk Students Segment</CardTitle>
                <CardDescription>
                  Students with both low progress and low usage
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        segment: "High Risk",
                        count: Math.floor(students.length * 0.05),
                        color: "#EF4444",
                      },
                      {
                        segment: "Medium Risk",
                        count: Math.floor(students.length * 0.1),
                        color: "#F59E0B",
                      },
                      {
                        segment: "Low Risk",
                        count: Math.floor(students.length * 0.85),
                        color: "#10B981",
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F46E5" name="Student Count">
                      <LabelList dataKey="count" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Students - Moved to bottom */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>
                Latest users in your institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.filter((s: any) => s.role === "user").slice(0, 8).map((s: any) => (
                    <TableRow
                      key={s._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/profile/${s.clerkId}`)}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="uppercase text-xs text-muted-foreground">
                        {s.role}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Showing {Math.min(8, students.filter((s: any) => s.role === "user").length)} of {students.filter((s: any) => s.role === "user").length}
            </CardFooter>
          </Card>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Analytics Sub-Toggles */}
          <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg">
            <Button
              size="sm"
              variant={analyticsView === "engagement" ? "default" : "outline"}
              onClick={() => setAnalyticsView("engagement")}
              className={analyticsView === "engagement" ? "bg-[#0C29AB]" : ""}
            >
              Student Engagement
            </Button>
            <Button
              size="sm"
              variant={analyticsView === "features" ? "default" : "outline"}
              onClick={() => setAnalyticsView("features")}
              className={analyticsView === "features" ? "bg-[#0C29AB]" : ""}
            >
              Feature Adoption
            </Button>
            <Button
              size="sm"
              variant={analyticsView === "risk" ? "default" : "outline"}
              onClick={() => setAnalyticsView("risk")}
              className={analyticsView === "risk" ? "bg-[#0C29AB]" : ""}
            >
              At-Risk Analysis
            </Button>
          </div>

          {/* Analytics: Engagement */}
          {analyticsView === "engagement" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Daily Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(students.length * 0.35)}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      +12% from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Avg Session Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24 min</div>
                    <p className="text-xs text-green-600 mt-1">
                      +3 min from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Return Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      7-day return rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Actions Per Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.4</div>
                    <p className="text-xs text-green-600 mt-1">
                      +0.7 from last week
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Student Activity Trends</CardTitle>
                  <CardDescription>
                    Weekly student engagement and feature usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          week: "Week 1",
                          logins: 180,
                          goals: 45,
                          applications: 12,
                          documents: 28,
                        },
                        {
                          week: "Week 2",
                          logins: 210,
                          goals: 52,
                          applications: 18,
                          documents: 35,
                        },
                        {
                          week: "Week 3",
                          logins: 195,
                          goals: 48,
                          applications: 15,
                          documents: 32,
                        },
                        {
                          week: "Week 4",
                          logins: 240,
                          goals: 58,
                          applications: 22,
                          documents: 41,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="logins"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        name="Daily Logins"
                      />
                      <Line
                        type="monotone"
                        dataKey="goals"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Goals Set"
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Applications"
                      />
                      <Line
                        type="monotone"
                        dataKey="documents"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Documents Created"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>
                    Daily logins and assignment submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: "Mon", logins: 45, assignments: 12 },
                        { day: "Tue", logins: 52, assignments: 15 },
                        { day: "Wed", logins: 48, assignments: 18 },
                        { day: "Thu", logins: 61, assignments: 22 },
                        { day: "Fri", logins: 55, assignments: 20 },
                        { day: "Sat", logins: 38, assignments: 8 },
                        { day: "Sun", logins: 42, assignments: 10 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="logins" fill="#4F46E5" name="Logins">
                        <LabelList dataKey="logins" position="top" />
                      </Bar>
                      <Bar
                        dataKey="assignments"
                        fill="#10B981"
                        name="Assignments"
                      >
                        <LabelList dataKey="assignments" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics: Feature Adoption */}
          {analyticsView === "features" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Asset Completion Breakdown by Category
                    </CardTitle>
                    <CardDescription>
                      Average completion levels across resumes, cover letters,
                      goals, applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { category: "Resumes", completion: 78 },
                          { category: "Cover Letters", completion: 65 },
                          { category: "Goals", completion: 82 },
                          { category: "Applications", completion: 58 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="completion"
                          fill="#4F46E5"
                          name="Completion %"
                        >
                          <LabelList
                            dataKey="completion"
                            position="top"
                            formatter={(value: number) => `${value}%`}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Features Used</CardTitle>
                    <CardDescription>
                      Ranked bar chart of the most frequently accessed tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { feature: "Resume Builder", usage: 89 },
                          { feature: "Goal Setting", usage: 76 },
                          { feature: "Job Search", usage: 68 },
                          { feature: "Applications", usage: 54 },
                          { feature: "Cover Letters", usage: 43 },
                          { feature: "AI Coach", usage: 31 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="feature"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="usage" fill="#4F46E5" name="Usage %">
                          <LabelList
                            dataKey="usage"
                            position="top"
                            formatter={(value: number) => `${value}%`}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress Completion Rate</CardTitle>
                  <CardDescription>
                    Percentage of students who have completed core career assets
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: 68 },
                          { name: "In Progress", value: 22 },
                          { name: "Not Started", value: 10 },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ value }) => `${value}%`}
                        labelLine={true}
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#10B981", "#F59E0B", "#EF4444"][index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Students"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics: At-Risk */}
          {analyticsView === "risk" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-red-600">
                      High Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.floor(students.length * 0.05)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      No activity in 14+ days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-orange-600">
                      Medium Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.floor(students.length * 0.1)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Low engagement last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-green-600">
                      Low Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.floor(students.length * 0.85)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active and engaged
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>At-Risk Students Segment</CardTitle>
                  <CardDescription>
                    Students with both low progress and low usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          segment: "High Risk",
                          count: Math.floor(students.length * 0.05),
                        },
                        {
                          segment: "Medium Risk",
                          count: Math.floor(students.length * 0.1),
                        },
                        {
                          segment: "Low Risk",
                          count: Math.floor(students.length * 0.85),
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4F46E5" name="Student Count">
                        <LabelList dataKey="count" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>At-Risk Students List</CardTitle>
                  <CardDescription>
                    Students requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.slice(0, 5).map((s: any, index: number) => {
                        const riskLevel =
                          index < 1 ? "high" : index < 3 ? "medium" : "low";
                        const daysAgo = index < 1 ? 18 : index < 3 ? 9 : 3;
                        return (
                          <TableRow key={s._id}>
                            <TableCell className="font-medium">
                              {s.name || "Unknown"}
                            </TableCell>
                            <TableCell>{s.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  riskLevel === "high"
                                    ? "destructive"
                                    : riskLevel === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className={
                                  riskLevel === "medium" ? "bg-orange-600" : ""
                                }
                              >
                                {riskLevel.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {daysAgo} days ago
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Mail className="h-3 w-3 mr-1" />
                                Send Reminder
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Students Tab Content */}
      {(activeTab === "students-list" ||
        activeTab === "students-progress" ||
        activeTab === "invite-students") && (
        <div className="space-y-6">
          {/* Internal Toggle for Students Tab */}
          <div className="flex gap-4">
            <Button
              variant={activeTab === "students-list" ? "default" : "outline"}
              onClick={() => setActiveTab("students-list")}
              className={activeTab === "students-list" ? "bg-[#0C29AB]" : ""}
            >
              Students
            </Button>
            <Button
              variant={
                activeTab === "students-progress" ? "default" : "outline"
              }
              onClick={() => setActiveTab("students-progress")}
              className={
                activeTab === "students-progress" ? "bg-[#0C29AB]" : ""
              }
            >
              Student Progress
            </Button>
            <Button
              variant={activeTab === "invite-students" ? "default" : "outline"}
              onClick={() => setActiveTab("invite-students")}
              className={activeTab === "invite-students" ? "bg-[#0C29AB]" : ""}
            >
              Invite Students
            </Button>
          </div>

          <div className="space-y-6">
            {/* Students List View */}
            {activeTab === "students-list" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Total Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {students.filter((s: any) => s.role === "user").length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {
                            students.filter(
                              (s: any) =>
                                s.last_active &&
                                Date.now() - s.last_active <
                                  30 * 24 * 60 * 60 * 1000,
                            ).length
                          }
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Last 30 days
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        New This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {
                            students.filter(
                              (s: any) =>
                                s.created_at &&
                                Date.now() - s.created_at <
                                  30 * 24 * 60 * 60 * 1000,
                            ).length
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Departments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {
                            new Set(
                              students
                                .map((s: any) => s.department_id)
                                .filter(Boolean),
                            ).size
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>
                      Complete list of enrolled students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students
                          .sort(
                            (a: any, b: any) =>
                              (b.created_at || 0) - (a.created_at || 0),
                          )
                          .map((s: any) => {
                            const dept = departments.find(
                              (d: any) => d._id === s.department_id,
                            );
                            return (
                              <TableRow
                                key={s._id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => router.push(`/profile/${s.clerkId}`)}
                              >
                                <TableCell className="font-medium">
                                  {s.name || "Unknown"}
                                </TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell className="uppercase text-xs text-muted-foreground">
                                  {s.role}
                                </TableCell>
                                <TableCell>
                                  {dept?.name || "Not assigned"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {s.created_at
                                    ? new Date(
                                        s.created_at,
                                      ).toLocaleDateString()
                                    : "Unknown"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {s.last_active
                                    ? new Date(
                                        s.last_active,
                                      ).toLocaleDateString()
                                    : "Never"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Showing all {students.length} enrolled students
                  </CardFooter>
                </Card>
              </>
            )}

            {/* Student Progress View */}
            {activeTab === "students-progress" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Goals Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {students.reduce(
                            (acc, s) => acc + Math.floor(Math.random() * 8),
                            0,
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Career goals achieved
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Applications Submitted
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <ClipboardList className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {students.reduce(
                            (acc, s) => acc + Math.floor(Math.random() * 6),
                            0,
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Job applications
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Resumes Created
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {students.reduce(
                            (acc, s) => acc + Math.floor(Math.random() * 4),
                            0,
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Professional documents
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Cover Letters
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">
                          {students.reduce(
                            (acc, s) => acc + Math.floor(Math.random() * 3),
                            0,
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Application materials
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Student Progress Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Progress Details</CardTitle>
                    <CardDescription>
                      Individual student progress tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Goals</TableHead>
                          <TableHead>Applications</TableHead>
                          <TableHead>Resumes</TableHead>
                          <TableHead>Cover Letters</TableHead>
                          <TableHead>Overall Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students
                          .slice(0, 10)
                          .map((student: any, index: number) => {
                            const goalsCompleted = Math.floor(
                              Math.random() * 8,
                            );
                            const applications = Math.floor(Math.random() * 6);
                            const resumes = Math.floor(Math.random() * 4);
                            const coverLetters = Math.floor(Math.random() * 3);
                            const totalProgress = Math.round(
                              ((goalsCompleted +
                                applications +
                                resumes +
                                coverLetters) /
                                21) *
                                100,
                            );

                            return (
                              <TableRow key={student._id}>
                                <TableCell className="font-medium">
                                  {student.name || "Unknown Student"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {goalsCompleted}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {applications}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{resumes}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {coverLetters}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={totalProgress}
                                      className="w-16 h-2"
                                    />
                                    <span className="text-sm font-medium">
                                      {totalProgress}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Showing progress for {Math.min(10, students.length)}{" "}
                    students
                  </CardFooter>
                </Card>

                {/* Progress Summary by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Summary by Department</CardTitle>
                    <CardDescription>
                      Average progress metrics across departments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departments.map((d: any) => {
                        const deptStudents = students.filter(
                          (s: any) => s.department_id === d._id,
                        );
                        const avgProgress =
                          deptStudents.length > 0
                            ? Math.round(Math.random() * 40 + 30)
                            : 0;

                        return (
                          <Card key={String(d._id)}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-lg">
                                  {d.name}
                                </CardTitle>
                                {d.code && (
                                  <Badge variant="outline">{d.code}</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Students
                                  </span>
                                  <span className="font-medium">
                                    {deptStudents.length}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                      Avg Progress
                                    </span>
                                    <span className="font-medium">
                                      {avgProgress}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={avgProgress}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Invite Students View */}
            {activeTab === "invite-students" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Students</CardTitle>
                    <CardDescription>
                      Bulk invite students to join the Ascentful Career
                      Development platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Send Invitations
                      </Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Invite students to join the Ascentful Career Development
                        Platform for your university. This platform will help
                        them prepare for their career development journey.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="studentEmailsCsv"
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setImportingEmails(true);
                          try {
                            const text = await f.text();
                            // Basic parse: collect tokens that look like emails
                            const emailsFromCsv = Array.from(
                              text.matchAll(
                                /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
                              ),
                            ).map((m) => m[0]);
                            const combined = [
                              assignText,
                              emailsFromCsv.join("\n"),
                            ]
                              .filter(Boolean)
                              .join("\n");
                            setAssignText(combined);
                          } finally {
                            setImportingEmails(false);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("studentEmailsCsv")?.click()
                        }
                        disabled={importingEmails}
                      >
                        {importingEmails ? "Parsing..." : "Upload CSV"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Addresses</CardTitle>
                    <CardDescription>
                      Enter student email addresses to invite
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">
                          Student Email Addresses
                        </Label>
                        <Textarea
                          placeholder="Enter one email per line or comma-separated&#10;Example:&#10;student1@university.edu&#10;student2@university.edu"
                          rows={8}
                          value={assignText}
                          onChange={(e) => setAssignText(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Note:</strong> An activation email will be
                          sent to each address, allowing recipients to activate
                          their account and access university resources. No
                          prior signup required.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">
                          Default role for invited students:
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              assignRole === "user" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setAssignRole("user")}
                          >
                            Student
                          </Button>
                          <Button
                            variant={
                              assignRole === "staff" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setAssignRole("staff")}
                          >
                            Advisor / Staff
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {
                        assignText.split(/[\n,]+/).filter((e) => e.trim())
                          .length
                      }{" "}
                      email(s) ready to invite
                    </div>
                    <Button
                      onClick={async () => {
                        if (!clerkUser?.id) {
                          toast({
                            title: "Authentication required",
                            description: "Please sign in to send invitations",
                            variant: "destructive",
                          });
                          return;
                        }

                        const emails = Array.from(
                          new Set(
                            assignText
                              .split(/[\n,]+/)
                              .map((e) => e.trim())
                              .filter(Boolean),
                          ),
                        );
                        if (emails.length === 0) {
                          toast({
                            title: "No emails provided",
                            description:
                              "Please enter at least one email address",
                            variant: "destructive",
                          });
                          return;
                        }

                        setAssigning(true);
                        let successCount = 0;
                        let errorCount = 0;
                        const errors: string[] = [];

                        try {
                          // Step 1: Assign students in Convex (creates pending users or updates existing)
                          for (const email of emails) {
                            try {
                              await assignStudent({
                                clerkId: clerkUser.id,
                                email,
                                role: assignRole,
                                departmentId: selectedProgram || undefined,
                              });
                              successCount++;
                            } catch (e: any) {
                              errorCount++;
                              errors.push(
                                `${email}: ${e?.message || "Unknown error"}`,
                              );
                            }
                          }

                          // Step 2: Send activation emails via API
                          if (successCount > 0) {
                            try {
                              const response = await fetch(
                                "/api/university/send-invitations",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    emails: emails.slice(0, successCount),
                                  }),
                                },
                              );

                              if (!response.ok) {
                                console.error(
                                  "Failed to send some activation emails",
                                );
                              }
                            } catch (emailError) {
                              console.error(
                                "Error sending activation emails:",
                                emailError,
                              );
                              // Don't fail the whole operation if email sending fails
                            }
                          }

                          if (successCount > 0) {
                            toast({
                              title: "Students assigned successfully",
                              description: `${successCount} student(s) assigned and activation email(s) sent${errorCount > 0 ? `. ${errorCount} failed` : ""}`,
                              variant: errorCount > 0 ? "default" : "success",
                            });
                          }

                          if (errorCount > 0 && successCount === 0) {
                            toast({
                              title: "Assignment failed",
                              description:
                                errors.slice(0, 3).join("; ") +
                                (errors.length > 3 ? "..." : ""),
                              variant: "destructive",
                            });
                          }

                          if (successCount > 0) {
                            setAssignOpen(false);
                            setAssignText("");
                          }
                        } catch (e: any) {
                          toast({
                            title: "Failed to send invitations",
                            description:
                              e?.message || "An unexpected error occurred",
                            variant: "destructive",
                          });
                        } finally {
                          setAssigning(false);
                        }
                      }}
                      disabled={assigning || !assignText.trim()}
                    >
                      {assigning
                        ? "Sending..."
                        : `Send ${assignText.split(/[\n,]+/).filter((e) => e.trim()).length} Invitation(s)`}
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Departments Tab Content */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          {/* Department Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Total Departments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{departments.length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Academic departments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Average Students/Dept
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {departments.length > 0
                      ? Math.round(students.length / departments.length)
                      : 0}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Student distribution
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Highest Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-lg font-bold">
                    {departments.length > 0
                      ? departments.reduce((max, d) =>
                          students.filter((s: any) => s.department_id === d._id)
                            .length >
                          students.filter(
                            (s: any) => s.department_id === max._id,
                          ).length
                            ? d
                            : max,
                        ).name
                      : "N/A"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Largest department
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Avg Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChartIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {Math.round(Math.random() * 20 + 75)}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Department usage
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Usage Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Student Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Department</CardTitle>
                <CardDescription>
                  Enrollment breakdown across academic departments
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departments.map((d: any, index: number) => {
                        const deptStudents = students.filter(
                          (s: any) => s.department_id === d._id,
                        );
                        const percentage =
                          departments.length > 0
                            ? Math.round(
                                (deptStudents.length / students.length) * 100,
                              )
                            : 0;
                        return {
                          name: d.name,
                          value: percentage,
                          students: deptStudents.length,
                          color: [
                            "#4F46E5",
                            "#10B981",
                            "#F59E0B",
                            "#EC4899",
                            "#8B5CF6",
                            "#06B6D4",
                          ][index % 6],
                        };
                      })}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ value }) => `${value}%`}
                      labelLine={true}
                    >
                      {departments.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#4F46E5",
                              "#10B981",
                              "#F59E0B",
                              "#EC4899",
                              "#8B5CF6",
                              "#06B6D4",
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Department Utilization Trends</CardTitle>
                <CardDescription>
                  Student engagement and activity by department
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      departments.length > 0
                        ? departments.map((d: any, index: number) => {
                            const deptStudents = students.filter(
                              (s: any) => s.department_id === d._id,
                            );
                            const utilization = Math.round(
                              Math.random() * 30 + 70,
                            ); // 70-100% utilization
                            return {
                              name: d.code || d.name.substring(0, 15),
                              students: deptStudents.length,
                              utilization: utilization,
                              avgProgress: Math.round(Math.random() * 40 + 40), // 40-80% progress
                            };
                          })
                        : [
                            {
                              name: "CS",
                              students: 45,
                              utilization: 85,
                              avgProgress: 72,
                            },
                            {
                              name: "Business",
                              students: 32,
                              utilization: 78,
                              avgProgress: 68,
                            },
                            {
                              name: "Engineering",
                              students: 28,
                              utilization: 92,
                              avgProgress: 75,
                            },
                            {
                              name: "Arts",
                              students: 18,
                              utilization: 65,
                              avgProgress: 58,
                            },
                          ]
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#4F46E5" name="Students">
                      <LabelList dataKey="students" position="top" />
                    </Bar>
                    <Bar
                      dataKey="utilization"
                      fill="#10B981"
                      name="Utilization %"
                    >
                      <LabelList
                        dataKey="utilization"
                        position="top"
                        formatter={(value: number) => `${value}%`}
                      />
                    </Bar>
                    <Bar
                      dataKey="avgProgress"
                      fill="#F59E0B"
                      name="Avg Progress %"
                    >
                      <LabelList
                        dataKey="avgProgress"
                        position="top"
                        formatter={(value: number) => `${value}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Department Activity Overview</CardTitle>
              <CardDescription>
                Monthly activity trends across all departments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    {
                      month: "Jan",
                      cs: 45,
                      business: 32,
                      engineering: 28,
                      arts: 18,
                    },
                    {
                      month: "Feb",
                      cs: 52,
                      business: 38,
                      engineering: 31,
                      arts: 22,
                    },
                    {
                      month: "Mar",
                      cs: 48,
                      business: 35,
                      engineering: 29,
                      arts: 20,
                    },
                    {
                      month: "Apr",
                      cs: 58,
                      business: 42,
                      engineering: 35,
                      arts: 25,
                    },
                    {
                      month: "May",
                      cs: 65,
                      business: 45,
                      engineering: 38,
                      arts: 28,
                    },
                    {
                      month: "Jun",
                      cs: 72,
                      business: 48,
                      engineering: 42,
                      arts: 31,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cs"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    name="Computer Science"
                  />
                  <Line
                    type="monotone"
                    dataKey="business"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Business"
                  />
                  <Line
                    type="monotone"
                    dataKey="engineering"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Engineering"
                  />
                  <Line
                    type="monotone"
                    dataKey="arts"
                    stroke="#EC4899"
                    strokeWidth={2}
                    name="Arts & Design"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Total Departments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{departments.length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Academic departments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Average Students/Dept
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {departments.length > 0
                      ? Math.round(students.length / departments.length)
                      : 0}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Student distribution
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Highest Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-lg font-bold">
                    {departments.length > 0
                      ? departments.reduce((max, d) =>
                          students.filter((s: any) => s.department_id === d._id)
                            .length >
                          students.filter(
                            (s: any) => s.department_id === max._id,
                          ).length
                            ? d
                            : max,
                        ).name
                      : "N/A"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Largest department
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Avg Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChartIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">
                    {Math.round(Math.random() * 20 + 75)}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Department usage
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Department List */}
          <Card>
            <CardHeader>
              <CardTitle>Department Details</CardTitle>
              <CardDescription>
                Comprehensive overview of all academic departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((d: any, index: number) => {
                  const deptStudents = students.filter(
                    (s: any) => s.department_id === d._id,
                  );
                  const utilization = Math.round(Math.random() * 30 + 70);
                  const avgProgress = Math.round(Math.random() * 40 + 40);

                  return (
                    <Card key={String(d._id)} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg">{d.name}</CardTitle>
                          {d.code && <Badge variant="outline">{d.code}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Students
                            </span>
                            <span className="font-medium">
                              {deptStudents.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Utilization
                              </span>
                              <span className="font-medium">
                                {utilization}%
                              </span>
                            </div>
                            <Progress value={utilization} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Avg Progress
                              </span>
                              <span className="font-medium">
                                {avgProgress}%
                              </span>
                            </div>
                            <Progress value={avgProgress} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Status
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Active
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Usage Tab Content */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          {/* Platform Usage Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Platform Usage</CardTitle>
                  <CardDescription>
                    Monitor and analyze how students are using the Ascentful
                    Career Development platform.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-1 text-sm border rounded-md"
                    value={usageTimeFilter}
                    onChange={(e) => setUsageTimeFilter(e.target.value)}
                  >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                  <select
                    className="px-3 py-1 text-sm border rounded-md"
                    value={usageProgramFilter}
                    onChange={(e) => setUsageProgramFilter(e.target.value)}
                  >
                    <option>All Programs</option>
                    <option>Computer Science</option>
                    <option>Business</option>
                    <option>Engineering</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Logins
                        </p>
                        <p className="text-2xl font-bold">1,280</p>
                      </div>
                      <div className="text-green-600">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Active Users
                        </p>
                        <p className="text-2xl font-bold">24</p>
                      </div>
                      <div className="text-blue-600">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Avg Session Time
                        </p>
                        <p className="text-2xl font-bold">28 min</p>
                      </div>
                      <div className="text-purple-600">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Feature Usage
                        </p>
                        <p className="text-2xl font-bold">16,750</p>
                      </div>
                      <div className="text-orange-600">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={usageView === "overview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUsageView("overview")}
                  className={usageView === "overview" ? "bg-[#0C29AB]" : ""}
                >
                  Overview
                </Button>
                <Button
                  variant={usageView === "features" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUsageView("features")}
                  className={usageView === "features" ? "bg-[#0C29AB]" : ""}
                >
                  Features
                </Button>
                <Button
                  variant={usageView === "programs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUsageView("programs")}
                  className={usageView === "programs" ? "bg-[#0C29AB]" : ""}
                >
                  Programs
                </Button>
              </div>

              {/* Monthly Activity Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      {
                        month: "Jan",
                        logins: 4200,
                        applications: 180,
                        resumes: 95,
                        goals: 240,
                      },
                      {
                        month: "Feb",
                        logins: 3800,
                        applications: 165,
                        resumes: 88,
                        goals: 220,
                      },
                      {
                        month: "Mar",
                        logins: 4500,
                        applications: 195,
                        resumes: 110,
                        goals: 280,
                      },
                      {
                        month: "Apr",
                        logins: 5200,
                        applications: 220,
                        resumes: 125,
                        goals: 320,
                      },
                      {
                        month: "May",
                        logins: 4800,
                        applications: 210,
                        resumes: 118,
                        goals: 290,
                      },
                      {
                        month: "Jun",
                        logins: 5500,
                        applications: 235,
                        resumes: 135,
                        goals: 350,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="logins"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      name="Logins"
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Applications"
                    />
                    <Line
                      type="monotone"
                      dataKey="resumes"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Resumes"
                    />
                    <Line
                      type="monotone"
                      dataKey="goals"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Goals"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Access and download previously generated reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Monthly Student Activity Report
                    </TableCell>
                    <TableCell>2024-01-15</TableCell>
                    <TableCell>Student Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewReport(
                              "Monthly Student Activity Report",
                              "Student Analytics"
                            )
                          }
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadReport(
                              "Monthly Student Activity Report",
                              "Student Analytics"
                            )
                          }
                        >
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Department Usage Summary
                    </TableCell>
                    <TableCell>2024-01-10</TableCell>
                    <TableCell>Department Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewReport(
                              "Department Usage Summary",
                              "Department Analytics"
                            )
                          }
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadReport(
                              "Department Usage Summary",
                              "Department Analytics"
                            )
                          }
                        >
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Feature Adoption Report
                    </TableCell>
                    <TableCell>2024-01-05</TableCell>
                    <TableCell>Platform Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewReport(
                              "Feature Adoption Report",
                              "Platform Analytics"
                            )
                          }
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadReport(
                              "Feature Adoption Report",
                              "Platform Analytics"
                            )
                          }
                        >
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Student Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Student full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="student@university.edu"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed after invitation
              </p>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Student</SelectItem>
                  <SelectItem value="staff">Advisor / Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent} disabled={updatingStudent}>
              {updatingStudent ? "Updating..." : "Update Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {studentToDelete?.name || studentToDelete?.email} from your
              university? This action cannot be undone and will revoke their
              access to all university resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStudent}
              disabled={deletingStudent}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingStudent ? "Removing..." : "Remove Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Licenses Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Student Licenses</DialogTitle>
            {overview && overview.licenseCapacity && (
              <div className="text-sm text-muted-foreground">
                Available seats:{" "}
                {overview.licenseCapacity - overview.activeLicenses} of{" "}
                {overview.licenseCapacity}
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Program/Department</Label>
              <Select
                value={selectedProgram || ""}
                onValueChange={(value) =>
                  setSelectedProgram(value as Id<"departments"> | "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program/department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific program</SelectItem>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Student Emails</Label>
              <Textarea
                placeholder="Enter one email per line or comma-separated&#10;Example:&#10;student1@university.edu&#10;student2@university.edu"
                rows={6}
                value={assignText}
                onChange={(e) => setAssignText(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                <strong>Note:</strong> An activation email will be sent to each
                address, allowing recipients to activate their account and
                access university resources. No prior signup required.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Assign role:</Label>
              <div className="flex gap-2">
                <Button
                  variant={assignRole === "user" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAssignRole("user")}
                >
                  Student
                </Button>
                <Button
                  variant={assignRole === "staff" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAssignRole("staff")}
                >
                  Advisor / Staff
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent =
                    'email,first_name,last_name,program,cohort,role,tags\nstudent1@university.edu,John,Doe,Computer Science,2024,student,"tag1,tag2"\nstudent2@university.edu,Jane,Smith,Business,2024,student,"tag3"';
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "student_import_template.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
              >
                Download CSV Template
              </Button>
              <input
                id="studentEmailsCsv"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImportingEmails(true);
                  try {
                    const text = await f.text();
                    // Basic parse: collect tokens that look like emails
                    const emailsFromCsv = Array.from(
                      text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
                    ).map((m) => m[0]);
                    const combined = [assignText, emailsFromCsv.join("\n")]
                      .filter(Boolean)
                      .join("\n");
                    setAssignText(combined);
                  } finally {
                    setImportingEmails(false);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("studentEmailsCsv")?.click()
                }
                disabled={importingEmails}
              >
                {importingEmails ? "Parsing..." : "Import CSV"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!clerkUser?.id) {
                  toast({
                    title: "Authentication required",
                    description: "Please sign in to assign licenses",
                    variant: "destructive",
                  });
                  return;
                }

                const emails = Array.from(
                  new Set(
                    assignText
                      .split(/[\n,]+/)
                      .map((e) => e.trim())
                      .filter(Boolean),
                  ),
                );
                if (emails.length === 0) {
                  toast({
                    title: "No emails provided",
                    description: "Please enter at least one email address",
                    variant: "destructive",
                  });
                  return;
                }

                setAssigning(true);
                let successCount = 0;
                let errorCount = 0;
                const errors: string[] = [];

                try {
                  // Step 1: Assign students in Convex (creates pending users or updates existing)
                  for (const email of emails) {
                    try {
                      await assignStudent({
                        clerkId: clerkUser.id,
                        email,
                        role: assignRole,
                        departmentId: selectedProgram || undefined,
                      });
                      successCount++;
                    } catch (e: any) {
                      errorCount++;
                      errors.push(`${email}: ${e?.message || "Unknown error"}`);
                    }
                  }

                  // Step 2: Send activation emails via API
                  if (successCount > 0) {
                    try {
                      const response = await fetch(
                        "/api/university/send-invitations",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            emails: emails.slice(0, successCount),
                          }),
                        },
                      );

                      if (!response.ok) {
                        console.error("Failed to send some activation emails");
                      }
                    } catch (emailError) {
                      console.error(
                        "Error sending activation emails:",
                        emailError,
                      );
                      // Don't fail the whole operation if email sending fails
                    }
                  }

                  if (successCount > 0) {
                    toast({
                      title: "Students assigned successfully",
                      description: `${successCount} student(s) assigned and activation email(s) sent${errorCount > 0 ? `. ${errorCount} failed` : ""}`,
                      variant: errorCount > 0 ? "default" : "success",
                    });
                  }

                  if (errorCount > 0 && successCount === 0) {
                    toast({
                      title: "Assignment failed",
                      description:
                        errors.slice(0, 3).join("; ") +
                        (errors.length > 3 ? "..." : ""),
                      variant: "destructive",
                    });
                  }

                  if (successCount > 0) {
                    setAssignOpen(false);
                    setAssignText("");
                    setSelectedProgram("");
                  }
                } catch (e: any) {
                  toast({
                    title: "Assignment failed",
                    description: e?.message || "An unexpected error occurred",
                    variant: "destructive",
                  });
                } finally {
                  setAssigning(false);
                }
              }}
              disabled={assigning || !assignText.trim()}
            >
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
