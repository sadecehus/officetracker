"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"

interface AuthContextType {
  user: any | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = apiClient.isAuthenticated()
      const currentUser = apiClient.getCurrentUser()
      
      setIsAuthenticated(authenticated)
      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()

    // Her 5 dakikada bir auth durumunu kontrol et
    const authCheckInterval = setInterval(() => {
      const authenticated = apiClient.isAuthenticated()
      if (!authenticated && isAuthenticated) {
        // Session süresi dolmuş
        logout()
      }
    }, 5 * 60 * 1000) // 5 dakika

    return () => clearInterval(authCheckInterval)
  }, []) // Dependency array'i boş bırakıyoruz

  const logout = () => {
    apiClient.logout()
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = "/"
  }

  // Login sonrası auth durumunu güncelleme fonksiyonu
  const refreshAuth = () => {
    const authenticated = apiClient.isAuthenticated()
    const currentUser = apiClient.getCurrentUser()
    setIsAuthenticated(authenticated)
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
