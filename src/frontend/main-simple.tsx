import { createRoot } from "react-dom/client"
import "./index.css"

// Simple test component
function TestApp() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Ascentul is Working!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Frontend is successfully deployed and running on Vercel
        </p>
        <div className="space-y-4">
          <button
            onClick={() => alert("Frontend is working!")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            Test Frontend
          </button>
          <div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/health")
                  const data = await response.json()
                  alert(`API Response: ${JSON.stringify(data, null, 2)}`)
                } catch (error) {
                  alert(`API Error: ${error.message}`)
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium ml-4"
            >
              Test API
            </button>
          </div>
        </div>
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Deployment Info</h2>
          <p className="text-sm text-gray-600">
            Build Time: {new Date().toISOString()}
          </p>
          <p className="text-sm text-gray-600">
            Environment: {import.meta.env.MODE}
          </p>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(<TestApp />)
} else {
  console.error("Root element not found!")
}
