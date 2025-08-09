import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Save, Target, Wand2, } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CareerPathExplorer } from '@/components/career-path/CareerPathExplorer';
// Define validation schemas for each step
const stepOneSchema = z.object({
    currentJobTitle: z.string().min(1, 'Current job title is required'),
    yearsOfExperience: z.string().min(1, 'Years of experience is required'),
});
const stepTwoSchema = z.object({
    workHistory: z.array(z.object({
        id: z.number().optional(),
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
        currentJob: z.boolean().optional(),
        description: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        achievements: z.array(z.string()).nullable().optional(),
    })),
});
const stepThreeSchema = z.object({
    desiredRole: z.string().optional(),
    desiredField: z.string().optional(),
    desiredTimeframe: z.string().optional(),
    additionalInfo: z.string().optional(),
});
// Combine all steps into one schema for final submission
const formSchema = stepOneSchema.merge(stepTwoSchema).merge(stepThreeSchema);
// Component for work history item in step 2
const WorkHistoryItem = ({ item, index, onChange, onRemove }) => {
    return (_jsx(Card, { className: "mb-4", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company" }), _jsx(FormControl, { children: _jsx(Input, { value: item.company, onChange: (e) => onChange(index, 'company', e.target.value) }) })] }), _jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Position" }), _jsx(FormControl, { children: _jsx(Input, { value: item.position, onChange: (e) => onChange(index, 'position', e.target.value) }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", value: item.startDate, onChange: (e) => onChange(index, 'startDate', e.target.value) }) })] }), _jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "date", value: item.endDate || '', disabled: item.currentJob, onChange: (e) => onChange(index, 'endDate', e.target.value) }), _jsxs("div", { className: "flex items-center gap-1 ml-2", children: [_jsx("input", { type: "checkbox", id: `currentJob-${index}`, checked: item.currentJob, onChange: (e) => {
                                                            onChange(index, 'currentJob', e.target.checked);
                                                            if (e.target.checked) {
                                                                onChange(index, 'endDate', null);
                                                            }
                                                        } }), _jsx("label", { htmlFor: `currentJob-${index}`, className: "text-sm", children: "Current job" })] })] }) })] })] }), _jsx("div", { className: "mb-4", children: _jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { value: item.description || '', onChange: (e) => onChange(index, 'description', e.target.value), placeholder: "Describe your responsibilities and achievements" }) })] }) }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => onRemove(index), children: "Remove" }) })] }) }));
};
export const BuildMyPathWizard = ({ onClose }) => {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [generatedPath, setGeneratedPath] = useState(null);
    const [savedPathName, setSavedPathName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // Forms for each step
    const stepOneForm = useForm({
        resolver: zodResolver(stepOneSchema),
        defaultValues: {
            currentJobTitle: '',
            yearsOfExperience: '',
        },
    });
    const stepTwoForm = useForm({
        resolver: zodResolver(stepTwoSchema),
        defaultValues: {
            workHistory: [],
        },
    });
    const stepThreeForm = useForm({
        resolver: zodResolver(stepThreeSchema),
        defaultValues: {
            desiredRole: '',
            desiredField: '',
            desiredTimeframe: '',
            additionalInfo: '',
        },
    });
    // Fetch work history data
    const { data: workHistoryData, isLoading: isLoadingWorkHistory } = useQuery({
        queryKey: ['/api/work-history'],
        onSuccess: (data) => {
            // Format dates for form consumption
            const formattedData = data.map((item) => ({
                ...item,
                startDate: new Date(item.startDate).toISOString().split('T')[0],
                endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : null,
            }));
            stepTwoForm.setValue('workHistory', formattedData);
        },
    });
    // Mutation to generate career path
    const generatePathMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest('POST', '/api/career-path/generate', data);
            return response.json();
        },
        onSuccess: (data) => {
            setGeneratedPath(data);
            setCurrentStep(3); // Move to results step
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to generate career path: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Mutation to save career path
    const savePathMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest('POST', '/api/career-path/save', data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Career path saved successfully',
            });
            setIsSaving(false);
            // Invalidate queries to refresh saved paths
            queryClient.invalidateQueries({ queryKey: ['/api/career-path/saved'] });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to save career path: ${error.message}`,
                variant: 'destructive',
            });
            setIsSaving(false);
        },
    });
    // Handle adding new work history item
    const handleAddWorkHistory = () => {
        const currentWorkHistory = stepTwoForm.getValues('workHistory') || [];
        stepTwoForm.setValue('workHistory', [
            ...currentWorkHistory,
            {
                company: '',
                position: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: null,
                currentJob: false,
                description: '',
            },
        ]);
    };
    // Handle work history item change
    const handleWorkHistoryChange = (index, field, value) => {
        const currentWorkHistory = [...stepTwoForm.getValues('workHistory')];
        currentWorkHistory[index] = {
            ...currentWorkHistory[index],
            [field]: value,
        };
        stepTwoForm.setValue('workHistory', currentWorkHistory);
    };
    // Handle removing work history item
    const handleRemoveWorkHistory = (index) => {
        const currentWorkHistory = [...stepTwoForm.getValues('workHistory')];
        currentWorkHistory.splice(index, 1);
        stepTwoForm.setValue('workHistory', currentWorkHistory);
    };
    // Handle saving generated path
    const handleSavePath = () => {
        if (!savedPathName.trim()) {
            toast({
                title: 'Name Required',
                description: 'Please provide a name for your career path',
                variant: 'destructive',
            });
            return;
        }
        setIsSaving(true);
        savePathMutation.mutate({
            name: savedPathName,
            pathData: generatedPath,
        });
    };
    // Handle form submission for each step
    const handleStepSubmit = async (step) => {
        try {
            if (step === 0) {
                await stepOneForm.trigger();
                if (stepOneForm.formState.isValid) {
                    setCurrentStep(1);
                }
            }
            else if (step === 1) {
                await stepTwoForm.trigger();
                if (stepTwoForm.formState.isValid) {
                    setCurrentStep(2);
                }
            }
            else if (step === 2) {
                await stepThreeForm.trigger();
                if (stepThreeForm.formState.isValid) {
                    // Combine all form data and generate path
                    const combinedData = {
                        ...stepOneForm.getValues(),
                        ...stepTwoForm.getValues(),
                        ...stepThreeForm.getValues(),
                    };
                    generatePathMutation.mutate(combinedData);
                }
            }
        }
        catch (error) {
            console.error('Form validation error:', error);
        }
    };
    // Handle going back a step
    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    // Define steps content
    const steps = [
        {
            title: 'Current Role',
            icon: _jsx(BriefcaseBusiness, { className: "h-5 w-5" }),
            description: 'Confirm your current role and experience',
            content: (_jsx(Form, { ...stepOneForm, children: _jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "space-y-6", children: [_jsx(FormField, { control: stepOneForm.control, name: "currentJobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Current Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Senior Software Engineer", ...field }) }), _jsx(FormDescription, { children: "Enter your current job title or role" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: stepOneForm.control, name: "yearsOfExperience", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Years of Experience" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select years of experience" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "0-1", children: "Less than 1 year" }), _jsx(SelectItem, { value: "1-3", children: "1-3 years" }), _jsx(SelectItem, { value: "3-5", children: "3-5 years" }), _jsx(SelectItem, { value: "5-10", children: "5-10 years" }), _jsx(SelectItem, { value: "10+", children: "10+ years" })] })] }), _jsx(FormDescription, { children: "Select your total professional experience" }), _jsx(FormMessage, {})] })) })] }) })),
        },
        {
            title: 'Work History',
            icon: _jsx(FileSpreadsheet, { className: "h-5 w-5" }),
            description: 'Review and edit your work history',
            content: (_jsx(Form, { ...stepTwoForm, children: _jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium", children: "Your Work History" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Confirm or update your work experience" })] }), _jsx(Button, { type: "button", onClick: handleAddWorkHistory, size: "sm", variant: "outline", children: "Add Experience" })] }), isLoadingWorkHistory ? (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) })) : (_jsx(_Fragment, { children: stepTwoForm.getValues('workHistory')?.length === 0 ? (_jsxs("div", { className: "text-center py-8 border rounded-md border-dashed", children: [_jsx("p", { className: "text-muted-foreground", children: "No work history found" }), _jsx(Button, { type: "button", onClick: handleAddWorkHistory, variant: "outline", className: "mt-4", children: "Add Your First Experience" })] })) : (_jsx("div", { className: "space-y-4", children: stepTwoForm.getValues('workHistory')?.map((item, index) => (_jsx(WorkHistoryItem, { item: item, index: index, onChange: handleWorkHistoryChange, onRemove: handleRemoveWorkHistory }, index))) })) }))] }) })),
        },
        {
            title: 'Career Goals',
            icon: _jsx(Target, { className: "h-5 w-5" }),
            description: 'What are your career aspirations?',
            content: (_jsx(Form, { ...stepThreeForm, children: _jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "space-y-6", children: [_jsx(FormField, { control: stepThreeForm.control, name: "desiredRole", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Desired Role (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Chief Technology Officer", ...field, value: field.value || '' }) }), _jsx(FormDescription, { children: "Enter a specific role you're aiming for" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: stepThreeForm.control, name: "desiredField", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Desired Field/Industry (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Artificial Intelligence, Healthcare", ...field, value: field.value || '' }) }), _jsx(FormDescription, { children: "If you're considering a career change, enter the field" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: stepThreeForm.control, name: "desiredTimeframe", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Timeframe (Optional)" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value || '', children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select your timeframe" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1-2", children: "1-2 years" }), _jsx(SelectItem, { value: "3-5", children: "3-5 years" }), _jsx(SelectItem, { value: "5-10", children: "5-10 years" }), _jsx(SelectItem, { value: "10+", children: "10+ years" })] })] }), _jsx(FormDescription, { children: "How quickly do you want to achieve your goal?" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: stepThreeForm.control, name: "additionalInfo", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Additional Information (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Any other details about your career goals or constraints", className: "min-h-[100px]", ...field, value: field.value || '' }) }), _jsx(FormDescription, { children: "Add any other relevant information that might help generate a better path" }), _jsx(FormMessage, {})] })) })] }) })),
        },
        {
            title: 'Results',
            icon: _jsx(Wand2, { className: "h-5 w-5" }),
            description: 'Your personalized career path',
            content: (_jsx("div", { className: "space-y-6", children: generatePathMutation.isPending ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Loader2, { className: "h-12 w-12 animate-spin text-primary mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "Generating Your Career Path" }), _jsx("p", { className: "text-muted-foreground text-center max-w-md", children: "We're creating a personalized career roadmap based on your work history and goals. This may take a minute..." })] })) : generatedPath ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold mb-2", children: "Your Personalized Career Path" }), _jsx("p", { className: "text-muted-foreground", children: "Based on your work history and career goals, here are recommended paths:" })] }), _jsx("div", { className: "border rounded-lg p-4 bg-slate-50", children: _jsx(CareerPathExplorer, { pathData: generatedPath }) }), _jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("h4", { className: "font-medium mb-3", children: "Save This Career Path" }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Input, { placeholder: "Enter a name for this career path", value: savedPathName, onChange: (e) => setSavedPathName(e.target.value), className: "max-w-md" }), _jsx(Button, { onClick: handleSavePath, disabled: isSaving, children: isSaving ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Path"] })) })] })] })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-muted-foreground", children: "No results available yet." }), _jsx(Button, { onClick: () => setCurrentStep(0), variant: "outline", className: "mt-4", children: "Start Over" })] })) })),
        },
    ];
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "flex justify-between", children: steps.map((step, index) => (_jsxs("div", { className: `flex flex-col items-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`, style: { width: `${100 / steps.length}%` }, children: [_jsx("div", { className: `h-10 w-10 rounded-full flex items-center justify-center mb-2 ${index <= currentStep
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'}`, children: index < currentStep ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) })) : (steps[index].icon) }), _jsx("div", { className: "text-sm font-medium", children: step.title })] }, index))) }), _jsxs("div", { className: "relative mt-3", children: [_jsx("div", { className: "absolute left-0 top-1/2 h-px w-full bg-muted -translate-y-1/2" }), _jsx("div", { className: "absolute left-0 top-1/2 h-px bg-primary -translate-y-1/2 transition-all duration-300", style: {
                                    width: `${(currentStep / (steps.length - 1)) * 100}%`,
                                } })] })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-semibold mb-1", children: steps[currentStep].title }), _jsx("p", { className: "text-muted-foreground mb-6", children: steps[currentStep].description }), _jsx("div", { children: steps[currentStep].content })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: currentStep === 0 && onClose ? onClose : handlePrevStep, disabled: generatePathMutation.isPending, children: currentStep === 0 ? 'Cancel' : (_jsxs(_Fragment, { children: [_jsx(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"] })) }), currentStep < 3 ? (_jsx(Button, { onClick: () => handleStepSubmit(currentStep), disabled: generatePathMutation.isPending, children: currentStep === 2 ? (_jsxs(_Fragment, { children: ["Generate Path", _jsx(Wand2, { className: "ml-2 h-4 w-4" })] })) : (_jsxs(_Fragment, { children: ["Continue", _jsx(ChevronRight, { className: "ml-2 h-4 w-4" })] })) })) : (_jsx(Button, { onClick: onClose, children: "Close" }))] })] }));
};
