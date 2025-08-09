import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { insertInterviewProcessSchema } from "@/utils/schema";
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
// Extend the insert schema with validation rules
const formSchema = insertInterviewProcessSchema.extend({
    companyName: z.string().min(1, 'Company name is required'),
    company: z.string().optional(), // For consistency with Adzuna applications
    position: z.string().min(1, 'Position is required'),
    title: z.string().optional(), // For consistency with Adzuna applications
    jobTitle: z.string().optional(), // For consistency with Adzuna applications
    location: z.string().optional(),
    jobDescription: z.string().optional(),
    description: z.string().optional(), // For consistency with Adzuna applications
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().default('In Progress'),
    jobLink: z.string().optional(),
    externalJobUrl: z.string().optional(),
    applied: z.boolean().optional().default(false), // Track if the user has applied
});
// Helper function to format date in ISO format
const formatDate = () => new Date().toISOString();
export const NewInterviewProcessForm = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: '',
            company: '',
            position: '',
            title: '',
            jobTitle: '',
            location: '',
            jobDescription: '',
            description: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            notes: '',
            status: 'In Progress',
            jobLink: '',
            externalJobUrl: '',
            applied: false,
        },
    });
    // Watch the applied field to update status
    const hasApplied = form.watch('applied');
    // Create a unified application in both interview processes and job applications
    const createApplicationMutation = useMutation({
        mutationFn: async (data) => {
            try {
                // First, create the interview process
                const processResponse = await apiRequest('POST', '/api/interview/processes', {
                    companyName: data.companyName,
                    position: data.position,
                    jobDescription: data.jobDescription,
                    contactName: data.contactName,
                    contactEmail: data.contactEmail,
                    contactPhone: data.contactPhone,
                    notes: data.notes,
                    status: hasApplied ? 'Applied' : 'In Progress',
                    jobLink: data.jobLink || data.externalJobUrl || '',
                });
                const processResult = await processResponse.json();
                const processId = processResult.id;
                // Create a job application object matching the format of Adzuna applications
                try {
                    // Try to create a job application 
                    const jobAppResponse = await apiRequest('POST', '/api/applications', {
                        company: data.companyName,
                        companyName: data.companyName,
                        position: data.position,
                        title: data.position,
                        jobTitle: data.position,
                        location: data.location || 'Remote',
                        description: data.jobDescription,
                        jobDescription: data.jobDescription,
                        notes: hasApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
                        jobLink: data.jobLink || data.externalJobUrl || '',
                        externalJobUrl: data.jobLink || data.externalJobUrl || '',
                        status: hasApplied ? 'Applied' : 'In Progress',
                        source: 'Manual',
                        applicationDate: formatDate(),
                        submittedAt: hasApplied ? formatDate() : null,
                        appliedAt: hasApplied ? formatDate() : null,
                    });
                    return {
                        process: processResult,
                        application: await jobAppResponse.json()
                    };
                }
                catch (error) {
                    console.error('Failed to create job application, falling back to localStorage:', error);
                    // For fallback/demo purposes, create a mock application in localStorage
                    const mockId = Date.now();
                    const mockApp = {
                        id: mockId,
                        // Status fields
                        status: hasApplied ? 'Applied' : 'In Progress',
                        appliedAt: hasApplied ? formatDate() : null,
                        submittedAt: hasApplied ? formatDate() : null,
                        applicationDate: formatDate(),
                        // Job details fields with multiple naming formats for compatibility
                        company: data.companyName,
                        companyName: data.companyName,
                        position: data.position,
                        jobTitle: data.position,
                        title: data.position,
                        // Location fields
                        location: data.location || 'Remote',
                        jobLocation: data.location || 'Remote',
                        // Description and notes
                        jobDescription: data.jobDescription,
                        description: data.jobDescription,
                        notes: hasApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
                        // Date tracking
                        createdAt: formatDate(),
                        updatedAt: formatDate(),
                        // URL fields
                        jobLink: data.jobLink || data.externalJobUrl || '',
                        externalJobUrl: data.jobLink || data.externalJobUrl || '',
                        // Source tracking
                        source: 'Manual',
                        userId: 0, // Will be filled by the backend in real implementation
                    };
                    // Store in localStorage for demo mode
                    const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    storedApplications.push(mockApp);
                    localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
                    return {
                        process: processResult,
                        application: mockApp
                    };
                }
            }
            catch (error) {
                console.error('Failed to create application:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            // Invalidate all relevant queries to update UI
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            // Force immediate refresh
            queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            }, 300);
            toast({
                title: 'Application Created',
                description: hasApplied
                    ? 'Your job application has been created and marked as Applied'
                    : 'Your job application has been started successfully',
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error('Error creating application:', error);
            toast({
                title: 'Error',
                description: `Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    const onSubmit = (data) => {
        // Set company field to match companyName for format consistency
        data.company = data.companyName;
        data.title = data.position;
        data.jobTitle = data.position;
        data.description = data.jobDescription;
        // Update status based on applied checkbox
        data.status = data.applied ? 'Applied' : 'In Progress';
        createApplicationMutation.mutate(data);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[525px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "New Job Application" }), _jsx(DialogDescription, { children: "Create a new job application to track your progress and interviews." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "companyName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter company name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "position", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Position/Job Title*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter job title/position", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter job location (e.g., Remote, New York, NY)", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobDescription", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter job description or key requirements", className: "h-24", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobLink", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter link to job posting", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "contactName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter contact name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "contactEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter contact email", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter any additional notes", className: "h-20", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "applied", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsx(FormLabel, { children: "I have already applied for this position" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "This will mark the application as \"Applied\" in your tracker" })] })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createApplicationMutation.isPending, children: createApplicationMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating..."] })) : ('Create Application') })] })] }) })] }) }));
};
