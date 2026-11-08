import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network blips and server errors, but not 4xx responses:
      // retrying "forbidden" or "not found" never helps.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
