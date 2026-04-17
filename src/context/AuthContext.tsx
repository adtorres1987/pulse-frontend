import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, logoutApi } from '../api/auth'
import { getMe } from '../api/me'
import type { AuthUser, UserProfile } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser)
      setUser({ ...parsed, role: parsed.role ?? 'user' })
      getMe()
        .then(setProfile)
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password)
    const user: AuthUser = { ...data.user, role: ((data.user.role as string | null) ?? 'user') as AuthUser['role'] }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    const me = await getMe()
    setProfile(me)
  }

  function logout() {
    // Fire-and-forget: blacklist the token on the backend.
    // State is cleared immediately so the UI doesn't wait on the network.
    logoutApi().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    const me = await getMe()
    setProfile(me)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isAuthenticated: !!user, isLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
