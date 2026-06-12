import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Common HTTP client configuration
 */
const createHttpClient = (
  baseURL: string, 
  getToken?: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token if available
  client.interceptors.request.use(
    async (config) => {
      // If a token getter is provided and no Authorization header exists, try to get token
      if (getToken && !config.headers.Authorization) {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get token:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle common errors
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle common errors globally
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network Error:', error.message);
      } else {
        // Something else happened
        console.error('Request Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Pre-configured HTTP clients for different services
 * Note: Token callback can be set via configureHttpClient()
 */
export const httpClient = {
  // Main API (NestJS backend for resumes, users, feedback, notifications, etc.)
  api: createHttpClient(process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111'),
  
  // Agent API (Python backend for AI interview)
  agent: createHttpClient(process.env.BACKEND_URL || 'http://localhost:8000'),
};

/**
 * Configure HTTP clients with a token getter function
 * Call this once during app initialization
 * 
 * @example
 * import { auth } from '@clerk/nextjs/server';
 * 
 * // In a server component or API route:
 * configureHttpClient(async () => {
 *   const { getToken } = await auth();
 *   return getToken();
 * });
 */
export const configureHttpClient = (getToken: () => Promise<string | null>) => {
  httpClient.api = createHttpClient(
    process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111',
    getToken
  );
  httpClient.agent = createHttpClient(
    process.env.BACKEND_URL || 'http://localhost:8000',
    getToken
  );
};

/**
 * Helper function to create authenticated request config
 */
export const withAuth = (token: string, config?: AxiosRequestConfig): AxiosRequestConfig => {
  return {
    ...config,
    headers: {
      ...config?.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  code: number;
  message?: string;
}

/**
 * Helper to extract data from API response
 */
export const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  return response.data.data;
};
