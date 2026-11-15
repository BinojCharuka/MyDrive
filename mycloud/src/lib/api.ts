import { supabase } from './supabase';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Perform authenticated request to backend API
 */
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || 'demo-token';

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    // If relative request failed, and we're in browser with non-3001 port, try direct port 3001 fallback
    if (typeof window !== 'undefined' && window.location.port !== '3001' && !endpoint.startsWith('http')) {
      const directUrl = `${window.location.protocol}//${window.location.hostname}:3001${endpoint}`;
      response = await fetch(directUrl, {
        ...options,
        headers,
      });
    } else {
      throw networkErr;
    }
  }

  // If Vite dev/preview proxy returned 404 for an /api route, try direct backend port 3001 fallback
  if (response.status === 404 && typeof window !== 'undefined' && window.location.port !== '3001' && !endpoint.startsWith('http')) {
    try {
      const directUrl = `${window.location.protocol}//${window.location.hostname}:3001${endpoint}`;
      const directRes = await fetch(directUrl, {
        ...options,
        headers,
      });
      if (directRes.ok) {
        response = directRes;
      }
    } catch {
      // Keep original response if direct call also failed
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const result = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (typeof result === 'object' && result?.message) || result?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, result);
  }

  return result as T;
};

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

