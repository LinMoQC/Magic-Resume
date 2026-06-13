export type ApiResponse<T> = {
  data: T;
  code: number;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
};
