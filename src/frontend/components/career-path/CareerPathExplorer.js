import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight, TrendingUp, Sparkles, BriefcaseBusiness, Award, Braces, Cpu, LineChart, User, Database, Layers, Lightbulb, GraduationCap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// Icon mapping
const iconMap = {
    'braces': _jsx(Braces, { className: "h-6 w-6 text-primary" }),
    'cpu': _jsx(Cpu, { className: "h-6 w-6 text-primary" }),
    'database': _jsx(Database, { className: "h-6 w-6 text-primary" }),
    'briefcase': _jsx(BriefcaseBusiness, { className: "h-6 w-6 text-primary" }),
    'user': _jsx(User, { className: "h-6 w-6 text-primary" }),
    'award': _jsx(Award, { className: "h-6 w-6 text-primary" }),
    'lineChart': _jsx(LineChart, { className: "h-6 w-6 text-primary" }),
    'layers': _jsx(Layers, { className: "h-6 w-6 text-primary" }),
    'graduation': _jsx(GraduationCap, { className: "h-6 w-6 text-primary" }),
    'lightbulb': _jsx(Lightbulb, { className: "h-6 w-6 text-primary" }),
    'book': _jsx(BookOpen, { className: "h-6 w-6 text-primary" }),
};
const LevelBadgeColors = {
    'entry': 'bg-blue-100 text-blue-800',
    'mid': 'bg-green-100 text-green-800',
    'senior': 'bg-purple-100 text-purple-800',
    'lead': 'bg-yellow-100 text-yellow-800',
    'executive': 'bg-red-100 text-red-800',
};
const GrowthIndicators = {
    'low': {
        icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
        text: 'Low Growth',
        color: 'text-amber-500'
    },
    'medium': {
        icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
        text: 'Medium Growth',
        color: 'text-blue-500'
    },
    'high': {
        icon: _jsx(Sparkles, { className: "h-4 w-4" }),
        text: 'High Growth',
        color: 'text-green-500'
    }
};
export const CareerPathExplorer = ({ pathData }) => {
    const scrollContainerRef = useRef(null);
    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300; // Adjust as needed
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };
    // Format and prepare the data for visualization
    const formatCareerPaths = (data) => {
        // If the data is already in the expected format, return it directly
        if (data.paths && Array.isArray(data.paths)) {
            return data.paths.map((path) => {
                // Ensure each node has an icon
                const formattedNodes = path.nodes.map((node) => ({
                    ...node,
                    icon: node.icon || 'briefcase', // Default icon if none provided
                }));
                return {
                    ...path,
                    nodes: formattedNodes,
                };
            });
        }
        // Otherwise, construct a path from the recommendation data
        const defaultPath = {
            id: 'recommended-path',
            name: 'Recommended Career Path',
            nodes: [],
        };
        // If there are suggested roles, use them to build the path
        if (data.suggestedRoles && Array.isArray(data.suggestedRoles)) {
            defaultPath.nodes = data.suggestedRoles.map((role, index) => {
                // Determine the level based on position in the array or other heuristics
                let level;
                if (index === 0)
                    level = 'entry';
                else if (index === data.suggestedRoles.length - 1)
                    level = 'executive';
                else if (index < data.suggestedRoles.length / 3)
                    level = 'mid';
                else if (index < data.suggestedRoles.length * 2 / 3)
                    level = 'senior';
                else
                    level = 'lead';
                return {
                    id: `role-${index}`,
                    title: role.title,
                    level,
                    salaryRange: role.salaryRange || 'Not specified',
                    yearsExperience: role.timeToAchieve || 'Not specified',
                    skills: role.keySkills?.map((skill) => ({
                        name: skill,
                        level: 'intermediate'
                    })) || [],
                    growthPotential: role.growthPotential || 'medium',
                    description: role.description || '',
                    icon: role.icon || 'briefcase',
                };
            });
        }
        return [defaultPath];
    };
    const careerPaths = formatCareerPaths(pathData);
    const activePath = careerPaths[0]; // Always display the first path
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-0 top-1/2 -translate-y-1/2 z-10", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleScroll('left'), className: "h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100", children: _jsx(ChevronLeft, { className: "h-6 w-6" }) }) }), _jsxs("div", { ref: scrollContainerRef, className: "pb-6 overflow-x-auto scrollbar-hide relative flex items-start gap-4", style: {
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }, children: [_jsx("div", { className: "absolute top-20 left-0 right-10 h-1 bg-gray-200" }), activePath.nodes.map((node, index) => (_jsx("div", { className: "flex flex-col items-center min-w-[250px] first:pl-4", children: _jsxs(motion.div, { className: "transition-all relative mt-4", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, children: [_jsx(Card, { className: "w-60 shadow-md", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("div", { className: "mt-1", children: iconMap[node.icon] || _jsx(BriefcaseBusiness, { className: "h-6 w-6 text-primary" }) }), _jsx(Badge, { className: LevelBadgeColors[node.level], children: node.level.charAt(0).toUpperCase() + node.level.slice(1) })] }), _jsx("h3", { className: "font-bold text-lg mb-1", children: node.title }), _jsx("div", { className: "text-sm text-muted-foreground mb-2", children: node.salaryRange }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Experience: ", node.yearsExperience] }), _jsxs("div", { className: cn("flex items-center gap-1 text-xs mt-2", GrowthIndicators[node.growthPotential].color), children: [GrowthIndicators[node.growthPotential].icon, GrowthIndicators[node.growthPotential].text] })] }) }), index < activePath.nodes.length - 1 && (_jsx("div", { className: "absolute -right-6 top-1/2 transform -translate-y-1/2 text-gray-400", children: _jsx(ArrowRight, { className: "h-5 w-5" }) }))] }) }, node.id)))] }), _jsx("div", { className: "absolute right-0 top-1/2 -translate-y-1/2 z-10", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleScroll('right'), className: "h-10 w-10 rounded-full bg-white shadow-md hover:bg-gray-100", children: _jsx(ChevronRight, { className: "h-6 w-6" }) }) })] }), pathData.transferableSkills && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-medium mb-3", children: "Your Transferable Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: pathData.transferableSkills.map((skill, index) => (_jsx(Badge, { className: cn("px-3 py-1", skill.currentProficiency === 'advanced' ? 'bg-green-100 text-green-800' :
                                skill.currentProficiency === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                                    'bg-amber-100 text-amber-800'), children: skill.skill }, `skill-${index}`))) })] })), pathData.developmentPlan && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-medium mb-3", children: "Development Plan" }), _jsx("div", { className: "space-y-2", children: pathData.developmentPlan.map((step, index) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "h-6 w-6 rounded-full bg-primary text-white flex-shrink-0 flex items-center justify-center text-sm font-medium", children: index + 1 }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: step.step }), _jsxs("span", { className: "text-sm text-muted-foreground ml-2", children: ["(", step.timeframe, ")"] })] })] }, `step-${index}`))) })] }))] }));
};
