import { RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { I18nProvider } from "@/contexts/I18nContext"
import { router } from "@/routes/index"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: { fontFamily: "var(--font-sans)", fontSize: "13px" },
            }}
          />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
