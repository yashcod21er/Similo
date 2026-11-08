import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

/**
 * When any request says "please sign in" (the session expired, or an admin
 * removed this person), mark the visitor as signed out. The route guard then
 * sends them to the sign-in page instead of showing a broken screen.
 */
function onUnauthenticated(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHENTICATED') {
    queryClient.setQueryData(['session'], null);
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onUnauthenticated }),
  mutationCache: new MutationCache({ onError: onUnauthenticated }),
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
