// 设计提醒：权限上下文是后台安全感的核心，登录态、角色切换和菜单权限要形成完整的后台模板闭环。
import { createContext, useContext, useMemo, useState } from 'react'
import { mockRoles, type PermissionKey, type RoleKey } from '@/mock/permission'

export type AuthContextValue = {
  isAuthenticated: boolean
  currentRole: RoleKey
  setCurrentRole: (role: RoleKey) => void
  login: (role?: RoleKey) => void
  logout: () => void
  roleInfo: (typeof mockRoles)[number]
  permissions: PermissionKey[]
  can: (permission: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [currentRole, setCurrentRole] = useState<RoleKey>('super_admin')

  const value = useMemo<AuthContextValue>(() => {
    const roleInfo = mockRoles.find((role) => role.key === currentRole) ?? mockRoles[0]
    return {
      isAuthenticated,
      currentRole,
      setCurrentRole,
      login: (role = currentRole) => {
        setCurrentRole(role)
        setIsAuthenticated(true)
      },
      logout: () => setIsAuthenticated(false),
      roleInfo,
      permissions: roleInfo.permissions,
      can: (permission) => roleInfo.permissions.includes(permission),
    }
  }, [currentRole, isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
