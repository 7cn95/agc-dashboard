'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, User } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
  }

  async function login(username: string, password: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'اسم المستخدم غير صحيح' }
      }

      // Note: In production, use proper bcrypt comparison on backend
      // For now, we'll store password as-is (from MongoDB export)
      if (data.password !== password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' }
      }

      setUser(data)
      localStorage.setItem('currentUser', JSON.stringify(data))
      return { success: true }
    } catch (err) {
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' }
    }
  }

  async function logout() {
    setUser(null)
    localStorage.removeItem('currentUser')
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
