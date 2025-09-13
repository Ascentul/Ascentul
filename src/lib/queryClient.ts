// API request utility for Next.js
export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    // Send cookies so server routes can read Clerk session
    credentials: 'include',
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(url, options)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const msg = (errorData && (errorData.message || errorData.error)) || `HTTP ${response.status}`
    throw new Error(msg)
  }

  return response
}