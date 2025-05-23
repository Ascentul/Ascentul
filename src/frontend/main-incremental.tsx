import { createRoot } from "react-dom/client"
import "./index.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/queryClient"

// Step 1: Just add QueryClient first, then we'll add others one by one
function MinimalApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          🔧 Ascentul - Provider Testing
        </h1>

        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-green-800">
              ✅ Step 1: QueryClient Added
            </h2>
            <p className="text-green-700">
              Testing with QueryClientProvider only...
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">🔗 API Test</h2>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/health")
                  const data = await response.json()
                  alert(`API Works: ${JSON.stringify(data, null, 2)}`)
                } catch (error) {
                  alert(`API Error: ${error.message}`)
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-4"
            >
              Test API
            </button>

            <button
              onClick={() => {
                // Test if we can use react-query
                console.log("QueryClient instance:", queryClient)
                alert(
                  "QueryClient is available: " + (queryClient ? "Yes" : "No")
                )
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Test QueryClient
            </button>
          </div>

          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-yellow-800">
              ⏳ Next Steps
            </h2>
            <p className="text-yellow-700">
              If this loads successfully, we'll add the next provider...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById("root")
if (root) {
  try {
    createRoot(root).render(
      <QueryClientProvider client={queryClient}>
        <MinimalApp />
      </QueryClientProvider>
    )
    console.log("✅ App with QueryClient mounted successfully")
  } catch (error) {
    console.error("❌ Failed to mount app with QueryClient:", error)
    root.innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #fee; border: 2px solid #fcc;">
        <h1>QueryClient Error</h1>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap;">
          ${error.message}
          
          Stack: ${error.stack}
        </pre>
      </div>
    `
  }
} else {
  console.error("❌ Root element not found!")
}
