import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
export default function StatCard({ icon, iconBgColor, iconColor, label, value, change }) {
    return (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: cn("flex-shrink-0 p-3 rounded-full", iconBgColor), children: icon }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-neutral-500 text-sm", children: label }), _jsx("p", { className: "text-2xl font-semibold", children: value })] })] }) }) }));
}
