import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export function ConnectionStatus() {
    const [status, setStatus] = useState("loading");
    const { toast } = useToast();
    // Check connection to API
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await fetch("/api/health");
                if (response.ok) {
                    setStatus("connected");
                }
                else {
                    setStatus("error");
                    toast({
                        title: "API Connection Issue",
                        description: "Could not connect to the API. Some features may not work correctly.",
                        variant: "destructive",
                    });
                }
            }
            catch (error) {
                console.error("API connection error:", error);
                setStatus("error");
                toast({
                    title: "API Connection Error",
                    description: "Failed to connect to the API. Please check your connection.",
                    variant: "destructive",
                });
            }
        };
        checkConnection();
        // Check connection every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, [toast]);
    const handleRetry = () => {
        setStatus("loading");
        // Attempt to reload the application
        window.location.reload();
    };
    // Only show for error state
    if (status === "error") {
        return (_jsxs("div", { className: "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-white shadow-lg", children: [_jsx(AlertCircle, { className: "h-5 w-5" }), _jsx("span", { className: "text-sm font-medium", children: "Connection lost" }), _jsx("button", { onClick: handleRetry, className: "ml-2 rounded-md bg-destructive-foreground/20 p-1 hover:bg-destructive-foreground/30", "aria-label": "Retry connection", children: _jsx(RefreshCw, { className: "h-4 w-4" }) })] }));
    }
    // Optionally show for connected state (can be removed if not needed)
    if (status === "connected") {
        return (_jsxs("div", { className: "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg opacity-80 hover:opacity-100 transition-opacity duration-300", children: [_jsx(CheckCircle2, { className: "h-5 w-5" }), _jsx("span", { className: "text-sm font-medium", children: "Connected" })] }));
    }
    return null;
}
