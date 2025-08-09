import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { JobSearch } from './JobSearch';
// Define the form schema for job application
const applicationSchema = z.object({
    jobTitle: z.string().min(1, "Job title is required"),
    companyName: z.string().min(1, "Company name is required"),
    jobLocation: z.string().optional(),
    applicationDate: z.string().optional(),
    resumeId: z.number().optional(),
    coverLetterId: z.number().optional(),
    jobLink: z.string().url("Please enter a valid URL").optional(),
    jobDescription: z.string().optional(),
    status: z.string().default("Not Started"),
    notes: z.string().optional(),
});
export function ApplyWizard({ isOpen, onClose, jobInfo = null }) {
    const [step, setStep] = useState(1);
    const [selectedJob, setSelectedJob] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // React Hook Form setup
    const form = useForm({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            jobTitle: "",
            companyName: "",
            jobLocation: "",
            jobLink: "",
            jobDescription: "",
            applicationDate: new Date().toISOString().split('T')[0],
            status: "Not Started",
            notes: "",
        }
    });
    // When jobInfo is provided, use it to pre-populate the form
    useEffect(() => {
        if (jobInfo && isOpen) {
            // If we have job info coming in from a search result, use it
            const initialValues = {
                jobTitle: jobInfo.title,
                companyName: jobInfo.company,
                jobLocation: jobInfo.location || '',
                jobLink: jobInfo.url,
                jobDescription: jobInfo.description,
                status: "Not Started",
            };
            form.reset(initialValues);
            // Skip job search step if we already have job info
            setStep(2);
        }
    }, [jobInfo, isOpen, form]);
    // Fetch resumes for the resume selection step
    const { data: resumes, isLoading: isLoadingResumes } = useQuery({
        queryKey: ['/api/resumes'],
        queryFn: async () => {
            try {
                const response = await fetch('/api/resumes');
                if (!response.ok)
                    return [];
                return await response.json();
            }
            catch (error) {
                console.error('Error fetching resumes:', error);
                return [];
            }
        },
        enabled: isOpen && step === 2
    });
    // Create application mutation
    const createApplication = useMutation({
        mutationFn: async (values) => {
            // Determine if this application has been applied to
            const hasBeenApplied = values.status === 'Applied';
            // Set appropriate date fields based on status
            const applicationData = {
                ...values,
                appliedAt: hasBeenApplied ? new Date().toISOString() : null,
                submittedAt: hasBeenApplied ? new Date().toISOString() : null
            };
            // For demo mode, update mock applications in localStorage
            try {
                const response = await apiRequest({
                    url: '/api/applications',
                    method: 'POST',
                    data: applicationData,
                });
                return response;
            }
            catch (error) {
                if (error.message?.includes('Authentication required')) {
                    // Save to localStorage for demo mode
                    console.log('Demo mode: Creating application in localStorage');
                    const mockId = Date.now();
                    const mockApp = {
                        id: mockId,
                        ...applicationData,
                        status: values.status,
                        notes: values.notes || '',
                        company: values.companyName,
                        companyName: values.companyName,
                        position: values.jobTitle,
                        jobTitle: values.jobTitle,
                        title: values.jobTitle,
                        location: values.jobLocation || 'Remote',
                        jobLocation: values.jobLocation || 'Remote',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        jobLink: values.jobLink || '',
                        source: 'Manual Entry'
                    };
                    // Store in localStorage
                    const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    storedApplications.push(mockApp);
                    localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
                    console.log('Stored mock application in localStorage:', mockApp);
                    return { success: true, message: 'Application created in demo mode' };
                }
                throw error;
            }
        },
        onSuccess: () => {
            toast({
                title: "Application created",
                description: "Your job application has been added to the tracker.",
                variant: "default",
            });
            // Invalidate both endpoints since they're aliased in the backend
            queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            // Force an immediate refetch to ensure the new application appears
            setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            }, 300);
            onClose();
            setStep(1);
            form.reset();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "There was a problem creating your application. Please try again.",
                variant: "destructive",
            });
            console.error('Error creating application:', error);
        }
    });
    // Handle form submission
    const onSubmit = (values) => {
        createApplication.mutate(values);
    };
    // Reset form and steps when closing the dialog
    const handleClose = () => {
        setStep(1);
        form.reset();
        onClose();
    };
    // Handle job selection
    const handleJobSelect = (job) => {
        setSelectedJob(job);
        form.setValue('jobTitle', job.title);
        form.setValue('companyName', job.company);
        form.setValue('jobLocation', job.location || '');
        form.setValue('jobLink', job.applyUrl);
        form.setValue('jobDescription', job.fullDescription || job.description);
        setStep(2);
    };
    // If the dialog is not open, don't render anything
    if (!isOpen)
        return null;
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "ghost", size: "icon", onClick: handleClose, className: "absolute top-4 right-4", children: [_jsx("span", { className: "sr-only", children: "Close" }), "\u2715"] }), step === 1 && (_jsxs(Tabs, { defaultValue: "manual", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "manual", children: "Enter Manually" }), _jsx(TabsTrigger, { value: "import", children: "Import Job" })] }), _jsx(TabsContent, { value: "manual", children: _jsx(Form, { ...form, children: _jsxs("form", { className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "jobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Software Engineer", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "companyName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Acme Inc.", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "jobLocation", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Remote, New York, NY", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "applicationDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "jobLink", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://example.com/job-posting", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobDescription", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Paste the job description here...", className: "min-h-[120px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "button", className: "w-full", onClick: async () => {
                                            const result = await form.trigger(['jobTitle', 'companyName']);
                                            if (result)
                                                setStep(2);
                                        }, children: "Continue to Resume Selection" })] }) }) }), _jsx(TabsContent, { value: "import", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-muted rounded-md", children: [_jsx("h3", { className: "font-medium mb-2", children: "Import from URL" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { placeholder: "Paste job URL" }), _jsx(Button, { type: "button", children: "Import" })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "font-medium mb-4", children: "Search for Jobs" }), _jsx(JobSearch, { onSelectJob: handleJobSelect })] })] }) })] })), step === 2 && (_jsx(_Fragment, { children: isLoadingResumes ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) })) : resumes && resumes.length > 0 ? (_jsx("div", { className: "space-y-4", children: resumes.map((resume) => (_jsx(Card, { className: `cursor-pointer hover:border-primary transition-colors ${form.getValues('resumeId') === resume.id ? 'border-primary bg-primary/5' : ''}`, onClick: () => form.setValue('resumeId', resume.id), children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: resume.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Last updated: ", new Date(resume.updatedAt).toLocaleDateString()] })] }), form.getValues('resumeId') === resume.id && (_jsx("div", { className: "h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs", children: "\u2713" }))] }) }) }, resume.id))) })) : null })), step === 3 && (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { className: "bg-muted p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium", children: "Job Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 mt-2", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs text-muted-foreground", children: "Job Title" }), _jsx("p", { className: "text-sm font-medium", children: form.getValues('jobTitle') })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs text-muted-foreground", children: "Company" }), _jsx("p", { className: "text-sm font-medium", children: form.getValues('companyName') })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs text-muted-foreground", children: "Location" }), _jsx("p", { className: "text-sm", children: form.getValues('jobLocation') || 'Not specified' })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs text-muted-foreground", children: "Date" }), _jsx("p", { className: "text-sm", children: form.getValues('applicationDate') })] })] })] }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Application Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Add any notes about this application...", className: "min-h-[120px]", ...field }) }), _jsx(FormDescription, { children: "Include any details you want to remember about this application." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsx(FormControl, { children: _jsxs("select", { className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", ...field, children: [_jsx("option", { value: "Not Started", children: "Not Started" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Applied", children: "Applied" }), _jsx("option", { value: "Interviewing", children: "Interviewing" }), _jsx("option", { value: "Offer", children: "Offer" }), _jsx("option", { value: "Rejected", children: "Rejected" })] }) }), _jsx(FormDescription, { children: "Update the status as your application progresses." }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-between w-full mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setStep(2), children: "Back" }), _jsx(Button, { type: "submit", disabled: createApplication.isPending, children: createApplication.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Create Application') })] })] }) }))] }));
}
