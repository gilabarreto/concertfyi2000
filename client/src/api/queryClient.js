import { QueryClient } from '@tanstack/react-query';

// every query in queries.js sets its own staleTime/gcTime; only the retry budget is shared
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});