import { apiRequest } from '@/lib/queryClient';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiRequest', () => {
    it('makes GET request successfully', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const response = await apiRequest('GET', '/api/test');
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      expect(data).toEqual(mockResponse);
    });

    it('makes POST request with data successfully', async () => {
      const requestData = { name: 'New Item' };
      const mockResponse = { id: 2, name: 'New Item' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const response = await apiRequest('POST', '/api/test', requestData);
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      expect(data).toEqual(mockResponse);
    });

    it('handles HTTP errors correctly', async () => {
      const errorResponse = { error: 'Not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue(errorResponse),
      });

      await expect(apiRequest('GET', '/api/nonexistent')).rejects.toThrow('Not found');

      expect(mockFetch).toHaveBeenCalledWith('/api/nonexistent', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    });

    it('handles malformed error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(apiRequest('GET', '/api/error')).rejects.toThrow('HTTP 500');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Network error');
    });

    it('makes PUT request correctly', async () => {
      const updateData = { id: 1, name: 'Updated Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(updateData),
      });

      await apiRequest('PUT', '/api/test/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
    });

    it('makes DELETE request correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await apiRequest('DELETE', '/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    });

    it('handles different error message formats', async () => {
      // Test error.message format
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ message: 'Validation failed' }),
      });

      await expect(apiRequest('POST', '/api/test')).rejects.toThrow('Validation failed');

      // Test error.error format
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      });

      await expect(apiRequest('POST', '/api/test')).rejects.toThrow('Unauthorized');

      // Test no error message
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(apiRequest('POST', '/api/test')).rejects.toThrow('HTTP 403');
    });
  });
});
