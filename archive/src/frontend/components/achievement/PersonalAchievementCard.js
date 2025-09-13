import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Award, Briefcase, ExternalLink, GraduationCap, Medal, MoreHorizontal, Pencil, Star, Trash2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
const AchievementIcon = ({ name, className }) => {
    switch (name) {
        case "award":
            return _jsx(Award, { className: className });
        case "briefcase":
            return _jsx(Briefcase, { className: className });
        case "graduation":
            return _jsx(GraduationCap, { className: className });
        case "medal":
            return _jsx(Medal, { className: className });
        case "star":
            return _jsx(Star, { className: className });
        case "trophy":
            return _jsx(Trophy, { className: className });
        default:
            return _jsx(Award, { className: className });
    }
};
// Map categories to colors
const categoryColors = {
    professional: "bg-blue-500/10 text-blue-500",
    academic: "bg-green-500/10 text-green-500",
    personal: "bg-purple-500/10 text-purple-500",
    certification: "bg-orange-500/10 text-orange-500",
    award: "bg-yellow-500/10 text-yellow-500",
};
export default function PersonalAchievementCard({ achievement, onEdit, onDelete, }) {
    const iconColor = achievement.category === "professional"
        ? "text-blue-500"
        : achievement.category === "academic"
            ? "text-green-500"
            : achievement.category === "personal"
                ? "text-purple-500"
                : achievement.category === "certification"
                    ? "text-orange-500"
                    : "text-yellow-500";
    const bgColor = achievement.category === "professional"
        ? "bg-blue-500/10"
        : achievement.category === "academic"
            ? "bg-green-500/10"
            : achievement.category === "personal"
                ? "bg-purple-500/10"
                : achievement.category === "certification"
                    ? "bg-orange-500/10"
                    : "bg-yellow-500/10";
    return (_jsxs(Card, { className: "overflow-hidden", children: [_jsx("div", { className: `h-2 ${bgColor.replace("/10", "/70")}` }), _jsx(CardContent, { className: "pt-6 pb-4", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: `h-12 w-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`, children: _jsx(AchievementIcon, { name: achievement.icon, className: `h-6 w-6 ${iconColor}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("h3", { className: "font-medium text-base line-clamp-1", children: achievement.title }), (onEdit || onDelete) && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [onEdit && (_jsxs(DropdownMenuItem, { onClick: () => onEdit(achievement), children: [_jsx(Pencil, { className: "mr-2 h-4 w-4" }), "Edit"] })), onDelete && (_jsxs(_Fragment, { children: [onEdit && _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => onDelete(achievement.id), className: "text-red-500 focus:text-red-500", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })] }))] })] }))] }), _jsx("p", { className: "text-sm text-neutral-500 line-clamp-2 mt-1", children: achievement.description }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [_jsx(Badge, { variant: "outline", className: "capitalize", children: achievement.category }), achievement.skills && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: achievement.skills })), _jsxs(Badge, { variant: "outline", className: `${iconColor} ${bgColor}`, children: ["+", achievement.xpValue, " XP"] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-neutral-500", children: [achievement.achievementDate && (_jsx("span", { children: format(new Date(achievement.achievementDate), "MMM d, yyyy") })), achievement.issuingOrganization && (_jsx("span", { className: "font-medium", children: achievement.issuingOrganization })), achievement.proofUrl && (_jsxs("a", { href: achievement.proofUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center text-primary hover:underline", children: [_jsx(ExternalLink, { className: "h-3 w-3 mr-1" }), " View Proof"] }))] })] })] }) })] }));
}
