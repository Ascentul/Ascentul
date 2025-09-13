import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import "./index.css";
// Simple test component
function TestApp() {
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "\uD83C\uDF89 Ascentul is Working!" }), _jsx("p", { className: "text-lg text-gray-600 mb-8", children: "Frontend is successfully deployed and running on Vercel" }), _jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => alert("Frontend is working!"), className: "bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium", children: "Test Frontend" }), _jsx("div", { children: _jsx("button", { onClick: async () => {
                                    try {
                                        const response = await fetch("/api/health");
                                        const data = await response.json();
                                        alert(`API Response: ${JSON.stringify(data, null, 2)}`);
                                    }
                                    catch (error) {
                                        alert(`API Error: ${error.message}`);
                                    }
                                }, className: "bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium ml-4", children: "Test API" }) })] }), _jsxs("div", { className: "mt-8 p-4 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Deployment Info" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Build Time: ", new Date().toISOString()] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Environment: ", import.meta.env.MODE] })] })] }) }));
}
const root = document.getElementById("root");
if (root) {
    createRoot(root).render(_jsx(TestApp, {}));
}
else {
    console.error("Root element not found!");
}
