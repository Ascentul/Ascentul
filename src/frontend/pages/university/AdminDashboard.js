import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from "recharts";
import { Users, GraduationCap, BookOpen, Award, FileSpreadsheet, Calendar, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
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
            return [
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
    const getActivityIcon = (type) => {
        switch (type) {
            case "enrollment":
                return _jsx(BookOpen, { className: "h-4 w-4 text-blue-500" });
            case "completion":
                return _jsx(Award, { className: "h-4 w-4 text-green-500" });
            case "new_student":
                return _jsx(Users, { className: "h-4 w-4 text-purple-500" });
            case "study_plan":
                return _jsx(Calendar, { className: "h-4 w-4 text-amber-500" });
            case "achievement":
                return _jsx(Award, { className: "h-4 w-4 text-pink-500" });
            default:
                return _jsx(FileSpreadsheet, { className: "h-4 w-4 text-gray-500" });
        }
    };
    // Format date to relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);
        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        }
        else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        }
        else {
            return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        }
    };
    // Loading state
    if (statsLoading || studentsLoading || modulesLoading || departmentsLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    return (_jsxs("div", { className: "max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "University Administration" }), _jsx("p", { className: "text-muted-foreground", children: "Manage student licenses, learning modules, and performance." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "outline", children: [_jsx(FileSpreadsheet, { className: "mr-2 h-4 w-4" }), "Export Reports"] }), _jsxs(Button, { children: [_jsx(GraduationCap, { className: "mr-2 h-4 w-4" }), "Add Student Licenses"] })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-4", children: [_jsxs(TabsList, { className: "grid grid-cols-4 md:w-[600px]", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "students", children: "Students" }), _jsx(TabsTrigger, { value: "modules", children: "Learning Modules" }), _jsx(TabsTrigger, { value: "departments", children: "Departments" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base font-medium", children: "Total Students" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "h-5 w-5 text-muted-foreground mr-2" }), _jsx("div", { className: "text-2xl font-bold", children: universityStats?.totalStudents?.toLocaleString() || 0 })] }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: ["Across ", universityStats?.departments || 0, " departments"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base font-medium", children: "License Usage" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center", children: [_jsx(GraduationCap, { className: "h-5 w-5 text-muted-foreground mr-2" }), _jsxs("div", { className: "text-2xl font-bold", children: [universityStats?.activeLicenses?.toLocaleString() || 0, " / ", universityStats?.licenseCapacity?.toLocaleString() || 0] })] }), _jsx(Progress, { value: universityStats?.activeLicenses && universityStats?.licenseCapacity
                                                            ? (universityStats.activeLicenses / universityStats.licenseCapacity) * 100
                                                            : 0, className: "mt-2 h-2" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base font-medium", children: "Learning Modules" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center", children: [_jsx(BookOpen, { className: "h-5 w-5 text-muted-foreground mr-2" }), _jsx("div", { className: "text-2xl font-bold", children: universityStats?.learningModules?.toLocaleString() || 0 })] }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [universityStats?.completedLearningModules?.toLocaleString() || 0, " module completions"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base font-medium", children: "Completion Rate" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Award, { className: "h-5 w-5 text-muted-foreground mr-2" }), _jsxs("div", { className: "text-2xl font-bold", children: [universityStats?.averageCompletionRate || 0, "%"] })] }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Average across all modules" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Department Performance" }), _jsx(CardDescription, { children: "Student completion rates by department" })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: universityStats?.departmentStats, margin: { top: 20, right: 30, left: 0, bottom: 5 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "completionRate", fill: UNIVERSITY_COLORS.primary, name: "Completion Rate (%)" })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Module Engagement" }), _jsx(CardDescription, { children: "Completed vs. in-progress modules" })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: universityStats?.moduleEngagement, margin: { top: 20, right: 30, left: 0, bottom: 5 }, layout: "vertical", children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "completed", stackId: "a", fill: UNIVERSITY_COLORS.primary, name: "Completed" }), _jsx(Bar, { dataKey: "inProgress", stackId: "a", fill: UNIVERSITY_COLORS.secondary, name: "In Progress" })] }) }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Activity" }), _jsx(CardDescription, { children: "Latest student actions and system events" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: universityStats?.recentActivity?.map((activity) => (_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "bg-muted rounded-full p-2", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: activity.user }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatRelativeTime(activity.date) })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [activity.type === "enrollment" && `Enrolled in "${activity.item}"`, activity.type === "completion" && `Completed "${activity.item}"`, activity.type === "new_student" && `New student in ${activity.item}`, activity.type === "study_plan" && `Created study plan: ${activity.item}`, activity.type === "achievement" && `Earned achievement: ${activity.item}`] })] })] }, activity.id))) }) }), _jsx(CardFooter, { children: _jsx(Button, { variant: "ghost", className: "w-full", children: "View All Activity" }) })] })] }), _jsx(TabsContent, { value: "students", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Students" }), _jsx(CardDescription, { children: "Manage student accounts and progress" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "outline", children: "Import Students" }), _jsx(Button, { children: "Add Student" })] })] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Name" }), _jsx(TableHead, { children: "Student ID" }), _jsx(TableHead, { children: "Department" }), _jsx(TableHead, { children: "Grad Year" }), _jsx(TableHead, { children: "Progress" }), _jsx(TableHead, { children: "Last Active" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: students?.map((student) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: _jsxs("div", { children: [student.name, _jsx("div", { className: "text-xs text-muted-foreground", children: student.email })] }) }), _jsx(TableCell, { children: student.studentId }), _jsx(TableCell, { children: student.department }), _jsx(TableCell, { children: student.gradYear }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: student.progress, className: "h-2 w-20" }), _jsxs("span", { className: "text-xs", children: [student.progress, "%"] })] }) }), _jsx(TableCell, { children: formatRelativeTime(student.lastActive) }), _jsxs(TableCell, { className: "text-right", children: [_jsx(Button, { variant: "ghost", size: "sm", children: "View" }), _jsx(Button, { variant: "ghost", size: "sm", children: "Edit" })] })] }, student.id))) })] }) }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["Showing 5 of ", universityStats?.totalStudents || 0, " students"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", children: "Next" })] })] })] }) }), _jsx(TabsContent, { value: "modules", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Learning Modules" }), _jsx(CardDescription, { children: "Create and manage educational content" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "outline", children: "Import Modules" }), _jsx(Button, { children: "Create Module" })] })] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Title" }), _jsx(TableHead, { children: "Department" }), _jsx(TableHead, { children: "Category" }), _jsx(TableHead, { children: "Level" }), _jsx(TableHead, { children: "Enrollments" }), _jsx(TableHead, { children: "Completion" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: modules?.map((module) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: module.title }), _jsx(TableCell, { children: module.department }), _jsx(TableCell, { children: module.category }), _jsx(TableCell, { children: module.level }), _jsx(TableCell, { children: module.enrollments }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: module.completionRate, className: "h-2 w-20" }), _jsxs("span", { className: "text-xs", children: [module.completionRate, "%"] })] }) }), _jsx(TableCell, { children: module.published ? (_jsx(Badge, { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-200", children: "Published" })) : (_jsx(Badge, { variant: "outline", className: "text-amber-800", children: "Draft" })) }), _jsxs(TableCell, { className: "text-right", children: [_jsx(Button, { variant: "ghost", size: "sm", children: "View" }), _jsx(Button, { variant: "ghost", size: "sm", children: "Edit" })] })] }, module.id))) })] }) }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["Showing 5 of ", universityStats?.learningModules || 0, " modules"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", children: "Next" })] })] })] }) }), _jsx(TabsContent, { value: "departments", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Departments" }), _jsx(CardDescription, { children: "Manage academic departments" })] }), _jsx(Button, { children: "Add Department" })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: departments?.map((dept) => (_jsxs(Card, { className: "border bg-card", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-lg", children: dept.name }), _jsx(Badge, { variant: "outline", children: dept.code })] }) }), _jsx(CardContent, { className: "pb-3", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Students:" }), _jsx("span", { className: "font-medium", children: dept.students })] }), _jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Learning Modules:" }), _jsx("span", { className: "font-medium", children: dept.modules })] }), _jsxs("div", { className: "pt-1", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Administrators:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: dept.administrators?.map((admin, idx) => (_jsx(Badge, { variant: "secondary", className: "font-normal", children: admin }, idx))) })] })] }) }), _jsx(CardFooter, { className: "flex justify-end pt-0", children: _jsx(Button, { variant: "ghost", size: "sm", children: "Manage" }) })] }, dept.id))) }) })] }) })] })] }));
}
