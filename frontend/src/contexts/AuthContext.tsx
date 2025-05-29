import { userService } from '@/services/userService'
import type { paths } from '@/types/openapi'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type User = paths["/auth/users/me/"]["get"]["responses"]["200"]["content"]["application/json"]

type AuthContextType = {
  isLoggedIn: boolean
  token: string | null
  currentUser: User | null
  login: (token: string) => void
  logout: () => void
  isAuthLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  const { data: currentUserData } = useQuery<User | undefined>({
        queryKey: ["currentUser", token],
        queryFn: () => userService.getCurrentUser(token),
        staleTime: 5 * 60 * 1000,
        enabled: !!token,
    })

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) setToken(storedToken)
    else setInitialLoading(false) 
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setInitialLoading(false)
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setInitialLoading(false)
  }

  const isLoggedIn = !!token && !!currentUserData
  const isAuthLoading = initialLoading

  const contextValue: AuthContextType = {
    isLoggedIn,
    token,
    currentUser: currentUserData ?? null,
    login,
    logout,
    isAuthLoading
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}