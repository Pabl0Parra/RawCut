import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // React Native doesn't have window focus events
            refetchOnWindowFocus: false,
            // Popular/Discover data — 5 min stale
            staleTime: 5 * 60 * 1000,
            // Keep inactive cache for 20 min
            gcTime: 20 * 60 * 1000,
            // TMDB is reliable — 2 retries
            retry: 2,
        },
    },
});
