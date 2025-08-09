import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
export function ApplicationWizard({ isOpen, onClose, jobDetails }) {
    const [step, setStep] = useState(1);
    const [applicationId, setApplicationId] = useState(null);
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    // Form control
    const { register, handleSubmit, reset, watch, getValues, formState: { errors, isSubmitting } } = useForm();
    // Reset step when dialog opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            reset();
        }
    }, [isOpen, reset]);
    // Check if we already have application data if an ID was provided
    const { data: existingApplication, isLoading: isLoadingApplication } = useQuery({
        queryKey: ['/api/applications', applicationId],
        queryFn: async () => {
            if (!applicationId)
                return null;
            try {
                const response = await apiRequest({
                    url: `/api/applications/${applicationId}`,
                    method: 'GET'
                });
                return response;
            }
            catch (error) {
                // For demo purposes, create a mock application if authentication fails
                const errorWithMessage = error;
                if (errorWithMessage.message?.includes('Authentication required')) {
                    console.log('Demo mode: Creating mock application data');
                    return {
                        application: {
                            id: applicationId,
                            title: jobDetails.title,
                            company: jobDetails.company,
                            status: 'in_progress',
                            createdAt: new Date().toISOString(),
                        },
                        steps: [
                            { id: 1, applicationId: applicationId, stepName: 'personal_info', stepOrder: 1, completed: true },
                            { id: 2, applicationId: applicationId, stepName: 'resume', stepOrder: 2, completed: false },
                            { id: 3, applicationId: applicationId, stepName: 'cover_letter', stepOrder: 3, completed: false },
                            { id: 4, applicationId: applicationId, stepName: 'review', stepOrder: 4, completed: false }
                        ]
                    };
                }
                throw error;
            }
        },
        enabled: !!applicationId,
    });
    // Create application mutation
    const createApplicationMutation = useMutation({
        mutationFn: async (data) => {
            try {
                const response = await apiRequest({
                    url: '/api/applications',
                    method: 'POST',
                    data: {
                        jobId: 0, // We'll create a local job entry from the Adzuna data
                        title: jobDetails.title,
                        jobTitle: jobDetails.title, // Additional field for Interview.tsx compatibility
                        position: jobDetails.title, // Additional field for Interview.tsx compatibility
                        company: jobDetails.company,
                        companyName: jobDetails.company, // Additional field for Interview.tsx compatibility
                        location: jobDetails.location || 'Remote',
                        jobLocation: jobDetails.location || 'Remote', // Additional field for Interview.tsx compatibility
                        description: jobDetails.description,
                        status: 'In Progress', // Capitalized for consistency in display
                        adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || '',
                        externalJobUrl: jobDetails.url || '',
                        jobLink: jobDetails.url || '', // Additional field for Interview.tsx compatibility
                        notes: data.notes || '',
                        source: 'Adzuna'
                    }
                });
                return response;
            }
            catch (error) {
                // For demo purposes, create a temporary mock application
                const errorWithMessage = error;
                if (errorWithMessage.message?.includes('Authentication required')) {
                    // Simulate a successful response with mock data
                    const mockId = Math.floor(Math.random() * 10000);
                    console.log('Demo mode: Creating mock application data');
                    // Create a complete mock application object with full compatibility
                    const mockApp = {
                        id: mockId,
                        // Standard fields
                        title: jobDetails.title,
                        company: jobDetails.company,
                        companyName: jobDetails.company,
                        status: 'In Progress',
                        location: jobDetails.location || 'Remote',
                        jobLocation: jobDetails.location || 'Remote',
                        position: jobDetails.title,
                        jobTitle: jobDetails.title,
                        jobDescription: jobDetails.description,
                        notes: data.notes || '',
                        // URL fields
                        externalJobUrl: jobDetails.url || '',
                        jobLink: jobDetails.url || '',
                        // Date fields
                        createdAt: formatDate(),
                        updatedAt: formatDate(),
                        applicationDate: formatDate(),
                        submittedAt: null,
                        appliedAt: null,
                        // Source tracking
                        source: 'Adzuna',
                        // Additional metadata
                        adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || null,
                    };
                    // Store initial application in localStorage
                    const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    storedApplications.push(mockApp);
                    localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
                    return {
                        application: mockApp,
                        steps: [
                            { id: mockId * 10 + 1, applicationId: mockId, stepName: 'personal_info', stepOrder: 1, completed: true, data: { notes: data.notes || '' } },
                            { id: mockId * 10 + 2, applicationId: mockId, stepName: 'resume', stepOrder: 2, completed: false, data: {} },
                            { id: mockId * 10 + 3, applicationId: mockId, stepName: 'cover_letter', stepOrder: 3, completed: false, data: {} },
                            { id: mockId * 10 + 4, applicationId: mockId, stepName: 'review', stepOrder: 4, completed: false, data: {} }
                        ]
                    };
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            setApplicationId(data.application.id);
            // Invalidate all application-related queries to ensure updated data is fetched
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            // Force an immediate refresh of the job applications list
            setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            }, 100);
            toast({
                title: 'Application created',
                description: 'Your application has been started successfully.',
            });
            setStep(2);
        },
        onError: (error) => {
            console.error('Error creating application:', error);
            toast({
                title: 'Error',
                description: 'Failed to create application. Please try again.',
                variant: 'destructive',
            });
        }
    });
    // Update application step mutation
    const updateStepMutation = useMutation({
        mutationFn: async ({ stepId, data }) => {
            try {
                return await apiRequest({
                    url: `/api/applications/steps/${stepId}/complete`,
                    method: 'POST',
                    data
                });
            }
            catch (error) {
                // For demo purposes, simulate a successful step update
                const errorWithMessage = error;
                if (errorWithMessage.message?.includes('Authentication required')) {
                    console.log('Demo mode: Simulating successful step update');
                    return {
                        id: stepId,
                        completed: true,
                        data: data
                    };
                }
                throw error;
            }
        },
        onSuccess: () => {
            // Refresh application data
            queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            // Force immediate refresh
            queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
        }
    });
    // Submit application mutation
    const submitApplicationMutation = useMutation({
        mutationFn: async () => {
            if (!applicationId)
                throw new Error('No application ID');
            // Get form values including the applied checkbox status before sending
            let hasBeenApplied = false;
            try {
                // Look for applied status in local storage
                const storedData = localStorage.getItem(`application_${applicationId}_data`);
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    hasBeenApplied = !!parsedData.applied;
                    console.log('Found stored application data with applied status:', hasBeenApplied);
                }
            }
            catch (err) {
                console.error('Error reading applied checkbox state:', err);
            }
            try {
                return await apiRequest({
                    url: `/api/applications/${applicationId}/submit`,
                    method: 'POST',
                    data: { applied: hasBeenApplied } // Send the checkbox state to the server
                });
            }
            catch (error) {
                // For demo purposes, simulate a successful application submission
                const errorWithMessage = error;
                if (errorWithMessage.message?.includes('Authentication required')) {
                    console.log('Demo mode: Simulating successful application submission');
                    // In demo mode, use the checkbox state we determined above
                    // Create a complete mock application object for the Interview page with full format compatibility
                    const completedApplication = {
                        id: applicationId,
                        // Status fields
                        status: hasBeenApplied ? 'Applied' : 'In Progress', // Set status based on checkbox
                        appliedAt: hasBeenApplied ? formatDate() : null,
                        submittedAt: hasBeenApplied ? formatDate() : null,
                        applicationDate: formatDate(),
                        // Job details fields with multiple naming formats for compatibility
                        company: jobDetails.company,
                        companyName: jobDetails.company,
                        position: jobDetails.title,
                        jobTitle: jobDetails.title,
                        title: jobDetails.title,
                        // Location fields with multiple naming formats
                        location: jobDetails.location || 'Remote',
                        jobLocation: jobDetails.location || 'Remote',
                        // Description and notes
                        jobDescription: jobDetails.description,
                        description: jobDetails.description,
                        notes: hasBeenApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
                        // Date tracking
                        createdAt: formatDate(),
                        updatedAt: formatDate(),
                        // URL fields
                        jobLink: jobDetails.url || '',
                        externalJobUrl: jobDetails.url || '',
                        // Source tracking
                        source: 'Adzuna',
                        adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || null,
                    };
                    // Store the completed application in localStorage for demo mode
                    const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    // Check if application with this ID already exists
                    const existingIndex = storedApplications.findIndex((app) => app.id === applicationId);
                    if (existingIndex >= 0) {
                        // Update existing application
                        storedApplications[existingIndex] = completedApplication;
                    }
                    else {
                        // Add new application
                        storedApplications.push(completedApplication);
                    }
                    localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
                    console.log('Stored mock application in localStorage:', completedApplication);
                    return completedApplication;
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            // Invalidate all application-related queries to ensure updated data is fetched
            // Invalidate both /api/applications and /api/job-applications endpoints
            // as both may be used in different parts of the application
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
            queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            // For backwards compatibility, also invalidate interview processes
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            // Invalidate general user data to refresh notifications and counts
            queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
            // Force multiple immediate refreshes of the application list to ensure data is updated
            // First immediate refresh
            queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            // Second refresh after a short delay to ensure any server processing is complete
            setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            }, 300);
            // Final refresh after database operations should be complete
            setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
            }, 800);
            toast({
                title: 'Application submitted',
                description: 'Your application has been marked as submitted and added to your applications tracker.',
                duration: 5000, // Give users a bit more time to read the message
            });
            // Navigate to the application tracker page
            onClose();
            setLocation('/application-tracker');
        },
        onError: (error) => {
            console.error('Error submitting application:', error);
            let errorMessage = 'Failed to submit application. Please try again.';
            // Check if the error has detailed information from the server
            const axiosError = error;
            if (axiosError.response?.data?.message) {
                errorMessage = axiosError.response.data.message;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            toast({
                title: 'Submission Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    });
    // Handle step submission
    const onSubmitStep = async (data) => {
        try {
            if (step === 1) {
                createApplicationMutation.mutate(data);
            }
            else if (applicationId && existingApplication) {
                const applicationWithSteps = existingApplication;
                const currentStep = applicationWithSteps.steps.find((s) => s.stepOrder === step);
                if (currentStep) {
                    await updateStepMutation.mutateAsync({
                        stepId: currentStep.id,
                        data: {
                            ...data,
                            completed: true
                        }
                    });
                    // If this is the last step, submit the application
                    const applicationWithSteps = existingApplication;
                    if (step === applicationWithSteps.steps.length) {
                        submitApplicationMutation.mutate();
                    }
                    else {
                        // Move to next step
                        setStep(step + 1);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in onSubmitStep:', error);
            // Provide a user-friendly error message based on the error type
            let errorMessage = 'Failed to complete this step. Please try again.';
            const errorWithMessage = error;
            if (errorWithMessage.message?.includes('Authentication required')) {
                errorMessage = 'Please sign in to track your application progress.';
            }
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };
    // Render current step
    const renderStepContent = () => {
        if (isLoadingApplication) {
            return (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
        }
        switch (step) {
            case 1:
                return (_jsxs("form", { onSubmit: handleSubmit(onSubmitStep), children: [_jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx(Label, { htmlFor: "notes", children: "Application Notes" }), _jsx(Textarea, { id: "notes", placeholder: "Add any notes about this application", className: "mt-1", ...register('notes') })] }) }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Starting..."] })) : ('Start Application') })] })] }));
            case 2: // Resume selection
                return (_jsxs("form", { onSubmit: handleSubmit(onSubmitStep), children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "resumeId", children: "Select Resume" }), _jsxs("select", { id: "resumeId", className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", ...register('resumeId'), children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "1", children: "My General Resume" }), _jsx("option", { value: "2", children: "Software Engineer Resume" }), _jsx("option", { value: "3", children: "Product Management Resume" })] })] }), _jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "A resume is required for most applications, but you can skip this step if you're applying through the company website." })] })] }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setStep(1), children: "Previous" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Next') })] })] }));
            case 3: // Cover Letter
                return (_jsxs("form", { onSubmit: handleSubmit(onSubmitStep), children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "coverLetterId", children: "Select Cover Letter" }), _jsxs("select", { id: "coverLetterId", className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", ...register('coverLetterId'), children: [_jsx("option", { value: "", children: "None" }), _jsx("option", { value: "1", children: "General Cover Letter" }), _jsx("option", { value: "2", children: "Software Engineering Cover Letter" }), _jsx("option", { value: "3", children: "Product Management Cover Letter" })] })] }), _jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "You can skip this step if a cover letter is not required." })] })] }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setStep(2), children: "Previous" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Next') })] })] }));
            case 4: // Final Review
                return (_jsxs("form", { onSubmit: handleSubmit(onSubmitStep), children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm", children: "Job Details:" }), _jsxs("p", { className: "mt-1", children: [_jsx("span", { className: "font-semibold", children: jobDetails.title }), " at ", jobDetails.company] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm", children: "Status:" }), _jsx("p", { className: "mt-1", children: "In Progress" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm", children: "Mark as Applied:" }), _jsxs("div", { className: "flex items-center mt-2", children: [_jsx("input", { type: "checkbox", id: "applied", className: "mr-2", ...register('applied') }), _jsx(Label, { htmlFor: "applied", children: "I've submitted this application" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "submissionNotes", children: "Submission Notes" }), _jsx(Textarea, { id: "submissionNotes", placeholder: "Add any notes about your submission", className: "mt-1", ...register('submissionNotes') })] })] }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setStep(3), children: "Previous" }), _jsx(Button, { type: "submit", disabled: isSubmitting, onClick: () => {
                                        // Store the current form data with applied checkbox status in localStorage
                                        try {
                                            // Get form values including the applied checkbox status
                                            // We have to access the form values from the form object
                                            const formData = getValues();
                                            console.log('Storing application data before submission:', formData);
                                            localStorage.setItem(`application_${applicationId}_data`, JSON.stringify(formData));
                                        }
                                        catch (e) {
                                            console.error('Failed to store form data:', e);
                                        }
                                    }, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Completing..."] })) : ('Complete Application') })] })] }));
            default:
                return _jsx("div", { children: "Invalid step" });
        }
    };
    // Create a date for application date in correct format
    const formatDate = () => {
        const now = new Date();
        return now.toISOString();
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: step === 1 ? 'Start Application' : step === 4 ? 'Review Application' : `Application Step ${step}` }), _jsx(DialogDescription, { children: step === 1
                                ? `Track your application for ${jobDetails.title} at ${jobDetails.company}`
                                : step === 4
                                    ? 'Review and complete your application'
                                    : 'Complete each step to track your application progress' })] }), _jsx("div", { className: "py-4", children: renderStepContent() })] }) }));
}
