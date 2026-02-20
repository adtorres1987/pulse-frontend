import axiosInstance from './axiosInstance'
import type { UserProfile } from '../types'

export async function getMe() {
  const res = await axiosInstance.get<{ success: true; data: UserProfile }>('/me')
  return res.data.data
}

export async function updateMe(payload: {
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  country?: string
  avatarUrl?: string
}) {
  const res = await axiosInstance.patch<{ success: true; data: UserProfile }>('/me', payload)
  return res.data.data
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await axiosInstance.patch('/me/password', { currentPassword, newPassword })
}
