import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
export default function ModelSelector({ selectedModel, onModelChange, disabled = false }) {
    const { data: models = [], isLoading, isError } = useQuery({
        queryKey: ["/api/models"],
        // Don't refresh too often - models don't change frequently
        staleTime: 24 * 60 * 60 * 1000,
        // Disable refetching on window focus for this query
        refetchOnWindowFocus: false
    });
    // Filter out inactive models
    const activeModels = models.filter((model) => model.active);
    if (isLoading) {
        return _jsx(Skeleton, { className: "h-8 w-28" });
    }
    if (isError || !activeModels.length) {
        // Fallback to default if error or no models available
        return (_jsxs(Select, { value: "gpt-4o-mini", disabled: true, children: [_jsx(SelectTrigger, { className: "w-[140px] h-8", children: _jsx(SelectValue, { placeholder: "GPT-4o Mini" }) }), _jsx(SelectContent, { children: _jsx(SelectItem, { value: "gpt-4o-mini", children: "GPT-4o Mini" }) })] }));
    }
    return (_jsxs(Select, { value: selectedModel, onValueChange: onModelChange, disabled: disabled, children: [_jsx(SelectTrigger, { className: "w-[140px] h-8", children: _jsx(SelectValue, { placeholder: "Select model" }) }), _jsx(SelectContent, { children: activeModels.map((model) => (_jsx(SelectItem, { value: model.id, children: model.label }, model.id))) })] }));
}
