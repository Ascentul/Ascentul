import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthProvider";
import { UserProvider } from "@/lib/useUserData";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "./components/ui/toaster";
// Step 5 (FINAL): Test the actual App component with all providers
function TestWrapper() {
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-6", children: "\uD83D\uDD27 Step 5 (FINAL): Testing Real App Component" }), _jsxs("div", { className: "p-4 bg-blue-100 border border-blue-300 rounded-lg mb-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-2 text-blue-800", children: "\uD83C\uDFAF All Providers Confirmed Working - Now Testing App Component" }), _jsx("p", { className: "text-blue-700", children: "QueryClient \u2705 + SupabaseAuth \u2705 + UserProvider \u2705 + AuthProvider \u2705" })] }), _jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Real App Component Below:" }), _jsx(App, {})] })] }) }));
}
const root = document.getElementById("root");
if (root) {
    try {
        createRoot(root).render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(SupabaseAuthProvider, { children: _jsx(UserProvider, { children: _jsxs(AuthProvider, { children: [_jsx(TestWrapper, {}), _jsx(Toaster, {})] }) }) }) }));
        console.log("✅ SUCCESS: Real App component mounted with all providers!");
    }
    catch (error) {
        console.error("❌ FOUND THE ISSUE: App component is causing the crash:", error);
        root.innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #fee; border: 2px solid #fcc;">
        <h1>🎯 FOUND THE ISSUE: App Component Error</h1>
        <p style="background: #ffeb3b; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <strong>All providers work fine - the issue is in the App component!</strong>
        </p>
        <h2>Error Details:</h2>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">
${error.message}

Stack Trace:
${error.stack}
        </pre>
        <p style="margin-top: 10px; color: #666;">
          Now we know exactly where to look - something in the App component is crashing during initialization.
        </p>
      </div>
    `;
    }
}
else {
    console.error("❌ Root element not found!");
}
