import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Search, Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { AchievementForm } from '@/components/achievement/AchievementForm';
import PersonalAchievementCard from '@/components/achievement/PersonalAchievementCard';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
export default function Achievements() {
    const { user } = useUser();
    const { toast } = useToast();
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    // Fetch personal achievements
    const { data: personalAchievements, isLoading } = useQuery({
        queryKey: ['/api/personal-achievements'],
    });
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiRequest("DELETE", `/api/personal-achievements/${id}`);
            return await res.json();
        },
        onSuccess: () => {
            // Refresh achievements list
            queryClient.invalidateQueries({ queryKey: ['/api/personal-achievements'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: "Achievement deleted",
                description: "Your achievement has been deleted successfully.",
            });
        },
        onError: (error) => {
            console.error("Error deleting achievement:", error);
            toast({
                title: "Error",
                description: "Failed to delete the achievement. Please try again.",
                variant: "destructive",
            });
        },
    });
    // Handle category filter
    const filteredAchievements = React.useMemo(() => {
        if (!personalAchievements || !Array.isArray(personalAchievements))
            return [];
        return personalAchievements.filter((achievement) => {
            // Apply category filter
            if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
                return false;
            }
            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (achievement.title.toLowerCase().includes(query) ||
                    (achievement.description && achievement.description.toLowerCase().includes(query)) ||
                    (achievement.issuingOrganization && achievement.issuingOrganization.toLowerCase().includes(query)) ||
                    (achievement.skills && achievement.skills.toLowerCase().includes(query)));
            }
            return true;
        });
    }, [personalAchievements, categoryFilter, searchQuery]);
    // Handle achievement deletion with confirmation
    const handleDeleteClick = (id) => {
        deleteMutation.mutate(id);
    };
    // Refs for dialog close buttons
    const addDialogCloseRef = useRef(null);
    const emptyStateDialogCloseRef = useRef(null);
    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    // Handle achievement edit
    const handleEditClick = (achievement) => {
        setSelectedAchievement(achievement);
        setEditDialogOpen(true);
    };
    return (_jsxs("div", { className: "container mx-auto", children: [_jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold font-poppins", children: "Achievements" }), _jsx("p", { className: "text-neutral-500", children: "Track your career milestones and progress" })] }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Personal Achievements" }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add Achievement"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Personal Achievement" }), _jsx(DialogDescription, { children: "Add details about your achievement to showcase your professional growth." })] }), _jsx(AchievementForm, { closeDialog: () => {
                                                    const closeButton = document.querySelector('[data-state="open"]');
                                                    if (closeButton)
                                                        closeButton.click();
                                                } })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx("div", { className: "md:col-span-1", children: _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Filter by Category" }), _jsxs(Select, { value: categoryFilter, onValueChange: setCategoryFilter, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "All Categories" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Categories" }), _jsx(SelectItem, { value: "professional", children: "Professional" }), _jsx(SelectItem, { value: "academic", children: "Academic" }), _jsx(SelectItem, { value: "personal", children: "Personal" }), _jsx(SelectItem, { value: "certification", children: "Certification" }), _jsx(SelectItem, { value: "award", children: "Award" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Search Achievements" }), _jsxs("div", { className: "relative mt-1", children: [_jsx(Input, { placeholder: "Search...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-9" }), _jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" })] })] }), personalAchievements && Array.isArray(personalAchievements) && personalAchievements.length > 0 && (_jsxs("div", { className: "pt-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Total Achievements" }), _jsx("span", { className: "text-sm font-semibold", children: personalAchievements.length })] }), _jsxs("div", { className: "pt-3", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-neutral-500", children: "Professional" }), _jsx("span", { children: personalAchievements.filter((a) => a.category === 'professional').length })] }), _jsxs("div", { className: "flex justify-between text-sm mt-1", children: [_jsx("span", { className: "text-neutral-500", children: "Academic" }), _jsx("span", { children: personalAchievements.filter((a) => a.category === 'academic').length })] }), _jsxs("div", { className: "flex justify-between text-sm mt-1", children: [_jsx("span", { className: "text-neutral-500", children: "Personal" }), _jsx("span", { children: personalAchievements.filter((a) => a.category === 'personal').length })] })] })] }))] }) }) }) }), _jsx("div", { className: "md:col-span-3", children: isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : filteredAchievements.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredAchievements.map((achievement) => (_jsx(PersonalAchievementCard, { achievement: achievement, onEdit: handleEditClick, onDelete: handleDeleteClick }, achievement.id))) })) : (_jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow-sm", children: [_jsx(Award, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Personal Achievements Found" }), _jsx("p", { className: "text-neutral-500 mb-6", children: searchQuery || categoryFilter !== 'all'
                                                        ? "Try adjusting your filters or search terms"
                                                        : "Add your first achievement to track your career milestones" }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " Add Your First Achievement"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[650px] md:max-w-[700px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Personal Achievement" }), _jsx(DialogDescription, { children: "Add details about your achievement to showcase your professional growth." })] }), _jsx(AchievementForm, { closeDialog: () => {
                                                                        const closeButton = document.querySelector('[data-state="open"]');
                                                                        if (closeButton)
                                                                            closeButton.click();
                                                                    } })] })] })] })) })] }), _jsx(Dialog, { open: editDialogOpen, onOpenChange: setEditDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[650px] md:max-w-[700px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Personal Achievement" }), _jsx(DialogDescription, { children: "Update the details of your achievement." })] }), selectedAchievement && (_jsx(AchievementForm, { achievementId: selectedAchievement.id, defaultValues: selectedAchievement, closeDialog: () => setEditDialogOpen(false) }))] }) })] })] })] }));
}
