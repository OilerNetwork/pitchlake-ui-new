"use client";

import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = 
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: 5000,
          },
        },
      })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
