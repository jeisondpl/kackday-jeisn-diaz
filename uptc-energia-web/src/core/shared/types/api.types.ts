export interface ApiResponse<T> {
  count: number;
  total?: number;
  limit?: number;
  offset?: number;
  data: T;
}

export interface ApiError {
  error: string;
  message: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
