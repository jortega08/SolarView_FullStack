import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { I18nProvider } from "@/contexts/I18nContext"
import { router } from "@/routes/index"
import { queryClient } from "@/lib/queryClient"

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
