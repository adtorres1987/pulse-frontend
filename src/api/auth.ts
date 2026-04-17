import axiosInstance from './axiosInstance'
import type { AuthLoginResponse, UserProfile } from '../types'

export async function login(email: string, password: string) {
  const res = await axiosInstance.post<{ success: true; data: AuthLoginResponse }>('/auth/login', {
    email,
    password,
  })
  return res.data.data
}

export async function register(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  timezone: string
  language?: 'es' | 'en'
}) {
  const res = await axiosInstance.post<{ success: true; data: UserProfile }>('/auth/register', payload)
  return res.data.data
}

// Called by the 401 interceptor — invalidates the old token and returns a new one
export async function refreshToken(currentToken: string) {
  const res = await axiosInstance.post<{ success: true; data: { token: string } }>(
    '/auth/refresh',
    {},
    { headers: { Authorization: `Bearer ${currentToken}` } },
  )
  return res.data.data.token
}

// Blacklists the current token on the backend (Redis TTL = remaining expiry)
export async function logoutApi() {
  await axiosInstance.post('/auth/logout')
}

export async function forgotPassword(email: string) {
  await axiosInstance.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string) {
  await axiosInstance.post('/auth/reset-password', { token, password })
}
