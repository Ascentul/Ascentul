import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
const LoadingButton = React.forwardRef(({ className, variant, size, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (_jsxs(Button, { className: cn(className), variant: variant, size: size, ref: ref, disabled: loading || disabled, ...props, children: [loading && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), loading && loadingText ? loadingText : children] }));
});
LoadingButton.displayName = "LoadingButton";
export { LoadingButton };
