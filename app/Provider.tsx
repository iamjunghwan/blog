"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000 * 15,
        gcTime: 1000 * 60 * 15,
      },
    },
  });
}

const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <main style={{ marginBottom: "auto" }}>{children}</main>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
export default Provider;
