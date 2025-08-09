import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
import { Rocket, Target, GraduationCap, Briefcase, Award, Star, BookOpen, FileText, Users, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
export default function AchievementBadge({ name, description, icon, xpReward, unlocked, earnedAt, }) {
    // Map string icon names to components
    const getIcon = () => {
        if (!unlocked)
            return _jsx(Lock, { className: "text-neutral-400 text-xl" });
        switch (icon.toLowerCase()) {
            case 'rocket':
                return _jsx(Rocket, { className: "text-[#8bc34a] text-xl" });
            case 'bullseye':
            case 'target':
                return _jsx(Target, { className: "text-[#8bc34a] text-xl" });
            case 'graduation-cap':
                return _jsx(GraduationCap, { className: "text-[#8bc34a] text-xl" });
            case 'briefcase':
                return _jsx(Briefcase, { className: "text-[#8bc34a] text-xl" });
            case 'award':
                return _jsx(Award, { className: "text-[#8bc34a] text-xl" });
            case 'star':
                return _jsx(Star, { className: "text-[#8bc34a] text-xl" });
            case 'book':
                return _jsx(BookOpen, { className: "text-[#8bc34a] text-xl" });
            case 'file':
                return _jsx(FileText, { className: "text-[#8bc34a] text-xl" });
            case 'users':
                return _jsx(Users, { className: "text-[#8bc34a] text-xl" });
            default:
                return _jsx(Award, { className: "text-[#8bc34a] text-xl" });
        }
    };
    return (_jsxs(Card, { className: cn("shadow-sm p-4 flex flex-col items-center text-center", !unlocked && "opacity-50"), children: [_jsx("div", { className: cn("relative w-20 h-20 rounded-full flex items-center justify-center mb-3", unlocked
                    ? "bg-[#8bc34a]/10 before:content-[''] before:absolute before:w-[70px] before:h-[70px] before:rounded-full before:bg-[#8bc34a]/5"
                    : "bg-neutral-200/50 before:content-[''] before:absolute before:w-[70px] before:h-[70px] before:rounded-full before:bg-neutral-200/30"), children: getIcon() }), _jsx("h3", { className: cn("text-sm font-medium", !unlocked && "text-neutral-400"), children: name }), _jsx("p", { className: cn("text-xs text-neutral-500 mt-1", !unlocked && "text-neutral-400"), children: description }), _jsxs("p", { className: cn("text-xs mt-2", unlocked ? "text-[#8bc34a]" : "text-neutral-400"), children: ["+", xpReward, " XP"] }), earnedAt && unlocked && (_jsxs("p", { className: "text-xs text-neutral-400 mt-1", children: ["Earned ", earnedAt.toLocaleDateString()] }))] }));
}
