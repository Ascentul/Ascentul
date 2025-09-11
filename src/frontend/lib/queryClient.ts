import { QueryClient, QueryFunction } from "@tanstack/react-query"
import supabaseClient from "./supabase-auth"

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse JSON response first
    let errorText = res.statusText
    let errorMessage = ""

    try {
      const contentType = res.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        const errorJson = await res.clone().json()
        errorMessage = errorJson.error || errorJson.message || ""
      }

      if (!errorMessage) {
        errorText = await res.text()
      }
    } catch (e) {
      console.error("Error parsing error response:", e)
      errorText = (await res.text()) || res.statusText
    }

    // Create a custom error with additional status information
    const error = new Error(errorMessage || `${res.status}: ${errorText}`)
    // Add status code to error object for easier checking
    ;(error as any).status = res.status
    throw error
  }
}

// Helper function to get the current Supabase session token
async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data } = await supabaseClient.auth.getSession()
    return data.session?.access_token || null
  } catch (error) {
    console.error("Error getting Supabase token:", error)
    return null
  }
}

// Request options interface
export interface ApiRequestOptions {
  url: string
  method?: string
  data?: unknown
}

// Function overloads for apiRequest
export async function apiRequest<T>(options: ApiRequestOptions): Promise<T>

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response>

// Implementation of apiRequest
export async function apiRequest<T>(
  methodOrOptions: string | ApiRequestOptions,
  urlOrNothing?: string,
  dataOrNothing?: unknown
): Promise<T | Response> {
  let method: string
  let url: string
  let data: unknown | undefined

  // Determine if we're using the object pattern or the separate arguments pattern
  if (typeof methodOrOptions === "object") {
    // Object pattern
    method = methodOrOptions.method || "GET"
    url = methodOrOptions.url
    data = methodOrOptions.data
  } else {
    // Separate arguments pattern
    method = methodOrOptions
    url = urlOrNothing!
    data = dataOrNothing
  }

  // Prepare headers
  const headers: Record<string, string> = {}

  // Add Content-Type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json"
  }

  // Get Supabase token and add Authorization header
  const token = await getSupabaseToken()
  if (token) {
