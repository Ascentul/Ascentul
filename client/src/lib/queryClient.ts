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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Development mode mock for authentication
  if (import.meta.env.DEV && (url === '/api/users/me' || url.startsWith('/api/certifications'))) {
    console.log(`DEV MODE: Mocking ${method} request to ${url}`);
    
    // For GET /api/certifications return mock data
    if (method === 'GET' && url === '/api/certifications') {
      const mockResponse = new Response(JSON.stringify([
        {
          id: 1,
          name: "AWS Certified Solutions Architect",
          provider: "Amazon Web Services",
          issueDate: "2023-01-15",
          expiryDate: "2026-01-15",
          credentialId: "AWS-12345",
          credentialUrl: "https://aws.amazon.com/verification",
          skills: ["AWS", "Cloud Architecture", "Security"],
          status: "active",
          description: "Professional level certification for designing distributed systems on AWS",
          userId: 999,
          createdAt: "2023-01-20T12:00:00Z",
          updatedAt: "2023-01-20T12:00:00Z"
        },
        {
          id: 2,
          name: "Microsoft Azure Fundamentals",
          provider: "Microsoft",
          issueDate: "2022-08-10",
          expiryDate: "2025-08-10",
          credentialId: "MS-67890",
          credentialUrl: "https://learn.microsoft.com/certifications",
          skills: ["Azure", "Cloud Computing", "IaaS"],
          status: "active",
          description: "Entry-level certification demonstrating foundation knowledge of cloud services on Azure",
          userId: 999,
          createdAt: "2022-08-15T10:00:00Z",
          updatedAt: "2022-08-15T10:00:00Z"
        },
        {
          id: 3,
          name: "Google Professional Cloud Architect",
          provider: "Google Cloud",
          issueDate: "2023-04-05",
          expiryDate: null,
          credentialId: "GCP-24680",
          credentialUrl: "https://cloud.google.com/certification/cloud-architect",
          skills: ["GCP", "Cloud Architecture", "Kubernetes"],
          status: "in-progress",
          description: "Advanced certification for designing and managing GCP infrastructure",
          userId: 999,
          createdAt: "2023-04-10T15:30:00Z",
          updatedAt: "2023-04-10T15:30:00Z"
        }
      ]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      return mockResponse;
    }
    
    // For POST, PUT, DELETE mock success response for certifications
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') && url.includes('/api/certifications')) {
      const dataObj = data as Record<string, any> || {};
      const mockData = method === 'POST' 
        ? { 
            id: Math.floor(Math.random() * 1000), 
            userId: 999, 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(),
            ...dataObj 
          }
        : { success: true, message: "Operation completed successfully" };
      
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      return mockResponse;
    }
    
    // Other routes for development mode
    console.log("Using real API call in development mode for:", url);
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
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Development mode handlers for certain endpoints
    if (import.meta.env.DEV) {
      // Handle /api/users/me in development mode
      if (url === '/api/users/me') {
        console.log("DEV MODE: Returning mock user for /api/users/me");
        
        // Create mock user data
        const mockUser = {
          id: 999,
          username: "testuser",
          name: "Test User",
          email: "test@example.com",
          userType: "regular",
          isUniversityStudent: false,
          xp: 1500,
          level: 5,
          rank: "Intermediate",
          subscriptionPlan: "premium",
          subscriptionStatus: "active",
          subscriptionCycle: "annual",
          stripeCustomerId: "cus_test123",
          stripeSubscriptionId: "sub_test123",
          emailVerified: true
        };
        
        // Use type assertion to convert to generic type T
        return mockUser as any as T;
      }
      
      // Handle certifications in development mode
      if (url === '/api/certifications') {
        console.log("DEV MODE: Returning mock certifications data");
        
        // Create mock certifications data
        const mockCertifications = [
          {
            id: 1,
            name: "AWS Certified Solutions Architect",
            provider: "Amazon Web Services",
            issueDate: "2023-01-15",
            expiryDate: "2026-01-15",
            credentialId: "AWS-12345",
            credentialUrl: "https://aws.amazon.com/verification",
            skills: ["AWS", "Cloud Architecture", "Security"],
            status: "active",
            description: "Professional level certification for designing distributed systems on AWS",
            userId: 999,
            createdAt: "2023-01-20T12:00:00Z",
            updatedAt: "2023-01-20T12:00:00Z"
          },
          {
            id: 2,
            name: "Microsoft Azure Fundamentals",
            provider: "Microsoft",
            issueDate: "2022-08-10",
            expiryDate: "2025-08-10",
            credentialId: "MS-67890",
            credentialUrl: "https://learn.microsoft.com/certifications",
            skills: ["Azure", "Cloud Computing", "IaaS"],
            status: "active",
            description: "Entry-level certification demonstrating foundation knowledge of cloud services on Azure",
            userId: 999,
            createdAt: "2022-08-15T10:00:00Z",
            updatedAt: "2022-08-15T10:00:00Z"
          },
          {
            id: 3,
            name: "Google Professional Cloud Architect",
            provider: "Google Cloud",
            issueDate: "2023-04-05",
            expiryDate: null,
            credentialId: "GCP-24680",
            credentialUrl: "https://cloud.google.com/certification/cloud-architect",
            skills: ["GCP", "Cloud Architecture", "Kubernetes"],
            status: "in-progress",
            description: "Advanced certification for designing and managing GCP infrastructure",
            userId: 999,
            createdAt: "2023-04-10T15:30:00Z",
            updatedAt: "2023-04-10T15:30:00Z"
          }
        ];
        
        // Use type assertion to convert to generic type T
        return mockCertifications as any as T;
      }
    }
    
    // For non-dev mode or endpoints that we're not mocking
    // Create headers object
    const headers: Record<string, string> = {};
    
    // Check if user is logged out from localStorage
    const isLoggedOut = localStorage.getItem('auth-logout') === 'true';
    if (isLoggedOut) {
      headers["X-Auth-Logout"] = "true";
    }
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers
      });
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
  
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };
}

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