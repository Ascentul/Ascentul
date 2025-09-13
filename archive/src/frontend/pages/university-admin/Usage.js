import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, BarChart2, TrendingUp, Users, Clock, Calendar as CalendarIcon, Layers, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
export default function Usage() {
    const [dateRange, setDateRange] = useState('last30Days');
    const [programFilter, setProgramFilter] = useState('all');
    const [isExporting, setIsExporting] = useState(false);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [savedReports, setSavedReports] = useState([
        {
            id: '1',
            name: 'April 2025 Monthly Usage Report',
            date: 'May 01, 2025',
            type: 'Monthly',
            frequency: 'monthly'
        },
        {
            id: '2',
            name: 'Feature Engagement Analysis Q1',
            date: 'Apr 15, 2025',
            type: 'Quarterly',
            frequency: 'quarterly'
        },
        {
            id: '3',
            name: 'Program Comparison Report',
            date: 'Apr 10, 2025',
            type: 'Custom',
            frequency: 'once'
        },
        {
            id: '4',
            name: 'Annual Usage Summary 2024',
            date: 'Jan 15, 2025',
            type: 'Annual',
            frequency: 'yearly'
        }
    ]);
    const { toast } = useToast();
    // Initialize the form
    const form = useForm({
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
    const onScheduleReport = async (data) => {
        setIsScheduling(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // In a real implementation, this would be an API request:
            // await apiRequest('POST', '/api/schedule-report', data);

            // Add to the Recent Reports section (would be done via API/DB in a real implementation)
            const now = new Date();
            const reportDate = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });
            // Create a new report entry
            const newReport = {
                id: `new-${Date.now()}`,
                name: data.reportName,
                date: reportDate,
                type: data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1),
                frequency: data.frequency
            };
            // Add the new report to the top of the list
            setSavedReports([newReport, ...savedReports]);
            // Show success toast
            toast({
                title: "Report Scheduled",
                description: `"${data.reportName}" will be generated ${data.frequency === 'once' ? 'once' : data.frequency}`,
                variant: "default",
            });
            // Reset form and close dialog
            form.reset();
            setScheduleDialogOpen(false);
        }
        catch (error) {
            console.error('Error scheduling report:', error);
            toast({
                title: "Error",
                description: "Failed to schedule the report. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsScheduling(false);
        }
    };
    // Function to convert data to CSV format
    const convertToCSV = (data, headerMap) => {
        // Get all unique keys from all objects in data
        const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item)))).filter(key => headerMap[key]); // Only include keys that have headers defined
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
    // Generate export content based on data selections
    const generateExportContent = (includeSections = { overview: true, features: true, programs: true }) => {
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
        // Get date for generating metadata
        const now = new Date();
        // Combine all data into sections
        let csvContent = '# Ascentul University Usage Data Export\n';
        csvContent += `# Generated: ${now.toLocaleString()}\n\n`;
        // Add sections based on selections
        if (includeSections.overview) {
            csvContent += '## Monthly Usage Data\n';
            csvContent += convertToCSV(monthlyUsageData, monthlyHeaders);
            csvContent += '\n\n';
        }
        if (includeSections.programs) {
            csvContent += '## Program Usage Data\n';
            csvContent += convertToCSV(programUsageData, programHeaders);
            csvContent += '\n\n';
        }
        if (includeSections.features) {
            csvContent += '## Feature Usage Data\n';
            csvContent += convertToCSV(featureUsageData, featureHeaders);
            csvContent += '\n\n';
            csvContent += '## Usage Breakdown\n';
            csvContent += convertToCSV(usageBreakdown, usageBreakdownHeaders);
        }
        return csvContent;
    };
    // Download a specific report
    const downloadReport = (report) => {
        try {
            // Determine sections to include based on saved report type
            const includeSections = {
                overview: true,
                features: report.frequency === 'monthly' || report.frequency === 'quarterly',
                programs: report.frequency === 'quarterly' || report.frequency === 'yearly'
            };
            // Generate content
            const csvContent = generateExportContent(includeSections);
            // Create file name based on report
            const dateStr = report.date.replace(/,/g, '').replace(/ /g, '-');
            const fileName = `${report.name.replace(/ /g, '_')}_${dateStr}.csv`;
            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Clean up
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
            // Show success toast
            toast({
                title: "Report Downloaded",
                description: `${report.name} has been downloaded successfully.`,
                variant: "default",
            });
        }
        catch (error) {
            console.error('Error downloading report:', error);
            toast({
                title: "Download Failed",
                description: "An error occurred while downloading the report.",
                variant: "destructive",
            });
        }
    };
    // Handler for exporting data
    const handleExportData = () => {
        setIsExporting(true);
        try {
            // Get date for filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            // Generate full report with all sections
            const csvContent = generateExportContent();
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
        }
        catch (error) {
            console.error('Error exporting data:', error);
            setIsExporting(false);
        }
    };
    // Fetch academic programs from API
    const { data: academicPrograms = [], isLoading: programsLoading, error: programsError } = useQuery({
        queryKey: ['/api/academic-programs'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/academic-programs');
            if (!response.ok) {
                throw new Error('Failed to fetch academic programs');
            }
            return await response.json();
        }
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Platform Usage" }), _jsx("p", { className: "text-muted-foreground", children: "Monitor and analyze how students are using the Ascentul Career Development Platform." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-between", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Select, { value: dateRange, onValueChange: setDateRange, children: [_jsxs(SelectTrigger, { className: "w-[180px]", children: [_jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }), _jsx(SelectValue, { placeholder: "Select date range" })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "last7Days", children: "Last 7 days" }), _jsx(SelectItem, { value: "last30Days", children: "Last 30 days" }), _jsx(SelectItem, { value: "last90Days", children: "Last 90 days" }), _jsx(SelectItem, { value: "lastYear", children: "Last year" }), _jsx(SelectItem, { value: "allTime", children: "All time" })] })] }), _jsxs(Select, { value: programFilter, onValueChange: setProgramFilter, children: [_jsxs(SelectTrigger, { className: "w-[220px]", children: [_jsx(Layers, { className: "mr-2 h-4 w-4" }), _jsx(SelectValue, { placeholder: "Select program" })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Programs" }), programsLoading ? (_jsxs("div", { className: "flex items-center justify-center py-2", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }), _jsx("span", { children: "Loading programs..." })] })) : programsError ? (_jsx("div", { className: "text-red-500 p-2 text-sm", children: "Error loading programs" })) : academicPrograms.length === 0 ? (_jsx("div", { className: "p-2 text-sm text-muted-foreground", children: "No programs found" })) : (academicPrograms.map((program) => (_jsxs(SelectItem, { value: program.id.toString(), children: [program.programName, " (", program.degreeType, ")"] }, program.id))))] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => setScheduleDialogOpen(true), children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), "Schedule Report"] }), _jsx(Button, { variant: "outline", onClick: handleExportData, disabled: isExporting, children: isExporting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Exporting..."] })) : (_jsxs(_Fragment, { children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Export Data"] })) })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Logins" }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "18,437" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+12% from previous period" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Active Users" }), _jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "1,280" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "85% of total students" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Avg. Session Time" }), _jsx(Clock, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "28 min" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+5 min from previous period" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Feature Usage" }), _jsx(BarChart2, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "16,750" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+18% from previous period" })] })] })] }), _jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid grid-cols-3 w-full max-w-md mx-auto", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "features", children: "Features" }), _jsx(TabsTrigger, { value: "programs", children: "Programs" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Monthly Activity" }), _jsx(CardDescription, { children: "Student activity trends over the past 5 months." })] }), _jsx(CardContent, { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: monthlyUsageData, margin: {
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 30,
                                            }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "logins", stroke: "#8884d8", strokeWidth: 2, activeDot: { r: 8 } }), _jsx(Line, { type: "monotone", dataKey: "activities", stroke: "#82ca9d", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "resumes", stroke: "#ffc658", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "interviews", stroke: "#ff7300", strokeWidth: 2 })] }) }) })] }) }), _jsxs(TabsContent, { value: "features", className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "md:col-span-2", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Feature Usage Distribution" }), _jsx(CardDescription, { children: "Breakdown of features used by students." })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: featureUsageData, margin: {
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 30,
                                                        }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "value", fill: "#8884d8", label: { position: 'top' }, children: featureUsageData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Feature Popularity" }), _jsx(CardDescription, { children: "Most used features on the platform." })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: featureUsageData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, fill: "#8884d8", paddingAngle: 5, dataKey: "value", label: true, children: featureUsageData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Detailed Feature Usage" }), _jsx(CardDescription, { children: "Breakdown of feature usage with change from previous period." })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left font-medium p-2", children: "Feature" }), _jsx("th", { className: "text-right font-medium p-2", children: "Usage Count" }), _jsx("th", { className: "text-right font-medium p-2", children: "Change" })] }) }), _jsx("tbody", { children: usageBreakdown.map((item) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "p-2", children: item.feature }), _jsx("td", { className: "text-right p-2", children: item.usage.toLocaleString() }), _jsx("td", { className: "text-right p-2", children: _jsx(Badge, { variant: item.status === 'increase' ? 'default' : 'destructive', children: item.change }) })] }, item.id))) })] }) }) })] })] }), _jsxs(TabsContent, { value: "programs", className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Usage by Program" }), _jsx(CardDescription, { children: "Distribution of platform usage across different programs." })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: programUsageData, cx: "50%", cy: "50%", outerRadius: 80, fill: "#8884d8", dataKey: "value", label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, children: programUsageData.map((entry, index) => (_jsx(Cell, { fill: entry.color || COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Engagement by Program" }), _jsx(CardDescription, { children: "Average engagement score by academic program." })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: programUsageData, layout: "vertical", margin: {
                                                            top: 20,
                                                            right: 30,
                                                            left: 100,
                                                            bottom: 5,
                                                        }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { dataKey: "name", type: "category", scale: "band", width: 90, tick: { fontSize: 12 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", fill: "#8884d8", children: programUsageData.map((entry, index) => (_jsx(Cell, { fill: entry.color || COLORS[index % COLORS.length] }, `cell-${index}`))) })] }) }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Program Engagement Details" }), _jsx(CardDescription, { children: "Comparison of key metrics across different academic programs." })] }), _jsx(CardContent, { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: monthlyUsageData, margin: {
                                                    top: 20,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 30,
                                                }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "logins", stackId: "a", fill: "#8884d8" }), _jsx(Bar, { dataKey: "activities", stackId: "a", fill: "#82ca9d" }), _jsx(Bar, { dataKey: "resumes", stackId: "a", fill: "#ffc658" }), _jsx(Bar, { dataKey: "interviews", stackId: "a", fill: "#ff7300" })] }) }) })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Reports" }), _jsx(CardDescription, { children: "Access and download previously generated reports." })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left font-medium p-2", children: "Report Name" }), _jsx("th", { className: "text-left font-medium p-2", children: "Date" }), _jsx("th", { className: "text-left font-medium p-2", children: "Type" }), _jsx("th", { className: "text-right font-medium p-2", children: "Actions" })] }) }), _jsxs("tbody", { children: [savedReports.map((report) => (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "p-2", children: report.name }), _jsx("td", { className: "p-2", children: report.date }), _jsx("td", { className: "p-2", children: _jsx(Badge, { variant: "outline", children: report.type }) }), _jsx("td", { className: "text-right p-2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => downloadReport(report), title: `Download ${report.name}`, children: _jsx(Download, { className: "h-4 w-4" }) }) })] }, report.id))), savedReports.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "text-center py-4 text-muted-foreground", children: "No reports scheduled yet. Use the \"Schedule Report\" button to create one." }) }))] })] }) }) })] }), _jsx(Dialog, { open: scheduleDialogOpen, onOpenChange: setScheduleDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Schedule New Report" }), _jsx(DialogDescription, { children: "Create a scheduled report that will be automatically generated and distributed." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onScheduleReport), className: "space-y-5", children: [_jsx(FormField, { control: form.control, name: "reportName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Report Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Monthly Usage Summary", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "reportDescription", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Monthly summary of platform usage and engagement metrics", className: "resize-none", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [_jsx(FormField, { control: form.control, name: "frequency", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Frequency" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select frequency" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "once", children: "Once" }), _jsx(SelectItem, { value: "daily", children: "Daily" }), _jsx(SelectItem, { value: "weekly", children: "Weekly" }), _jsx(SelectItem, { value: "monthly", children: "Monthly" }), _jsx(SelectItem, { value: "quarterly", children: "Quarterly" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "recipients", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Recipients" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "email@university.edu, dept@university.edu", ...field }) }), _jsx(FormDescription, { className: "text-xs", children: "Separate multiple email addresses with commas" }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "border rounded-md p-4", children: [_jsx("div", { className: "font-medium mb-2", children: "Data to Include" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(FormField, { control: form.control, name: "dataSelection.overview", render: ({ field }) => (_jsxs(FormItem, { className: "flex items-center space-x-2", children: [_jsx(FormControl, { children: _jsx("input", { type: "checkbox", checked: field.value, onChange: field.onChange, className: "h-4 w-4 rounded border-gray-300 text-primary" }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: "Overview Metrics" })] })) }), _jsx(FormField, { control: form.control, name: "dataSelection.features", render: ({ field }) => (_jsxs(FormItem, { className: "flex items-center space-x-2", children: [_jsx(FormControl, { children: _jsx("input", { type: "checkbox", checked: field.value, onChange: field.onChange, className: "h-4 w-4 rounded border-gray-300 text-primary" }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: "Feature Analysis" })] })) }), _jsx(FormField, { control: form.control, name: "dataSelection.programs", render: ({ field }) => (_jsxs(FormItem, { className: "flex items-center space-x-2", children: [_jsx(FormControl, { children: _jsx("input", { type: "checkbox", checked: field.value, onChange: field.onChange, className: "h-4 w-4 rounded border-gray-300 text-primary" }) }), _jsx(FormLabel, { className: "text-sm font-normal", children: "Program Breakdown" })] })) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setScheduleDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isScheduling, children: isScheduling ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Scheduling..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), "Schedule Report"] })) })] })] }) })] }) })] }));
}
