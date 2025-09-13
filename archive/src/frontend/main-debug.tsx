import { createRoot } from "react-dom/client"
import "./index.css"

// Let's start with just the basic app structure and add providers one by one
function DebugApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          🔍 Ascentul Debug Mode
        </h1>

        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">✅ React is Working</h2>
            <p>The basic React app is rendering successfully.</p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">🧪 Testing Providers</h2>
            <p>Let's test each provider individually...</p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">🌐 Environment Check</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(
                {
                  mode: import.meta.env.MODE,
                  dev: import.meta.env.DEV,
                  prod: import.meta.env.PROD,
                  baseUrl: import.meta.env.BASE_URL
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">🔗 API Test</h2>
            <button
              onClick={async () => {
                try {

    root.innerHTML = `
      <div style="padding: 20px; font-family: monospace;">
        <h1>React Mount Error</h1>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
          ${error.message}
        </pre>
      </div>
    `
  }
} else {
  console.error("❌ Root element not found!")
}
