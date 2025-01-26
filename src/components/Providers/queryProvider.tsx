"use client";

import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2000 , // 5 minutes
            gcTime: 2000 , // 1 hour
            retry: 12,
          },
        },
      }),

    [],
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
