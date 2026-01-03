'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User } from './api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    const response = await api.login(email, password)
    setUser(response.user)
  }

  const handleLogout = async () => {
    await api.logout()
    setUser(null)
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const contextValue = {
    user: user,
    loading: loading,
    login: handleLogin,
    logout: handleLogout,
    refreshUser: refreshUser
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