import { adminEndpoints, endpoints } from '../config/api';
import { queryClient } from './queryClient';

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * AdminAPIClient 
 * 
 * A portable API client for admin operations that can be easily migrated
 * to external environments. Uses the fetch API for making HTTP requests.
 */
class AdminAPIClient {
  private readonly defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  /**
   * Makes an authenticated API request
   */
  private async request<T>(
    url: string, 
    method: string, 
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };
    
    // Create request object
    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies for session authentication
      signal: options.signal,
    };
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    // Make the request
    const response = await fetch(url, config);
    
    // Handle response
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorResponse = await response.json();
        errorMessage = errorResponse.message || errorResponse.error || '';
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText;
      }
      
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }
    
    // Return JSON response or empty object if no content
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json() as T;
  }

  // User Management
  
  /**
   * Get all users with pagination
   */
  async getUsers(page = 1, limit = 10, filters?: Record<string, any>) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return this.request<{
      users: any[];
      total: number;
      page: number;
      limit: number;
    }>(`${adminEndpoints.users}?${queryParams}`, 'GET');
  }
  
  /**
   * Get user details
   */
  async getUserDetails(userId: number) {
    return this.request<any>(adminEndpoints.userDetails(userId), 'GET');
  }
  
  /**
   * Create a staff account
   */
  async createStaffAccount(data: {
    email: string;
    name: string;
    password: string;
  }) {
    return this.request<any>(adminEndpoints.createStaff, 'POST', data);
  }
  
  /**
   * Update user role
   */
  async updateUserRole(userId: number, role: string) {
    return this.request<any>(adminEndpoints.updateUserRole(userId), 'PUT', { role });
  }
  
  /**
   * Get user statistics summary
   */
  async getUserStats() {
    return this.request<{
      totalUsers: number;
      activeUsers: number;
      premiumUsers: number;
      newUsersToday: number;
    }>(adminEndpoints.userStats, 'GET');
  }
  
  // System Management
  
  /**
   * Get system status
   */
  async getSystemStatus() {
    return this.request<{
      status: 'healthy' | 'degraded' | 'down';
      uptime: number;
      version: string;
      services: Record<string, {
        status: 'healthy' | 'degraded' | 'down';
        details?: string;
      }>;
    }>(adminEndpoints.systemStatus, 'GET');
  }
  
  /**
   * Get system configuration
   */
  async getSystemConfig() {
    return this.request<any>(adminEndpoints.systemConfig, 'GET');
  }
  
  /**
   * Update system configuration
   */
  async updateSystemConfig(config: Record<string, any>) {
    return this.request<any>(adminEndpoints.systemConfig, 'PUT', config);
  }
  
  // Analytics
  
  /**
   * Get user analytics
   */
  async getUserAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.request<any>(
      `${adminEndpoints.analytics.users}?timeframe=${timeframe}`, 
      'GET'
    );
  }
  
  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.request<any>(
      `${adminEndpoints.analytics.engagement}?timeframe=${timeframe}`, 
      'GET'
    );
  }
  
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.request<any>(
      `${adminEndpoints.analytics.revenue}?timeframe=${timeframe}`, 
      'GET'
    );
  }
  
  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.request<any>(
      `${adminEndpoints.analytics.subscriptions}?timeframe=${timeframe}`, 
      'GET'
    );
  }
  
  // Support Messages
  
  /**
   * Get support messages
   */
  async getSupportMessages(page = 1, limit = 10, status?: 'unread' | 'read' | 'archived') {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      queryParams.append('status', status);
    }
    
    return this.request<{
      messages: any[];
      total: number;
      page: number;
      limit: number;
    }>(`${adminEndpoints.supportMessages}?${queryParams}`, 'GET');
  }
  
  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number) {
    return this.request<any>(adminEndpoints.markMessageRead(messageId), 'PUT');
  }
  
  /**
   * Mark message as archived
   */
  async markMessageAsArchived(messageId: number) {
    return this.request<any>(adminEndpoints.markMessageArchived(messageId), 'PUT');
  }
  
  // Authentication
  
  /**
   * Login as admin
   */
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<any>(
      endpoints.login, 
      'POST', 
      { ...credentials, loginType: 'admin' }
    );
    
    // Update current user in query cache
    if (response.user) {
      queryClient.setQueryData([endpoints.currentUser], response.user);
    }
    
    return response;
  }
  
  /**
   * Logout
   */
  async logout() {
    const response = await this.request<void>(endpoints.logout, 'POST');
    
    // Clear current user from query cache
    queryClient.setQueryData([endpoints.currentUser], null);
    
    return response;
  }
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.request<any>(endpoints.currentUser, 'GET');
  }
}

// Create a singleton instance
export const adminApiClient = new AdminAPIClient();

export default adminApiClient;