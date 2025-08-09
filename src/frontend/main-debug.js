import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import "./index.css";
// Let's start with just the basic app structure and add providers one by one
function DebugApp() {
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-6", children: "\uD83D\uDD0D Ascentul Debug Mode" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "\u2705 React is Working" }), _jsx("p", { children: "The basic React app is rendering successfully." })] }), _jsxs("div", { className: "p-4 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "\uD83E\uDDEA Testing Providers" }), _jsx("p", { children: "Let's test each provider individually..." })] }), _jsxs("div", { className: "p-4 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "\uD83C\uDF10 Environment Check" }), _jsx("pre", { className: "text-sm bg-gray-100 p-2 rounded", children: JSON.stringify({
                                        mode: import.meta.env.MODE,
                                        dev: import.meta.env.DEV,
                                        prod: import.meta.env.PROD,
                                        baseUrl: import.meta.env.BASE_URL
                                    }, null, 2) })] }), _jsxs("div", { className: "p-4 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "\uD83D\uDD17 API Test" }), _jsx("button", { onClick: async () => {
                                        try {
                                            console.log("Testing API...");
                                            const response = await fetch("/api/health");
                                            const data = await response.json();
                                            alert(`API Works: ${JSON.stringify(data, null, 2)}`);
                                        }
                                        catch (error) {
                                            console.error("API Error:", error);
                                            alert(`API Error: ${error.message}`);
                                        }
                                    }, className: "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded", children: "Test API" })] })] })] }) }));
}
// Try to mount the app with error handling
const root = document.getElementById("root");
if (root) {
    try {
        createRoot(root).render(_jsx(DebugApp, {}));
        console.log("✅ Debug app mounted successfully");
    }
    catch (error) {
        console.error("❌ Failed to mount debug app:", error);
        root.innerHTML = `
      <div style="padding: 20px; font-family: monospace;">
        <h1>React Mount Error</h1>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
          ${error.message}
        </pre>
      </div>
    `;
    }
}
else {
    console.error("❌ Root element not found!");
}
