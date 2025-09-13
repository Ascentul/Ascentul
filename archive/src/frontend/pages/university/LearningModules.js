import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, Clock, GraduationCap, Search, Star, StarHalf, Filter, Users, BookText, PlayCircle, FileText, ClipboardEdit, CheckCircle, Video, PanelLeft, Sparkles, Bookmark, ChevronRight } from "lucide-react";
// Categories UI
const categories = [
    {
        id: "all",
        label: "All Categories",
        icon: _jsx(BookOpen, { className: "h-4 w-4" })
    },
    {
        id: "career",
        label: "Career Development",
        icon: _jsx(GraduationCap, { className: "h-4 w-4" })
    },
    {
        id: "interview",
        label: "Interview Skills",
        icon: _jsx(Users, { className: "h-4 w-4" })
    },
    {
        id: "resume",
        label: "Resume Building",
        icon: _jsx(FileText, { className: "h-4 w-4" })
    },
    {
        id: "networking",
        label: "Networking",
        icon: _jsx(Users, { className: "h-4 w-4" })
    },
    {
        id: "job-search",
        label: "Job Search",
        icon: _jsx(Search, { className: "h-4 w-4" })
    }
];
export default function LearningModules() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeModule, setActiveModule] = useState(null);
    // Fetch all learning modules from the user's university
    const { data: modules, isLoading: modulesLoading } = useQuery({
        queryKey: ["/api/university/learning-modules"],
        queryFn: async () => {
            // This will fetch real learning modules created by university admins
            // Returns empty array if no modules have been created
            return [];
        }
    });
    // Fetch user's enrolled modules
    const { data: enrolledModules, isLoading: enrolledLoading } = useQuery({
        queryKey: ["/api/university/learning-modules/enrolled"],
        queryFn: async () => {
            // This will fetch the user's enrolled learning modules
            return [];
        }
    });
    // Helper function for rendering stars based on rating
    const renderRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 0; i < fullStars; i++) {
            stars.push(_jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }, `full-${i}`));
        }
        if (hasHalfStar) {
            stars.push(_jsx(StarHalf, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }, "half"));
        }
        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(_jsx(Star, { className: "h-4 w-4 text-gray-300" }, `empty-${i}`));
        }
        return _jsx("div", { className: "flex", children: stars });
    };
    // Get unit type icon
    const getUnitTypeIcon = (type) => {
        switch (type) {
            case "video":
                return _jsx(Video, { className: "h-4 w-4" });
            case "interactive":
                return _jsx(Sparkles, { className: "h-4 w-4" });
            case "article":
                return _jsx(FileText, { className: "h-4 w-4" });
            case "exercise":
                return _jsx(ClipboardEdit, { className: "h-4 w-4" });
            default:
                return _jsx(BookText, { className: "h-4 w-4" });
        }
    };
    // Filter modules based on category and search query
    const filteredModules = modules?.filter((module) => {
        const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
        const matchesSearch = searchQuery === "" ||
            module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            module.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    // Get active module details
    const currentModule = modules?.find((m) => m.id === activeModule);
    // Loading state
    if (modulesLoading || enrolledLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-4 md:p-6", children: [_jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Learning Library" }), _jsx("p", { className: "text-muted-foreground", children: "Browse and enroll in career development modules" })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-lg", children: "Categories" }) }), _jsx(CardContent, { className: "pt-0", children: _jsx("div", { className: "space-y-1", children: categories.map((category) => (_jsxs(Button, { variant: selectedCategory === category.id ? "default" : "ghost", className: "w-full justify-start", onClick: () => setSelectedCategory(category.id), children: [_jsx("span", { className: "mr-2", children: category.icon }), category.label] }, category.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-lg", children: "My Learning" }) }), _jsx(CardContent, { className: "pt-0", children: _jsxs("div", { className: "space-y-1", children: [_jsxs(Button, { variant: "ghost", className: "w-full justify-start", onClick: () => { }, children: [_jsx(BookOpen, { className: "mr-2 h-4 w-4" }), "In Progress (", modules?.filter((m) => enrolledModules?.includes(m.id) &&
                                                            m.progress > 0 &&
                                                            m.progress < 100).length || 0, ")"] }), _jsxs(Button, { variant: "ghost", className: "w-full justify-start", onClick: () => { }, children: [_jsx(CheckCircle2, { className: "mr-2 h-4 w-4" }), "Completed (", modules?.filter((m) => enrolledModules?.includes(m.id) && m.progress === 100).length || 0, ")"] }), _jsxs(Button, { variant: "ghost", className: "w-full justify-start", onClick: () => { }, children: [_jsx(Bookmark, { className: "mr-2 h-4 w-4" }), "Bookmarked"] })] }) })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { placeholder: "Search modules...", className: "pl-10", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsxs(Button, { variant: "outline", className: "sm:w-auto", children: [_jsx(Filter, { className: "mr-2 h-4 w-4" }), "Filters"] })] }), _jsx("div", { children: activeModule ? (
                                // Active module view
                                _jsxs(Card, { className: "mb-6", children: [_jsxs(CardHeader, { children: [_jsxs(Button, { variant: "ghost", className: "w-fit -ml-2 mb-2", onClick: () => setActiveModule(null), children: [_jsx(PanelLeft, { className: "mr-2 h-4 w-4" }), "Back to modules"] }), _jsxs("div", { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-2xl", children: currentModule?.title }), _jsx(CardDescription, { children: currentModule?.description })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsxs(Badge, { variant: "secondary", children: [_jsx(BookOpen, { className: "mr-1 h-3 w-3" }), currentModule?.category
                                                                    ? currentModule.category.charAt(0).toUpperCase() +
                                                                        currentModule.category.slice(1)
                                                                    : ""] }), _jsxs(Badge, { variant: "secondary", children: [_jsx(Users, { className: "mr-1 h-3 w-3" }), currentModule?.level
                                                                    ? currentModule.level.charAt(0).toUpperCase() +
                                                                        currentModule.level.slice(1)
                                                                    : ""] }), _jsxs(Badge, { variant: "secondary", children: [_jsx(Clock, { className: "mr-1 h-3 w-3" }), currentModule?.estimatedHours, " hours"] })] })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "relative w-full rounded-md overflow-hidden aspect-video bg-muted", children: [currentModule?.thumbnail && (_jsx("img", { src: currentModule.thumbnail, alt: currentModule.title, className: "object-cover w-full h-full" })), _jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/40", children: _jsx(Button, { size: "lg", className: "rounded-full w-16 h-16", children: _jsx(PlayCircle, { className: "h-10 w-10" }) }) })] }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Module Content" }), _jsx("div", { className: "space-y-2", children: currentModule?.units?.map((unit) => (_jsx(Card, { className: `${unit.completed ? "bg-muted/50" : ""}`, children: _jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `p-2 rounded-md ${unit.completed
                                                                                                    ? "bg-green-100"
                                                                                                    : "bg-muted"}`, children: unit.completed ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-600" })) : (getUnitTypeIcon(unit.type)) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: unit.title }), _jsx("p", { className: "text-sm text-muted-foreground", children: unit.description }), _jsxs("div", { className: "flex items-center gap-4 mt-1 text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), unit.estimatedMinutes, " min"] }), _jsxs("span", { className: "flex items-center capitalize", children: [getUnitTypeIcon(unit.type), _jsx("span", { className: "ml-1", children: unit.type })] })] })] })] }), _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(ChevronRight, { className: "h-5 w-5" }) })] }) }, unit.id))) })] })] }), _jsx("div", { children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "About This Module" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-1", children: "Instructor" }), _jsx("p", { className: "text-sm", children: currentModule?.instructor })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-1", children: "Rating" }), _jsxs("div", { className: "flex items-center gap-2", children: [renderRating(currentModule?.rating || 0), _jsxs("span", { className: "text-sm", children: ["(", currentModule?.rating, ")"] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-1", children: "Enrolled Students" }), _jsx("p", { className: "text-sm", children: currentModule?.enrollments?.toLocaleString() ||
                                                                                        0 })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium mb-3", children: "Your Progress" }), _jsxs("div", { className: "mb-1", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Completion" }), _jsxs("span", { children: [currentModule?.progress, "%"] })] }), _jsx(Progress, { value: currentModule?.progress, className: "h-2" })] }), _jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [currentModule?.units?.filter((u) => u.completed)
                                                                                            .length || 0, " ", "of ", currentModule?.units?.length || 0, " units completed"] })] }), currentModule?.progress === 0 ? (_jsx(Button, { className: "w-full", children: "Start Learning" })) : currentModule?.progress === 100 ? (_jsx(Button, { className: "w-full", variant: "outline", children: "Review Again" })) : (_jsx(Button, { className: "w-full", children: "Continue Learning" }))] })] }) })] }) })] })) : (
                                // Module grid
                                _jsxs("div", { children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredModules?.map((module) => (_jsxs(Card, { className: "overflow-hidden flex flex-col", onClick: () => setActiveModule(module.id), children: [_jsxs("div", { className: "relative w-full aspect-video bg-muted", children: [module.thumbnail && (_jsx("img", { src: module.thumbnail, alt: module.title, className: "object-cover w-full h-full" })), _jsxs("div", { className: "absolute top-2 left-2 flex gap-1", children: [_jsx(Badge, { variant: "secondary", className: "bg-white/80 hover:bg-white/80", children: module.level?.charAt(0).toUpperCase() +
                                                                            module.level?.slice(1) }), enrolledModules?.includes(module.id) && (_jsx(Badge, { variant: "secondary", className: "bg-primary/80 text-white hover:bg-primary/80", children: "Enrolled" }))] })] }), _jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Badge, { variant: "outline", children: module.category?.charAt(0).toUpperCase() +
                                                                            module.category?.slice(1).replace("-", " ") }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-3 w-3 mr-1 text-muted-foreground" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [module.estimatedHours, " hours"] })] })] }), _jsx(CardTitle, { className: "line-clamp-1 mt-2", children: module.title }), _jsx(CardDescription, { className: "line-clamp-2", children: module.description })] }), _jsxs(CardContent, { className: "mt-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1", children: [renderRating(module.rating), _jsxs("span", { className: "text-xs ml-1", children: ["(", module.rating, ")"] })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [module.enrollments?.toLocaleString() || 0, " students"] })] }), enrolledModules?.includes(module.id) &&
                                                                module.progress > 0 && (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [module.progress, "%"] })] }), _jsx(Progress, { value: module.progress, className: "h-2" })] }))] }), _jsx(CardFooter, { className: "pt-0", children: enrolledModules?.includes(module.id) ? (module.progress === 0 ? (_jsx(Button, { className: "w-full", children: "Start Learning" })) : module.progress === 100 ? (_jsx(Button, { variant: "outline", className: "w-full", children: "Completed" })) : (_jsx(Button, { className: "w-full", children: "Continue Learning" }))) : (_jsx(Button, { variant: "outline", className: "w-full", children: "Enroll Now" })) })] }, module.id))) }), modules?.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { className: "h-16 w-16 mx-auto mb-4 text-muted-foreground" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Learning Modules Available" }), _jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: "Your university hasn't created any learning modules yet. Contact your university administrator to add career development content." })] })) : filteredModules?.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Search, { className: "h-10 w-10 mx-auto mb-4 text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "No modules found" }), _jsx("p", { className: "text-muted-foreground", children: "Try adjusting your search or filter criteria" })] })) : null] })) })] })] })] }));
}
