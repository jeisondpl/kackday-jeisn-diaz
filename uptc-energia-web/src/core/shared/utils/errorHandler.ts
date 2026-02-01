import type { AxiosError } from 'axios';
import type { ApiError } from '../types/api.types.ts';

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiValidationError';
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  if (error instanceof ApiValidationError) {
    return `Error de validación: ${error.message}`;
  }

  if (error instanceof DomainError) {
    return error.message;
  }

  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'Ha ocurrido un error inesperado';
}
