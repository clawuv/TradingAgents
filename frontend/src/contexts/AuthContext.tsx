// 设计提醒：权限上下文是后台安全感的核心，登录态、角色权限和后台接口要真正打通。
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearStoredAuthToken,
  getApiErrorMessage,
  getCurrentUser,
  getStoredAuthToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setStoredAuthToken,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from '@/services/api'
import { mockRoles, type PermissionKey, type RoleKey } from '@/mock/permission'

export type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  currentUser: AuthUser | null
  currentRole: RoleKey
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<void>
  roleInfo: (typeof mockRoles)[number]
  permissions: PermissionKey[]
  can: (permission: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function resolveRole(role: string | undefined): RoleKey {
  if (role === 'super_admin' || role === 'risk_manager' || role === 'finance_operator' || role === 'auditor') {
    return role
  }
  return 'auditor'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCurrentUser = async () => {
    const token = getStoredAuthToken()
    if (!token) {
      setCurrentUser(null)
      return
    }
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch {
      clearStoredAuthToken()
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setIsLoading(true)
      await refreshCurrentUser()
      if (!cancelled) {
        setIsLoading(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const currentRole = resolveRole(currentUser?.role)
    const roleInfo = mockRoles.find((role) => role.key === currentRole) ?? mockRoles[mockRoles.length - 1]

    return {
      isAuthenticated: currentUser != null,
      isLoading,
      currentUser,
      currentRole,
      login: async (payload) => {
        const response = await loginRequest(payload)
        setStoredAuthToken(response.access_token)
        setCurrentUser(response.user)
      },
      register: async (payload) => {
        const response = await registerRequest(payload)
        setStoredAuthToken(response.access_token)
        setCurrentUser(response.user)
      },
      logout: async () => {
        try {
          if (getStoredAuthToken()) {
            await logoutRequest()
          }
        } catch (error) {
          console.warn(getApiErrorMessage(error))
        } finally {
          clearStoredAuthToken()
          setCurrentUser(null)
        }
      },
      refreshCurrentUser,
      roleInfo,
      permissions: roleInfo.permissions,
      can: (permission) => roleInfo.permissions.includes(permission),
    }
  }, [currentUser, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
