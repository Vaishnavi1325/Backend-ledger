"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
export function QueryProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 30, // 30 seconds fresh
                refetchOnWindowFocus: true,
                retry: 1,
            },
        },
    }));
    return (<QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>);
}
