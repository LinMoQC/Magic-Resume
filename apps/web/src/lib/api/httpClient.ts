import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_ORIGIN } from './routes';

// Mutable getter — set once by HttpClientProvider at app startup
let _getToken: (() => Promise<string | null>) | null = null;

export const configureHttpClient = (getter: () => Promise<string | null>) => {
  _getToken = getter;
};

/** Call directly when axios interceptor isn't available (e.g. raw fetch streams) */
export const getAuthToken = async (): Promise<string | null> => {
  if (!_getToken) return null;
  try {
    return await _getToken();
  } catch {
    return null;
  }
};

const createClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    if (!config.headers.Authorization) {
      const token = await getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Network Error:', error.message);
      } else {
        console.error('Request Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Both share the single backend origin; the gateway/nginx splits by path prefix.
// Two instances kept only for call-site semantics (CRUD vs agent).
export const httpClient = {
  api:   createClient(API_ORIGIN),
  agent: createClient(API_ORIGIN),
};

export interface ApiResponse<T> {
  data: T;
  code: number;
  message?: string;
}
