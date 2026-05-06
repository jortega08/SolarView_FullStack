import { createContext } from "react"
import type { ApiUser } from "@/types/api"
import type { RegisterConCodigoPayload, RegisterPayload } from "@/services/auth.service"

export interface AuthContextValue {
  user: ApiUser | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, contrasena: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  registerConCodigo: (payload: RegisterConCodigoPayload) => Promise<void>
  logout: () => void
  updateUser: (patch: Partial<ApiUser>) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
