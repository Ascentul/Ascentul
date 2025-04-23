import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse JSON response first
    let errorText = res.statusText;
    let errorMessage = '';
    
    try {
      const contentType = res.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await res.clone().json();
        errorMessage = errorJson.error || errorJson.message || '';
      } 
      
      if (!errorMessage) {
        errorText = await res.text();
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
      errorText = await res.text() || res.statusText;
    }
    
    throw new Error(errorMessage || `${res.status}: ${errorText}`);
  }
}

// Request options interface
export interface ApiRequestOptions {
  url: string;
  method?: string;
  data?: unknown;
}

// Function overloads for apiRequest
export async function apiRequest<T>(
  options: ApiRequestOptions
): Promise<T>;

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response>;

// Implementation of apiRequest
export async function apiRequest<T>(
  methodOrOptions: string | ApiRequestOptions,
  urlOrNothing?: string,
  dataOrNothing?: unknown
): Promise<T | Response> {
  let method: string;
  let url: string;
  let data: unknown | undefined;
  
  // Determine if we're using the object pattern or the separate arguments pattern
  if (typeof methodOrOptions === 'object') {
    // Object pattern
    method = methodOrOptions.method || 'GET';
    url = methodOrOptions.url;
    data = methodOrOptions.data;
  } else {
    // Separate arguments pattern
    method = methodOrOptions;
    url = urlOrNothing!;
    data = dataOrNothing;
  }

  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Add Content-Type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Check if user is logged out from localStorage
  const isLoggedOut = localStorage.getItem('auth-logout') === 'true';
  if (isLoggedOut && url !== '/auth/login') {
    headers["X-Auth-Logout"] = "true";
  }
  
  // Clear the logout flag if this is a login request
  if (url === '/auth/login' && method === 'POST') {
    localStorage.removeItem('auth-logout');
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // This ensures cookies are sent with the request
  });
  
  // Debug authentication info
  console.log(`API Request to ${url}: Status ${res.status}, Auth: ${res.headers.get('x-auth-status') || 'N/A'}`);

  await throwIfResNotOk(res);
  
  // If we're using the object pattern, assume they want JSON back
  if (typeof methodOrOptions === 'object') {
    return await res.json() as T;
  }
  
  // Otherwise return the response object
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Create headers object
    const headers: Record<string, string> = {};
    
    // Check if user is logged out from localStorage
    const isLoggedOut = localStorage.getItem('auth-logout') === 'true';
    if (isLoggedOut) {
      headers["X-Auth-Logout"] = "true";
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
