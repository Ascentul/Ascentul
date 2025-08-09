import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderGit2, Calendar, Edit, Trash2, Link as LinkIcon, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ProjectForm from '@/components/ProjectForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';
export default function Projects() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    // Animation variants - optimized for performance
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
    };
    const subtleUp = {
        hidden: { opacity: 0, y: 8 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };
    const cardAnimation = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };
    const staggeredContainer = {
        hidden: { opacity: 1 }, // Start with opacity 1 for container to reduce unnecessary repaints
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05, // Stagger children animations
                delayChildren: 0.1 // Small delay before starting animations
            }
        }
    };
    const { data: projects = [], isLoading, refetch } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await fetch('/api/projects');
            if (!response.ok)
                throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data;
        },
    });
    // Sort projects based on start date
    const sortedProjects = [...projects].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    const deleteProjectMutation = useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (!response.ok)
                throw new Error('Failed to delete project');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast({
                title: 'Project Deleted',
                description: 'The project has been deleted successfully',
            });
        },
    });
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this project?')) {
            deleteProjectMutation.mutate(id);
        }
    };
    const handleEdit = (project) => {
        setEditingProject(project);
        setIsDialogOpen(true);
    };
    const handleAddNew = () => {
        setEditingProject(null);
        setIsDialogOpen(true);
    };
    const toggleDescriptionExpand = (projectId) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };
    const formatDateRange = (startDate, endDate) => {
        try {
            const start = new Date(startDate);
            const startMonth = format(start, 'MMMM yyyy');
            if (!endDate)
                return `${startMonth} - Present`;
            const end = new Date(endDate);
            const endMonth = format(end, 'MMMM yyyy');
            // If same month and year, just display once
            if (format(start, 'MMMM yyyy') === format(end, 'MMMM yyyy')) {
                return startMonth;
            }
            return `${startMonth} - ${endMonth}`;
        }
        catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    };
    const getBadgeVariant = (projectType) => {
        const type = projectType.toLowerCase();
        switch (type) {
            case 'personal':
                return 'secondary';
            case 'professional':
                return 'default';
            default:
                return 'outline';
        }
    };
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", variants: subtleUp, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Project Portfolio" }), _jsx("p", { className: "text-neutral-500", children: "Showcase your professional and personal projects" })] }), _jsxs("div", { className: "flex items-center gap-3 mt-4 md:mt-0", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "flex items-center gap-1", children: ["Sort: ", sortOrder === 'newest' ? 'Newest First' : 'Oldest First', _jsx(ChevronDown, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onClick: () => setSortOrder('newest'), children: "Newest First" }), _jsx(DropdownMenuItem, { onClick: () => setSortOrder('oldest'), children: "Oldest First" })] })] }), _jsxs(Button, { onClick: handleAddNew, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Project"] })] })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : sortedProjects && sortedProjects.length > 0 ? (_jsx(motion.div, { className: "projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: sortedProjects.map((project, i) => (_jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsxs(Card, { className: "flex flex-col overflow-hidden group project-card cursor-pointer transition-shadow duration-300", children: [_jsxs("div", { className: "relative w-full h-[200px]", children: [project.imageUrl ? (_jsx("img", { src: project.imageUrl, alt: project.title, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full bg-[#f4f4f4] border-b border-[#eaeaea] flex flex-col items-center justify-center", children: [_jsx(Image, { className: "h-16 w-16 text-gray-200" }), _jsx("p", { className: "text-xs text-[#888] mt-2", children: "No image uploaded yet" })] })), _jsxs("div", { className: "flex space-x-1 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-white/90 shadow-sm backdrop-blur-sm", onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleEdit(project);
                                                }, children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 bg-white/90 shadow-sm backdrop-blur-sm", onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDelete(project.id);
                                                }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "flex-1 p-5", children: [_jsx("h2", { className: "text-xl font-semibold mb-2 line-clamp-1", children: project.title }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-3", children: [_jsx(Badge, { variant: getBadgeVariant(project.projectType), children: capitalizeFirstLetter(project.projectType) }), _jsxs("div", { className: "text-sm text-neutral-500 flex items-center", children: [_jsx(Calendar, { className: "h-3.5 w-3.5 mr-1 flex-shrink-0" }), _jsx("span", { children: formatDateRange(typeof project.startDate === 'string' ? project.startDate : project.startDate.toString(), project.endDate ? (typeof project.endDate === 'string' ? project.endDate : project.endDate.toString()) : null) })] })] }), project.clientOrCompany && (_jsxs("div", { className: "text-primary font-medium text-sm mb-3", children: [project.clientOrCompany, project.projectUrl && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("a", { href: project.projectUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center text-neutral-500 hover:text-primary", onClick: (e) => e.stopPropagation(), children: [_jsx(LinkIcon, { className: "h-3.5 w-3.5 mr-1" }), "View Project"] })] }))] })), project.description && (_jsx("div", { className: "mb-4", children: project.description.length > 160 ? (_jsxs(_Fragment, { children: [_jsx("p", { className: `project-description text-neutral-700 text-sm leading-relaxed ${!expandedDescriptions[project.id] ? 'line-clamp-3' : ''}`, style: { maxHeight: expandedDescriptions[project.id] ? '1000px' : '4.5rem' }, children: project.description }), _jsx(Button, { variant: "link", className: "px-0 h-auto text-xs font-medium text-primary mt-1", onClick: (e) => {
                                                        e.stopPropagation();
                                                        toggleDescriptionExpand(project.id);
                                                    }, children: expandedDescriptions[project.id] ? (_jsxs("span", { className: "flex items-center", children: ["Show less ", _jsx(ChevronUp, { className: "ml-1 h-3 w-3" })] })) : (_jsxs("span", { className: "flex items-center", children: ["Read more ", _jsx(ChevronDown, { className: "ml-1 h-3 w-3" })] })) })] })) : (_jsx("p", { className: "text-neutral-700 text-sm leading-relaxed", children: project.description })) })), project.skillsUsed && project.skillsUsed.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1.5 mt-auto", children: [project.skillsUsed.slice(0, 3).map((skill, index) => (_jsx(Badge, { variant: "secondary", className: "text-xs px-2 py-0", children: skill }, index))), project.skillsUsed.length > 3 && (_jsxs(Badge, { variant: "outline", className: "text-xs px-2 py-0", children: ["+", project.skillsUsed.length - 3, " more"] }))] }))] })] }) }, project.id))) })) : (_jsxs("div", { className: "text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-100", children: [_jsx("div", { className: "bg-[#f4f4f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(FolderGit2, { className: "h-10 w-10 text-primary/60" }) }), _jsx("h3", { className: "text-2xl font-medium mb-3", children: "You haven't added any projects yet" }), _jsx("p", { className: "text-neutral-500 mb-6 max-w-md mx-auto", children: "Click below to get started showcasing your professional work, personal projects, and achievements!" }), _jsxs(Button, { onClick: handleAddNew, size: "lg", className: "shadow-sm hover:shadow-lg transition-all", children: [_jsx(Plus, { className: "mr-2 h-5 w-5" }), "Add First Project"] })] })), _jsx(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingProject ? 'Edit Project' : 'Add Project' }) }), _jsx(ProjectForm, { initialData: editingProject || undefined, onSubmit: async (data) => {
                                try {
                                    const response = await fetch(editingProject ? `/api/projects/${editingProject.id}` : '/api/projects', {
                                        method: editingProject ? 'PUT' : 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(data),
                                    });
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Failed to save project');
                                    }
                                    const result = await response.json();
                                    await queryClient.invalidateQueries({ queryKey: ['projects'] });
                                    await refetch();
                                    setIsDialogOpen(false);
                                    toast({
                                        title: `Project ${editingProject ? 'Updated' : 'Added'}`,
                                        description: `Your project has been ${editingProject ? 'updated' : 'added'} successfully`,
                                    });
                                }
                                catch (error) {
                                    const errorMessage = error instanceof Error
                                        ? error.message
                                        : 'Unknown error occurred';
                                    toast({
                                        title: 'Error',
                                        description: `Failed to ${editingProject ? 'update' : 'add'} project: ${errorMessage}`,
                                        variant: 'destructive',
                                    });
                                }
                            } })] }) })] }));
}
