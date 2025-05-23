import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import { Toaster } from "./components/ui/toaster"
import { UserProvider } from "@/lib/useUserData"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/queryClient"
import { AuthProvider } from "@/hooks/use-auth"
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthProvider"

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <UserProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </UserProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
)
