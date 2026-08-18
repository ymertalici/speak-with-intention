"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, makeTrpcLinks, setAuthTokenAccessor } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 1000 * 30 } } }), []);

  // Keep the token accessor fresh for tRPC batch requests.
  useMemo(() => {
    setAuthTokenAccessor(() => {
      // NextAuth session token is HTTP-only; protected routes read the session
      // server-side, so no bearer token is required from the browser.
      return null;
    });
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpc.createClient({ links: makeTrpcLinks() })} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <Toaster richColors position="top-right" />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
