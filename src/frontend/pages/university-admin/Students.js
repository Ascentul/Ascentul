import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, MoreHorizontal, Search, UserPlus, Filter, Calendar, Mail, AlertCircle, Ban, MessageSquare, Trash2, FileText, Eye, Download, Send, UserCircle } from 'lucide-react';
// Mock data for students
const mockStudents = [
    {
        id: 1,
        name: 'Jane Smith',
        email: 'jane.smith@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-03',
        progress: 78,
        profileImage: 'https://i.pravatar.cc/150?img=1'
    },
    {
        id: 2,
        name: 'Michael Johnson',
        email: 'michael.johnson@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-03',
        progress: 65,
        profileImage: 'https://i.pravatar.cc/150?img=2'
    },
    {
        id: 3,
        name: 'Emily Davis',
        email: 'emily.davis@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-02',
        progress: 92,
        profileImage: 'https://i.pravatar.cc/150?img=3'
    },
    {
        id: 4,
        name: 'Daniel Brown',
        email: 'daniel.brown@stanford.edu',
        status: 'inactive',
        lastLogin: '2025-04-28',
        progress: 45,
        profileImage: 'https://i.pravatar.cc/150?img=4'
    },
    {
        id: 5,
        name: 'Sophia Wilson',
        email: 'sophia.wilson@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-03',
        progress: 85,
        profileImage: 'https://i.pravatar.cc/150?img=5'
    },
    {
        id: 6,
        name: 'Ethan Martinez',
        email: 'ethan.martinez@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-01',
        progress: 70,
        profileImage: 'https://i.pravatar.cc/150?img=6'
    },
    {
        id: 7,
        name: 'Olivia Anderson',
        email: 'olivia.anderson@stanford.edu',
        status: 'inactive',
        lastLogin: '2025-04-25',
        progress: 30,
        profileImage: 'https://i.pravatar.cc/150?img=7'
    },
    {
        id: 8,
        name: 'Noah Taylor',
        email: 'noah.taylor@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-02',
        progress: 88,
        profileImage: 'https://i.pravatar.cc/150?img=8'
    },
    {
        id: 9,
        name: 'Ava Thomas',
        email: 'ava.thomas@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-03',
        progress: 74,
        profileImage: 'https://i.pravatar.cc/150?img=9'
    },
    {
        id: 10,
        name: 'William Garcia',
        email: 'william.garcia@stanford.edu',
        status: 'active',
        lastLogin: '2025-05-02',
        progress: 82,
        profileImage: 'https://i.pravatar.cc/150?img=10'
    },
];
// Form schema for adding a new student
const addStudentSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z
        .string()
        .email({ message: "Please enter a valid email address" })
        .refine((email) => email.endsWith('.edu'), {
        message: "Email must be an educational email (.edu)"
    }),
    status: z.enum(['active', 'inactive']).default('active'),
});
export default function StudentManagement() {
    const { toast } = useToast();
    const [students, setStudents] = useState(mockStudents);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
    // Filter students based on search query and status filter
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    // Handle student profile view
    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setIsViewDialogOpen(true);
    };
    // Handle student deletion
    const handleDeleteStudent = (studentId) => {
        setStudents(students.filter(student => student.id !== studentId));
        setIsDeleteDialogOpen(false);
        toast({
            title: 'Student Removed',
            description: 'The student has been removed from the platform.',
        });
    };
    // Function to reset a student's password
    const handleResetPassword = (studentId) => {
        toast({
            title: 'Password Reset Link Sent',
            description: 'A password reset link has been sent to the student\'s email.',
        });
    };
    // Function to deactivate a student
    const handleDeactivateStudent = (studentId) => {
        setStudents(students.map(student => student.id === studentId
            ? { ...student, status: 'inactive' }
            : student));
        toast({
            title: 'Student Deactivated',
            description: 'The student account has been deactivated.',
        });
    };
    // Function to activate a student
    const handleActivateStudent = (studentId) => {
        setStudents(students.map(student => student.id === studentId
            ? { ...student, status: 'active' }
            : student));
        toast({
            title: 'Student Activated',
            description: 'The student account has been activated.',
        });
    };
    // Function to get the initials from a name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };
    // Function to handle export report
    const handleExportReport = () => {
        toast({
            title: 'Report Exported',
            description: `Analytics report for ${selectedStudent?.name} has been exported successfully.`,
        });
    };
    // State for message dialog
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    // Function to handle sending message to student
    const handleSendMessage = () => {
        if (!messageContent.trim()) {
            toast({
                title: 'Message Required',
                description: 'Please enter a message before sending.',
                variant: 'destructive',
            });
            return;
        }
        toast({
            title: 'Message Sent',
            description: `Your message has been sent to ${selectedStudent?.name}.`,
        });
        setMessageContent('');
        setIsMessageDialogOpen(false);
    };
    // State for email dialog
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');
    // Function to handle sending email to student
    const handleSendEmail = () => {
        if (!emailSubject.trim()) {
            toast({
                title: 'Subject Required',
                description: 'Please enter an email subject before sending.',
                variant: 'destructive',
            });
            return;
        }
        if (!emailContent.trim()) {
            toast({
                title: 'Email Content Required',
                description: 'Please enter email content before sending.',
                variant: 'destructive',
            });
            return;
        }
        toast({
            title: 'Email Sent',
            description: `Your email has been sent to ${selectedStudent?.name}.`,
        });
        setEmailSubject('');
        setEmailContent('');
        setIsEmailDialogOpen(false);
    };
    // Setup form for adding a new student
    const form = useForm({
        resolver: zodResolver(addStudentSchema),
        defaultValues: {
            name: '',
            email: '',
            status: 'active',
        },
    });
    // Function to handle adding a new student
    const handleAddStudent = (data) => {
        // Generate a random ID (in a real app, this would come from the backend)
        const maxId = students.reduce((max, student) => Math.max(max, student.id), 0);
        const newId = maxId + 1;
        // Create the new student
        const newStudent = {
            id: newId,
            name: data.name,
            email: data.email,
            status: data.status,
            lastLogin: 'Never',
            progress: 0,
            profileImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`, // Random avatar
        };
        // Add the student to the list
        setStudents([...students, newStudent]);
        // Close the dialog and reset the form
        setIsAddDialogOpen(false);
        form.reset();
        // Show success message
        toast({
            title: 'Student Added',
            description: `${data.name} has been added successfully. An invite email has been sent.`,
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Student Management" }), _jsx("p", { className: "text-muted-foreground", children: "View, manage, and monitor student accounts and their platform activity." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by name or email...", className: "pl-8", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Filter, { className: "mr-2 h-4 w-4" }), statusFilter === 'all' ? 'All Students' :
                                                    statusFilter === 'active' ? 'Active' : 'Inactive'] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Filter by Status" }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => setStatusFilter('all'), children: [statusFilter === 'all' && _jsx(Check, { className: "mr-2 h-4 w-4" }), "All Students"] }), _jsxs(DropdownMenuItem, { onClick: () => setStatusFilter('active'), children: [statusFilter === 'active' && _jsx(Check, { className: "mr-2 h-4 w-4" }), "Active"] }), _jsxs(DropdownMenuItem, { onClick: () => setStatusFilter('inactive'), children: [statusFilter === 'inactive' && _jsx(Check, { className: "mr-2 h-4 w-4" }), "Inactive"] })] })] }), _jsxs(Button, { onClick: () => setIsAddDialogOpen(true), children: [_jsx(UserPlus, { className: "mr-2 h-4 w-4" }), "Add Student"] })] })] }), _jsxs(Card, { children: [_jsx(CardContent, { className: "p-0", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Student" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Last Login" }), _jsx(TableHead, { children: "Progress" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: filteredStudents.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 5, className: "text-center py-6 text-muted-foreground", children: "No students found matching your criteria." }) })) : (filteredStudents.map(student => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { children: [_jsx(AvatarImage, { src: student.profileImage, alt: student.name }), _jsx(AvatarFallback, { children: getInitials(student.name) })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: student.name }), _jsx("div", { className: "text-sm text-muted-foreground", children: student.email })] })] }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: student.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: student.status }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }), student.lastLogin] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-full bg-secondary rounded-full h-2 mr-2", children: _jsx("div", { className: `h-2 rounded-full ${student.progress >= 70
                                                                    ? 'bg-green-500'
                                                                    : student.progress >= 40
                                                                        ? 'bg-yellow-500'
                                                                        : 'bg-red-500'}`, style: { width: `${student.progress}%` } }) }), _jsxs("span", { className: "text-sm font-medium", children: [student.progress, "%"] })] }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", children: [_jsx(MoreHorizontal, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Actions" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsxs(DropdownMenuItem, { onClick: () => handleViewStudent(student), children: [_jsx(Eye, { className: "mr-2 h-4 w-4" }), "View Profile"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                        setSelectedStudent(student);
                                                                        setIsEmailDialogOpen(true);
                                                                    }, children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Email"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                                        setSelectedStudent(student);
                                                                        setIsMessageDialogOpen(true);
                                                                    }, children: [_jsx(MessageSquare, { className: "mr-2 h-4 w-4" }), "Message"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => handleResetPassword(student.id), children: [_jsx(AlertCircle, { className: "mr-2 h-4 w-4" }), "Reset Password"] }), student.status === 'active' ? (_jsxs(DropdownMenuItem, { onClick: () => handleDeactivateStudent(student.id), children: [_jsx(Ban, { className: "mr-2 h-4 w-4" }), "Deactivate Account"] })) : (_jsxs(DropdownMenuItem, { onClick: () => handleActivateStudent(student.id), children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), "Activate Account"] })), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: "text-red-600", onClick: () => {
                                                                        setSelectedStudent(student);
                                                                        setIsDeleteDialogOpen(true);
                                                                    }, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Remove Student"] })] })] }) })] }, student.id)))) })] }) }), _jsxs(CardFooter, { className: "flex items-center justify-between border-t p-4", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["Showing ", filteredStudents.length, " of ", students.length, " students"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "Next" })] })] })] }), selectedStudent && (_jsx(Dialog, { open: isViewDialogOpen, onOpenChange: setIsViewDialogOpen, children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Student Profile" }), _jsxs(DialogDescription, { children: ["Detailed information about ", selectedStudent.name] })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "col-span-1 flex flex-col items-center gap-4", children: [_jsxs(Avatar, { className: "h-28 w-28", children: [_jsx(AvatarImage, { src: selectedStudent.profileImage, alt: selectedStudent.name }), _jsx(AvatarFallback, { className: "text-2xl", children: getInitials(selectedStudent.name) })] }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "font-semibold text-lg", children: selectedStudent.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: selectedStudent.email }), _jsx("div", { className: "mt-2", children: _jsx(Badge, { variant: selectedStudent.status === 'active' ? 'default' : 'secondary', className: "capitalize", children: selectedStudent.status }) })] }), _jsxs("div", { className: "w-full space-y-2", children: [_jsxs(Button, { variant: "outline", className: "w-full", size: "sm", onClick: () => setIsEmailDialogOpen(true), children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Email"] }), _jsxs(Button, { variant: "outline", className: "w-full", size: "sm", onClick: () => setIsMessageDialogOpen(true), children: [_jsx(MessageSquare, { className: "mr-2 h-4 w-4" }), "Message"] })] })] }), _jsx("div", { className: "col-span-2", children: _jsxs(Tabs, { defaultValue: "overview", children: [_jsxs(TabsList, { className: "w-full", children: [_jsx(TabsTrigger, { value: "overview", className: "flex-1", children: "Overview" }), _jsx(TabsTrigger, { value: "activity", className: "flex-1", children: "Activity" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-4 pt-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Student ID" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["STU-", selectedStudent.id.toString().padStart(6, '0')] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Joined Date" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Jan 10, 2025" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Last Login" }), _jsx("p", { className: "text-sm text-muted-foreground", children: selectedStudent.lastLogin })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Degree Program" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Bachelor of Science in Computer Science" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Graduation Year" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "2026" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Career Interest" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Software Development, Data Science" })] })] }) }), _jsx(TabsContent, { value: "activity", className: "pt-4", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "text-sm font-medium", children: "Recent Activity" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border-l-2 border-primary pl-4 pb-4 relative", children: [_jsx("div", { className: "absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]" }), _jsx("p", { className: "text-sm font-medium", children: "Updated Resume" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "May 3, 2025 at 2:45 PM" })] }), _jsxs("div", { className: "border-l-2 border-primary pl-4 pb-4 relative", children: [_jsx("div", { className: "absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]" }), _jsx("p", { className: "text-sm font-medium", children: "Completed LinkedIn Profile Review" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "May 1, 2025 at 10:30 AM" })] }), _jsxs("div", { className: "border-l-2 border-primary pl-4 pb-4 relative", children: [_jsx("div", { className: "absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]" }), _jsx("p", { className: "text-sm font-medium", children: "Started Mock Interview Session" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Apr 28, 2025 at 3:15 PM" })] }), _jsxs("div", { className: "border-l-2 border-primary pl-4 pb-4 relative", children: [_jsx("div", { className: "absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]" }), _jsx("p", { className: "text-sm font-medium", children: "Explored Software Engineering Career Path" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Apr 25, 2025 at 11:20 AM" })] }), _jsxs("div", { className: "border-l-2 border-primary pl-4 relative", children: [_jsx("div", { className: "absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-[7px]" }), _jsx("p", { className: "text-sm font-medium", children: "Completed Career Assessment" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Apr 22, 2025 at 9:45 AM" })] })] })] }) })] }) })] }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "outline", onClick: () => setIsViewDialogOpen(false), children: "Close" }) })] }) })), _jsx(Dialog, { open: isAddDialogOpen, onOpenChange: setIsAddDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add New Student" }), _jsx(DialogDescription, { children: "Enter student details below. An invitation email will be sent to the student." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(handleAddStudent), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter student's full name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "student@university.edu", type: "email", ...field }) }), _jsx(FormDescription, { children: "Must be a valid .edu email address" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Account Status" }), _jsx("div", { className: "relative", children: _jsx(FormControl, { children: _jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", defaultValue: "active", ...field, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] }) }) }), _jsx(FormDescription, { children: "Students with inactive status won't be able to log in" }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setIsAddDialogOpen(false), children: "Cancel" }), _jsxs(Button, { type: "submit", children: [_jsx(UserPlus, { className: "mr-2 h-4 w-4" }), "Add Student"] })] })] }) })] }) }), selectedStudent && (_jsx(Dialog, { open: isAnalyticsDialogOpen, onOpenChange: setIsAnalyticsDialogOpen, children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Student Analytics" }), _jsxs(DialogDescription, { children: ["Detailed analytics and insights for ", selectedStudent.name] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Platform Usage" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "8.3 hrs" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+12% from last month" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Career Growth" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "+24%" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Since first assessment" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Skills Acquired" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "7" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "2 in progress" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Activity Timeline" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute h-full w-px bg-border left-7 top-0" }), _jsxs("ul", { className: "space-y-4", children: [_jsxs("li", { className: "flex gap-4", children: [_jsxs("div", { className: "relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground", children: [_jsx(FileText, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Resume" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Updated Resume" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "May 3, 2025 at 2:45 PM" })] })] }), _jsxs("li", { className: "flex gap-4", children: [_jsxs("div", { className: "relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground", children: [_jsx(UserCircle, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Profile" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Completed LinkedIn Profile Review" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "May 1, 2025 at 10:30 AM" })] })] }), _jsxs("li", { className: "flex gap-4", children: [_jsxs("div", { className: "relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground", children: [_jsx(MessageSquare, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Interview" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Completed Mock Interview Session" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Apr 28, 2025 at 3:15 PM" })] })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Skills Development" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Resume Building" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "90%" })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-secondary", children: _jsx("div", { className: "h-2 rounded-full bg-primary", style: { width: '90%' } }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Interview Preparation" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "75%" })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-secondary", children: _jsx("div", { className: "h-2 rounded-full bg-primary", style: { width: '75%' } }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Networking" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "60%" })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-secondary", children: _jsx("div", { className: "h-2 rounded-full bg-primary", style: { width: '60%' } }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Job Application Strategy" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "45%" })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-secondary", children: _jsx("div", { className: "h-2 rounded-full bg-primary", style: { width: '45%' } }) })] })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsAnalyticsDialogOpen(false), children: "Close" }), _jsxs(Button, { onClick: handleExportReport, children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Export Report"] })] })] }) })), _jsx(Dialog, { open: isDeleteDialogOpen, onOpenChange: setIsDeleteDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Confirm Removal" }), _jsxs(DialogDescription, { children: ["Are you sure you want to remove ", selectedStudent?.name, " from the platform? This action cannot be undone."] })] }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(Button, { variant: "outline", onClick: () => setIsDeleteDialogOpen(false), children: "Cancel" }), _jsxs(Button, { variant: "destructive", onClick: () => selectedStudent && handleDeleteStudent(selectedStudent.id), children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Remove Student"] })] })] }) }), selectedStudent && (_jsx(Dialog, { open: isMessageDialogOpen, onOpenChange: setIsMessageDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Send Message" }), _jsxs(DialogDescription, { children: ["Send a direct message to ", selectedStudent.name, "."] })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "subject", children: "Subject" }), _jsx(Input, { id: "subject", placeholder: "Message subject", defaultValue: `Regarding your career development progress` })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "message", children: "Message" }), _jsx(Textarea, { id: "message", placeholder: "Type your message here...", className: "min-h-[150px]", value: messageContent, onChange: (e) => setMessageContent(e.target.value) })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsMessageDialogOpen(false), children: "Cancel" }), _jsxs(Button, { onClick: handleSendMessage, children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), "Send Message"] })] })] }) })), selectedStudent && (_jsx(Dialog, { open: isEmailDialogOpen, onOpenChange: setIsEmailDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Send Email" }), _jsxs(DialogDescription, { children: ["Send an email to ", selectedStudent.name, " at ", selectedStudent.email] })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "emailSubject", children: "Subject" }), _jsx(Input, { id: "emailSubject", placeholder: "Email subject", value: emailSubject, onChange: (e) => setEmailSubject(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "emailContent", children: "Email Content" }), _jsx(Textarea, { id: "emailContent", placeholder: "Type your email content here...", className: "min-h-[200px]", value: emailContent, onChange: (e) => setEmailContent(e.target.value) })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsEmailDialogOpen(false), children: "Cancel" }), _jsxs(Button, { onClick: handleSendEmail, children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Email"] })] })] }) }))] }));
}
