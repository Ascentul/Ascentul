import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, BookOpen, Clock, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
// Mock data until we have API endpoints
const studyPlanSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().optional(),
    academicTerm: z.string().min(1, { message: "Academic term is required" }),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }).optional()
});
const courseSchema = z.object({
    courseCode: z.string().min(1, { message: "Course code is required" }),
    courseName: z.string().min(1, { message: "Course name is required" }),
    credits: z.coerce.number().min(1).max(6),
    schedule: z.string().optional(),
    instructor: z.string().optional(),
    location: z.string().optional(),
    priority: z.coerce.number().min(1).max(5),
    status: z.enum(["planned", "in-progress", "completed"]),
    notes: z.string().optional()
});
const assignmentSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    status: z.enum(["pending", "in-progress", "completed"]),
    weight: z.coerce.number().min(1).max(100)
});
export default function StudyPlan() {
    const { toast } = useToast();
    const [selectedStudyPlan, setSelectedStudyPlan] = useState(null);
    const [isAddingStudyPlan, setIsAddingStudyPlan] = useState(false);
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [isAddingAssignment, setIsAddingAssignment] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    // Fetch study plans
    const { data: studyPlans, isLoading: studyPlansLoading } = useQuery({
        queryKey: ["/api/university/study-plans"],
        queryFn: async () => {
            const response = await apiRequest("/api/university/study-plans");
            return response;
        }
    });
    // Forms
    const studyPlanForm = useForm({
        resolver: zodResolver(studyPlanSchema),
        defaultValues: {
            title: "",
            description: "",
            academicTerm: "",
            startDate: new Date()
        }
    });
    const courseForm = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            courseCode: "",
            courseName: "",
            credits: 3,
            schedule: "",
            instructor: "",
            location: "",
            priority: 1,
            status: "planned",
            notes: ""
        }
    });
    const assignmentForm = useForm({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "pending",
            weight: 10
        }
    });
    // Mutations
    const createStudyPlanMutation = useMutation({
        mutationFn: async (data) => {
            // Mock API call
            // return apiRequest("POST", "/api/university/study-plans", data);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["/api/university/study-plans"]
            });
            toast({
                title: "Study Plan Created",
                description: "Your study plan has been created successfully."
            });
            setIsAddingStudyPlan(false);
            studyPlanForm.reset();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to create study plan. Please try again.",
                variant: "destructive"
            });
        }
    });
    const createCourseMutation = useMutation({
        mutationFn: async (data) => {
            // Mock API call
            // return apiRequest("POST", `/api/university/study-plans/${selectedStudyPlan}/courses`, data);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["/api/university/study-plans"]
            });
            toast({
                title: "Course Added",
                description: "The course has been added to your study plan."
            });
            setIsAddingCourse(false);
            courseForm.reset();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to add course. Please try again.",
                variant: "destructive"
            });
        }
    });
    const createAssignmentMutation = useMutation({
        mutationFn: async (data) => {
            // Mock API call
            // return apiRequest("POST", `/api/university/courses/${selectedCourse}/assignments`, data);
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["/api/university/study-plans"]
            });
            toast({
                title: "Assignment Added",
                description: "The assignment has been added to the course."
            });
            setIsAddingAssignment(false);
            assignmentForm.reset();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to add assignment. Please try again.",
                variant: "destructive"
            });
        }
    });
    // Form submission handlers
    const onSubmitStudyPlan = (data) => {
        createStudyPlanMutation.mutate(data);
    };
    const onSubmitCourse = (data) => {
        createCourseMutation.mutate(data);
    };
    const onSubmitAssignment = (data) => {
        createAssignmentMutation.mutate(data);
    };
    // Get current plan and courses
    const currentPlan = selectedStudyPlan
        ? studyPlans?.find((plan) => plan.id === selectedStudyPlan)
        : studyPlans?.[0];
    // Helper functions
    const getStatusColor = (status) => {
        switch (status) {
            case "planned":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            case "in-progress":
                return "bg-amber-100 text-amber-800 hover:bg-amber-200";
            case "completed":
                return "bg-green-100 text-green-800 hover:bg-green-200";
            case "pending":
                return "bg-purple-100 text-purple-800 hover:bg-purple-200";
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        }
    };
    if (studyPlansLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    if (!studyPlans || studyPlans.length === 0) {
        return (_jsxs("div", { className: "max-w-4xl mx-auto p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Study Plans" }), _jsxs(Dialog, { open: isAddingStudyPlan, onOpenChange: setIsAddingStudyPlan, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Create Study Plan"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Study Plan" }), _jsx(DialogDescription, { children: "Create a study plan to organize your courses and assignments for an academic term." })] }), _jsx(Form, { ...studyPlanForm, children: _jsxs("form", { onSubmit: studyPlanForm.handleSubmit(onSubmitStudyPlan), className: "space-y-4", children: [_jsx(FormField, { control: studyPlanForm.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Spring 2025 Semester", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Brief description of your study plan", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "academicTerm", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Academic Term" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Spring 2025", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: studyPlanForm.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Start Date" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value
                                                                                        ? format(field.value, "yyyy-MM-dd")
                                                                                        : "", onChange: (e) => {
                                                                                        const date = e.target.value
                                                                                            ? new Date(e.target.value)
                                                                                            : undefined;
                                                                                        field.onChange(date);
                                                                                    } }) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "End Date" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value
                                                                                        ? format(field.value, "yyyy-MM-dd")
                                                                                        : "", onChange: (e) => {
                                                                                        const date = e.target.value
                                                                                            ? new Date(e.target.value)
                                                                                            : undefined;
                                                                                        field.onChange(date);
                                                                                    } }) }) }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddingStudyPlan(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Create Study Plan" })] })] }) })] })] })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center p-10 text-center", children: [_jsx("div", { className: "rounded-full bg-muted p-6 mb-4", children: _jsx(BookOpen, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Study Plans Yet" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Create your first study plan to organize your courses and assignments." }), _jsxs(Button, { onClick: () => setIsAddingStudyPlan(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Create Study Plan"] })] }) })] }));
    }
    return (_jsxs("div", { className: "max-w-5xl mx-auto p-4 md:p-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Study Plans" }), _jsx("p", { className: "text-muted-foreground", children: "Organize your courses, schedule, and assignments" })] }), _jsxs(Dialog, { open: isAddingStudyPlan, onOpenChange: setIsAddingStudyPlan, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Create Study Plan"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Study Plan" }), _jsx(DialogDescription, { children: "Create a study plan to organize your courses and assignments for an academic term." })] }), _jsx(Form, { ...studyPlanForm, children: _jsxs("form", { onSubmit: studyPlanForm.handleSubmit(onSubmitStudyPlan), className: "space-y-4", children: [_jsx(FormField, { control: studyPlanForm.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Spring 2025 Semester", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Brief description of your study plan", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "academicTerm", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Academic Term" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Spring 2025", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: studyPlanForm.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Start Date" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value
                                                                                    ? format(field.value, "yyyy-MM-dd")
                                                                                    : "", onChange: (e) => {
                                                                                    const date = e.target.value
                                                                                        ? new Date(e.target.value)
                                                                                        : undefined;
                                                                                    field.onChange(date);
                                                                                } }) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: studyPlanForm.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "End Date" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value
                                                                                    ? format(field.value, "yyyy-MM-dd")
                                                                                    : "", onChange: (e) => {
                                                                                    const date = e.target.value
                                                                                        ? new Date(e.target.value)
                                                                                        : undefined;
                                                                                    field.onChange(date);
                                                                                } }) }) }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddingStudyPlan(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Create Study Plan" })] })] }) })] })] })] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("h2", { className: "text-xl font-bold", children: "Current Plan:" }), _jsxs(Select, { value: currentPlan?.id.toString(), onValueChange: (value) => setSelectedStudyPlan(parseInt(value)), children: [_jsx(SelectTrigger, { className: "w-[300px]", children: _jsx(SelectValue, { placeholder: "Select a study plan" }) }), _jsx(SelectContent, { children: studyPlans.map((plan) => (_jsxs(SelectItem, { value: plan.id.toString(), children: [plan.title, " - ", plan.academicTerm] }, plan.id))) })] })] }) }), currentPlan && (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-2xl", children: currentPlan.title }), _jsx(CardDescription, { children: currentPlan.description })] }), _jsxs("div", { className: "flex flex-col items-end", children: [_jsx(Badge, { children: currentPlan.academicTerm }), _jsxs("span", { className: "text-sm text-muted-foreground mt-2", children: [format(new Date(currentPlan.startDate), "MMM d, yyyy"), " -", " ", currentPlan.endDate &&
                                                            format(new Date(currentPlan.endDate), "MMM d, yyyy")] })] })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-medium", children: "Courses" }), _jsxs(Dialog, { open: isAddingCourse, onOpenChange: setIsAddingCourse, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Add Course"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add New Course" }), _jsx(DialogDescription, { children: "Add a course to your study plan." })] }), _jsx(Form, { ...courseForm, children: _jsxs("form", { onSubmit: courseForm.handleSubmit(onSubmitCourse), className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: courseForm.control, name: "courseCode", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Course Code" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "CS-301", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: courseForm.control, name: "credits", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Credits" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", min: 1, max: 6, ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: courseForm.control, name: "courseName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Course Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Algorithms and Data Structures", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: courseForm.control, name: "instructor", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Instructor" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Dr. Example", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: courseForm.control, name: "schedule", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Schedule" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "MWF 10:00-11:30", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: courseForm.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Building and Room Number", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: courseForm.control, name: "priority", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Priority" }), _jsxs(Select, { onValueChange: (value) => field.onChange(parseInt(value)), defaultValue: field.value.toString(), children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select priority" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "1 - Highest" }), _jsx(SelectItem, { value: "2", children: "2 - High" }), _jsx(SelectItem, { value: "3", children: "3 - Medium" }), _jsx(SelectItem, { value: "4", children: "4 - Low" }), _jsx(SelectItem, { value: "5", children: "5 - Lowest" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: courseForm.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "planned", children: "Planned" }), _jsx(SelectItem, { value: "in-progress", children: "In Progress" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: courseForm.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Any notes about this course", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddingCourse(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Add Course" })] })] }) })] })] })] }), currentPlan.courses.length === 0 ? (_jsxs("div", { className: "text-center p-6 border rounded-md bg-muted/50", children: [_jsx(BookOpen, { className: "mx-auto h-8 w-8 text-muted-foreground mb-2" }), _jsx("h3", { className: "text-lg font-medium mb-1", children: "No Courses Yet" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Add courses to your study plan to track your academic progress." }), _jsxs(Button, { variant: "outline", onClick: () => setIsAddingCourse(true), children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Add Your First Course"] })] })) : (_jsx("div", { className: "space-y-4", children: currentPlan.courses.map((course) => (_jsxs(Card, { className: "relative overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CardTitle, { className: "text-lg", children: course.courseName }), _jsx(Badge, { variant: "outline", children: course.courseCode }), _jsx(Badge, { className: getStatusColor(course.status), children: course.status })] }), _jsxs(CardDescription, { children: [course.credits, " Credits"] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                                    setSelectedCourse(course.id);
                                                                                    setIsAddingAssignment(true);
                                                                                }, children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Add Assignment"] }), _jsxs(DropdownMenuItem, { children: [_jsx(Pencil, { className: "mr-2 h-4 w-4" }), "Edit Course"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: "text-red-600", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })] })] })] }) }), _jsxs(CardContent, { className: "pb-2", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Clock, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsx("span", { children: course.schedule || "No schedule set" })] }), _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Users, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsx("span", { children: course.instructor || "No instructor set" })] }), _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(MapPin, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsx("span", { children: course.location || "No location set" })] })] }), _jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex justify-between mb-1 text-sm", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [course.progress, "%"] })] }), _jsx(Progress, { value: course.progress, className: "h-2" })] }), course.assignments &&
                                                            course.assignments.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Assignments" }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[300px]", children: "Title" }), _jsx(TableHead, { children: "Due Date" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Weight" }), _jsx(TableHead, { children: "Grade" })] }) }), _jsx(TableBody, { children: course.assignments.map((assignment) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: assignment.title }), _jsx(TableCell, { children: assignment.dueDate
                                                                                            ? format(new Date(assignment.dueDate), "MMM d, yyyy")
                                                                                            : "-" }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(assignment.status), children: assignment.status }) }), _jsxs(TableCell, { children: [assignment.weight, "%"] }), _jsx(TableCell, { children: assignment.grade || "-" })] }, assignment.id))) })] })] }))] }), _jsx(CardFooter, { children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                            setSelectedCourse(course.id);
                                                            setIsAddingAssignment(true);
                                                        }, children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Add Assignment"] }) })] }, course.id))) }))] })] }), _jsx(Dialog, { open: isAddingAssignment, onOpenChange: setIsAddingAssignment, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add New Assignment" }), _jsx(DialogDescription, { children: "Add an assignment or exam to your course." })] }), _jsx(Form, { ...assignmentForm, children: _jsxs("form", { onSubmit: assignmentForm.handleSubmit(onSubmitAssignment), className: "space-y-4", children: [_jsx(FormField, { control: assignmentForm.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Assignment title", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: assignmentForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Description of the assignment", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: assignmentForm.control, name: "dueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Due Date" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value
                                                                                ? format(field.value, "yyyy-MM-dd")
                                                                                : "", onChange: (e) => {
                                                                                const date = e.target.value
                                                                                    ? new Date(e.target.value)
                                                                                    : undefined;
                                                                                field.onChange(date);
                                                                            } }) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: assignmentForm.control, name: "weight", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Weight (%)" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", min: 1, max: 100, ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: assignmentForm.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "in-progress", children: "In Progress" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddingAssignment(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Add Assignment" })] })] }) })] }) })] }))] }));
}
