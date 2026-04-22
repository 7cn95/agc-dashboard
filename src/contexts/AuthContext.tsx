'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  role: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('agc_token')
    const userData = localStorage.getItem('agc_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('agc_token')
        localStorage.removeItem('agc_user')
      }
    }
    setLoading(false)
  }, [])

  async function login(username: string, password: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'حدث خطأ' }
      }

      // Store token and user data
      localStorage.setItem('agc_token', data.token)
      localStorage.setItem('agc_user', JSON.stringify(data.user))
      setUser(data.user)
      
      return { success: true }
    } catch (err) {
      return { success: false, error: 'حدث خطأ أثناء الاتصال بالخادم' }
    }
  }

  function logout() {
    localStorage.removeItem('agc_token')
    localStorage.removeItem('agc_user')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
