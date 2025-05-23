import { createRoot } from "react-dom/client"
import "./index.css"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/queryClient"
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthProvider"

// Step 2: Add SupabaseAuthProvider to QueryClient
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
              ✅ Step 1: QueryClient ✅
            </h2>
            <p className="text-green-700">
              QueryClientProvider is working perfectly!
            </p>
          </div>

          <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-blue-800">
              🧪 Step 2: Testing SupabaseAuthProvider
            </h2>
            <p className="text-blue-700">
              Now testing with SupabaseAuthProvider added...
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
                alert("Both QueryClient and SupabaseAuth are working!")
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Test Auth Provider
            </button>
          </div>

          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-yellow-800">
              ⏳ Next Steps
            </h2>
            <p className="text-yellow-700">
              If this page loads: ✅ SupabaseAuth is fine, we'll test the next
              provider
              <br />
              If this page is blank: ❌ SupabaseAuth is the problem
            </p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🌐 Environment Check</h2>
            <pre className="text-sm bg-white p-2 rounded">
              {JSON.stringify(
                {
                  mode: import.meta.env.MODE,
                  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
                  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                null,
                2
              )}
            </pre>
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
        <SupabaseAuthProvider>
          <MinimalApp />
        </SupabaseAuthProvider>
      </QueryClientProvider>
    )
    console.log("✅ App with QueryClient + SupabaseAuth mounted successfully")
  } catch (error) {
    console.error("❌ Failed to mount app with SupabaseAuth:", error)
    root.innerHTML = `
      <div style="padding: 20px; font-family: monospace; background: #fee; border: 2px solid #fcc;">
        <h1>SupabaseAuth Error</h1>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap;">
          ${error.message}
          
          Stack: ${error.stack}
        </pre>
        <p style="margin-top: 10px; color: #666;">
          This indicates SupabaseAuthProvider is causing the crash.
        </p>
      </div>
    `
  }
} else {
  console.error("❌ Root element not found!")
}
