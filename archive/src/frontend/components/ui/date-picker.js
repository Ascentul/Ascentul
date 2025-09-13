import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
export function DatePicker({ date, setDate, disabled }) {
    return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn("w-full justify-start text-left font-normal overflow-hidden", !date && "text-muted-foreground", disabled && "opacity-50 cursor-not-allowed"), disabled: disabled, children: [_jsx(CalendarIcon, { className: "mr-2 h-4 w-4 flex-shrink-0" }), _jsx("span", { className: "truncate", children: date ? format(date, "PPP") : "Pick a date" })] }) }), _jsx(PopoverContent, { className: "w-auto p-0", children: _jsx(Calendar, { mode: "single", selected: date, onSelect: setDate, initialFocus: true }) })] }));
}
