import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export default function LevelProgress({ level, xp, nextLevelXp, rank, nextRank, }) {
    // Calculate the percentage of XP towards the next level
    const percentage = Math.min(100, Math.round((xp / nextLevelXp) * 100));
    // Calculate the stroke dashoffset for the progress ring
    // The circle has a radius of 45 and circumference of 2 * PI * 45 = ~283
    const circumference = 2 * Math.PI * 45;
    const dashOffset = circumference * (1 - percentage / 100);
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 font-poppins", children: "Level Progress" }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative", children: [_jsxs("svg", { className: "transform -rotate-90", width: "120", height: "120", children: [_jsx("circle", { className: "text-neutral-200", stroke: "currentColor", strokeWidth: "8", fill: "transparent", r: "45", cx: "60", cy: "60" }), _jsx("circle", { className: "text-primary", stroke: "currentColor", strokeWidth: "8", fill: "transparent", r: "45", cx: "60", cy: "60", strokeDasharray: circumference, strokeDashoffset: dashOffset, strokeLinecap: "round" })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "text-center", children: _jsxs("span", { className: "text-2xl font-bold", children: [percentage, "%"] }) }) })] }), _jsxs("div", { className: "mt-4 text-center", children: [_jsx("h3", { className: "text-lg font-medium font-poppins", children: rank }), _jsxs("p", { className: "text-neutral-500 text-sm mt-1", children: ["Level ", level] }), _jsxs("p", { className: "mt-3", children: [_jsx("span", { className: "font-medium", children: xp }), " / ", nextLevelXp, " XP"] })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("p", { className: "text-sm text-center mb-2", children: ["Next milestone: ", _jsx("span", { className: "font-semibold", children: nextRank })] }), _jsx(Button, { variant: "outline", className: "w-full bg-primary/10 text-primary hover:bg-primary/20", children: "View Level Benefits" })] })] })] }) }));
}
