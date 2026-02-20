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
