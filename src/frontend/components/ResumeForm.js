import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, FileText } from 'lucide-react';
import { CareerDataImport } from '@/components/CareerDataImport';
const resumeSchema = z.object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
    template: z.string().default('standard'),
    content: z.object({
        personalInfo: z.object({
            fullName: z.string().min(1, { message: 'Full name is required' }),
            email: z.string().email({ message: 'Please enter a valid email' }),
            phone: z.string().optional(),
            location: z.string().optional(),
            linkedIn: z.string().optional(),
            portfolio: z.string().optional(),
        }),
        summary: z.string().optional(),
        skills: z.array(z.string()).default([]),
        experience: z.array(z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            currentJob: z.boolean().default(false),
            description: z.string().optional(),
        })).default([]),
        education: z.array(z.object({
            institution: z.string(),
            degree: z.string(),
            field: z.string().optional(),
            startDate: z.string(),
            endDate: z.string().optional(),
            description: z.string().optional(),
        })).default([]),
        projects: z.array(z.object({
            name: z.string(),
            description: z.string().optional(),
            url: z.string().optional(),
            technologies: z.array(z.string()).default([]),
        })).default([]),
        certifications: z.array(z.object({
            name: z.string(),
            issuer: z.string(),
            date: z.string(),
            url: z.string().optional(),
        })).default([]),
    }).default({
        personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedIn: '',
            portfolio: '',
        },
        summary: '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
    }),
});
export default function ResumeForm({ resume, onSuccess }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const defaultValues = {
        name: resume?.name || '',
        template: resume?.template || 'standard',
        content: resume?.content || {
            personalInfo: {
                fullName: '',
                email: '',
                phone: '',
                location: '',
                linkedIn: '',
                portfolio: '',
            },
            summary: '',
            skills: [],
            experience: [],
            education: [],
            projects: [],
            certifications: [],
        },
    };
    const form = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues,
    });
    const createResumeMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('POST', '/api/resumes', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            toast({
                title: 'Resume Created',
                description: 'Your resume has been created successfully',
            });
            if (onSuccess)
                onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to create resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const updateResumeMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('PUT', `/api/resumes/${resume?.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            toast({
                title: 'Resume Updated',
                description: 'Your resume has been updated successfully',
            });
            if (onSuccess)
                onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update resume: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (resume?.id) {
                // Update existing resume with the current form data
                await updateResumeMutation.mutateAsync(data);
            }
            else {
                // Create new resume with form data
                await createResumeMutation.mutateAsync(data);
            }
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "There was a problem with your resume",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const addSkill = () => {
        if (skillInput.trim() === '')
            return;
        const currentSkills = form.getValues('content.skills') || [];
        if (!currentSkills.includes(skillInput.trim())) {
            form.setValue('content.skills', [...currentSkills, skillInput.trim()]);
        }
        setSkillInput('');
    };
    const removeSkill = (skill) => {
        const currentSkills = form.getValues('content.skills') || [];
        form.setValue('content.skills', currentSkills.filter((s) => s !== skill));
    };
    const addExperience = () => {
        const currentExperience = form.getValues('content.experience') || [];
        form.setValue('content.experience', [
            ...currentExperience,
            {
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                currentJob: false,
                description: '',
            },
        ]);
    };
    const removeExperience = (index) => {
        const currentExperience = form.getValues('content.experience') || [];
        form.setValue('content.experience', currentExperience.filter((_, i) => i !== index));
    };
    const addEducation = () => {
        const currentEducation = form.getValues('content.education') || [];
        form.setValue('content.education', [
            ...currentEducation,
            {
                institution: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: '',
                description: '',
            },
        ]);
    };
    const removeEducation = (index) => {
        const currentEducation = form.getValues('content.education') || [];
        form.setValue('content.education', currentEducation.filter((_, i) => i !== index));
    };
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Resume Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Software Developer Resume", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "template", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Template" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select template" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "standard", children: "Standard" }), _jsx(SelectItem, { value: "modern", children: "Modern" }), _jsx(SelectItem, { value: "creative", children: "Creative" }), _jsx(SelectItem, { value: "minimalist", children: "Minimalist" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx("div", { className: "mb-4", children: _jsx(CareerDataImport, { form: form }) }), _jsxs(Tabs, { defaultValue: "personal", children: [_jsxs(TabsList, { className: "grid grid-cols-3 md:grid-cols-6", children: [_jsx(TabsTrigger, { value: "personal", children: "Personal" }), _jsx(TabsTrigger, { value: "summary", children: "Summary" }), _jsx(TabsTrigger, { value: "skills", children: "Skills" }), _jsx(TabsTrigger, { value: "experience", children: "Experience" }), _jsx(TabsTrigger, { value: "education", children: "Education" }), _jsx(TabsTrigger, { value: "projects", children: "Projects" })] }), _jsx(TabsContent, { value: "personal", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx(FormField, { control: form.control, name: "content.personalInfo.fullName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Doe", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.personalInfo.email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "john.doe@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "content.personalInfo.phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Phone" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "(123) 456-7890", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.personalInfo.location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "City, State", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "content.personalInfo.linkedIn", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "LinkedIn" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "linkedin.com/in/johndoe", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.personalInfo.portfolio", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Portfolio Website" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "johndoe.com", ...field }) }), _jsx(FormMessage, {})] })) })] })] }) }) }), _jsx(TabsContent, { value: "summary", children: _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(FormField, { control: form.control, name: "content.summary", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Professional Summary" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Briefly describe your professional background and strengths...", className: "min-h-[150px]", ...field }) }), _jsx(FormMessage, {})] })) }) }) }) }), _jsx(TabsContent, { value: "skills", children: _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx(FormLabel, { children: "Skills" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Add a skill (e.g., JavaScript)", value: skillInput, onChange: (e) => setSkillInput(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                addSkill();
                                                            }
                                                        } }), _jsx(Button, { type: "button", onClick: addSkill, children: "Add" })] }), _jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: form.watch('content.skills').map((skill, index) => (_jsxs("div", { className: "flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full", children: [_jsx("span", { children: skill }), _jsx("button", { type: "button", onClick: () => removeSkill(skill), className: "text-primary/70 hover:text-primary", children: _jsx(MinusCircle, { className: "h-4 w-4" }) })] }, index))) })] }) }) }) }), _jsx(TabsContent, { value: "experience", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx(FormLabel, { className: "text-base", children: "Work Experience" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addExperience, children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Experience"] })] }), form.watch('content.experience').length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-neutral-300 mb-2" }), _jsx("p", { className: "text-neutral-500", children: "No work experience added yet" }), _jsx(Button, { variant: "link", className: "mt-2", onClick: addExperience, children: "Add Experience" })] })) : (_jsx("div", { className: "space-y-6", children: form.watch('content.experience').map((_, index) => (_jsxs("div", { className: "border p-4 rounded-lg relative", children: [_jsx(Button, { type: "button", variant: "destructive", size: "icon", className: "absolute top-2 right-2 h-6 w-6", onClick: () => removeExperience(index), children: _jsx(MinusCircle, { className: "h-4 w-4" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsx(FormField, { control: form.control, name: `content.experience.${index}.company`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Company Name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.experience.${index}.position`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Position" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Job Title", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsx(FormField, { control: form.control, name: `content.experience.${index}.startDate`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "MM/YYYY", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.experience.${index}.endDate`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "MM/YYYY or Present", ...field, disabled: form.watch(`content.experience.${index}.currentJob`) }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: `content.experience.${index}.currentJob`, render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0 mb-4", children: [_jsx(FormControl, { children: _jsx("input", { type: "checkbox", checked: field.value, onChange: field.onChange, className: "form-checkbox h-4 w-4 text-primary rounded focus:ring-primary" }) }), _jsx(FormLabel, { className: "font-normal", children: "This is my current job" })] })) }), _jsx(FormField, { control: form.control, name: `content.experience.${index}.description`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your responsibilities and achievements...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) })] }, index))) }))] }) }) }), _jsx(TabsContent, { value: "education", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx(FormLabel, { className: "text-base", children: "Education" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addEducation, children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Education"] })] }), form.watch('content.education').length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-neutral-300 mb-2" }), _jsx("p", { className: "text-neutral-500", children: "No education added yet" }), _jsx(Button, { variant: "link", className: "mt-2", onClick: addEducation, children: "Add Education" })] })) : (_jsx("div", { className: "space-y-6", children: form.watch('content.education').map((_, index) => (_jsxs("div", { className: "border p-4 rounded-lg relative", children: [_jsx(Button, { type: "button", variant: "destructive", size: "icon", className: "absolute top-2 right-2 h-6 w-6", onClick: () => removeEducation(index), children: _jsx(MinusCircle, { className: "h-4 w-4" }) }), _jsx(FormField, { control: form.control, name: `content.education.${index}.institution`, render: ({ field }) => (_jsxs(FormItem, { className: "mb-4", children: [_jsx(FormLabel, { children: "Institution" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "University or School Name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsx(FormField, { control: form.control, name: `content.education.${index}.degree`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Degree" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Bachelor's, Master's, etc.", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.education.${index}.field`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Field of Study" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Computer Science, Business, etc.", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsx(FormField, { control: form.control, name: `content.education.${index}.startDate`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "MM/YYYY", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.education.${index}.endDate`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "MM/YYYY or Expected Graduation", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: `content.education.${index}.description`, render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Relevant courses, honors, activities...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) })] }, index))) }))] }) }) }), _jsx(TabsContent, { value: "projects", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx(FormLabel, { className: "text-base", children: "Projects" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => {
                                                        const currentProjects = form.getValues('content.projects') || [];
                                                        form.setValue('content.projects', [
                                                            ...currentProjects,
                                                            {
                                                                name: '',
                                                                description: '',
                                                                url: '',
                                                                technologies: [],
                                                            },
                                                        ]);
                                                    }, children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Project"] })] }), form.watch('content.projects').length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-neutral-300 mb-2" }), _jsx("p", { className: "text-neutral-500", children: "No projects added yet" }), _jsx(Button, { variant: "link", className: "mt-2", onClick: () => {
                                                        const currentProjects = form.getValues('content.projects') || [];
                                                        form.setValue('content.projects', [
                                                            ...currentProjects,
                                                            {
                                                                name: '',
                                                                description: '',
                                                                url: '',
                                                                technologies: [],
                                                            },
                                                        ]);
                                                    }, children: "Add Project" })] })) : (_jsx("div", { className: "space-y-6", children: form.watch('content.projects').map((_, index) => (_jsxs("div", { className: "border p-4 rounded-lg relative", children: [_jsx(Button, { type: "button", variant: "destructive", size: "icon", className: "absolute top-2 right-2 h-6 w-6", onClick: () => {
                                                            const currentProjects = form.getValues('content.projects') || [];
                                                            form.setValue('content.projects', currentProjects.filter((_, i) => i !== index));
                                                        }, children: _jsx(MinusCircle, { className: "h-4 w-4" }) }), _jsx(FormField, { control: form.control, name: `content.projects.${index}.name`, render: ({ field }) => (_jsxs(FormItem, { className: "mb-4", children: [_jsx(FormLabel, { children: "Project Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Project Name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.projects.${index}.url`, render: ({ field }) => (_jsxs(FormItem, { className: "mb-4", children: [_jsx(FormLabel, { children: "Project URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: `content.projects.${index}.description`, render: ({ field }) => (_jsxs(FormItem, { className: "mb-4", children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe the project, your role, and outcomes...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) })] }, index))) }))] }) }) })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Saving...' : resume?.id ? 'Update Resume' : 'Create Resume' }) })] }) }));
}
