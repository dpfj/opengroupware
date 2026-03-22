"use client"
// src/components/layout/Providers.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools }               from "@tanstack/react-query-devtools"
import { Toaster }                          from "sonner"
import { useState }                         from "react"
import { SSEProvider }                      from "@/components/realtime/SSEProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:          60_000,      // 1분
            retry:              2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SSEProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </SSEProvider>
    </QueryClientProvider>
  )
}
