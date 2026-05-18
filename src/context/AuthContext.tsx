import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, logoutApi } from '../api/auth'
import { getMe } from '../api/me'
import { getMySubscription } from '../api/subscriptions'
import type { AuthUser, UserProfile, Subscription } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  profile: UserProfile | null
  subscription: Subscription | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function needsSubscriptionCheck(role: string | null | undefined) {
  return role === 'user'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser)
      const role = parsed.role ?? null
      setUser({ ...parsed, role })
      const subFetch = needsSubscriptionCheck(role) ? getMySubscription() : Promise.resolve(null)
      Promise.all([getMe(), subFetch])
        .then(([me, sub]) => {
          setProfile(me)
          setSubscription(sub)
        })
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
    const authUser: AuthUser = { ...data.user, role: data.user.role ?? null }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(authUser))
    setUser(authUser)
    const subFetch = needsSubscriptionCheck(authUser.role) ? getMySubscription() : Promise.resolve(null)
    const [me, sub] = await Promise.all([getMe(), subFetch])
    setProfile(me)
    setSubscription(sub)
  }

  function logout() {
    logoutApi().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setProfile(null)
    setSubscription(null)
  }

  async function refreshProfile() {
    const me = await getMe()
    setProfile(me)
  }

  async function refreshSubscription() {
    if (!needsSubscriptionCheck(user?.role)) return
    const sub = await getMySubscription()
    setSubscription(sub)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, subscription, isAuthenticated: !!user, isLoading, login, logout, refreshProfile, refreshSubscription }}
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
