import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { NetworkError } from '@core/shared/utils/errorHandler.ts';

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add trace ID for debugging
      config.headers['X-Trace-Id'] = crypto.randomUUID();

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        return Promise.reject(new NetworkError('No se pudo conectar con el servidor'));
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${error.response.status} ${error.config?.url}`, error.response.data);
      }

      return Promise.reject(error);
    }
  );
}
