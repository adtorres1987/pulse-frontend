import axiosInstance from './axiosInstance'
import type { AdminUser, AdminUserFilters, UpdateAdminUserData } from '../types'

export async function listClientUsers(params: AdminUserFilters = {}): Promise<AdminUser[]> {
  const res = await axiosInstance.get<{ success: true; data: AdminUser[] }>(
    '/admin/users',
    { params },
  )
  return res.data.data
}

export async function getClientUser(id: string) {
  const res = await axiosInstance.get<{ success: true; data: AdminUser }>(`/admin/users/${id}`)
  return res.data.data
}

export async function updateClientUser(id: string, data: UpdateAdminUserData) {
  const res = await axiosInstance.patch<{ success: true; data: AdminUser }>(
    `/admin/users/${id}`,
    data,
  )
  return res.data.data
}

export async function resetClientUserPassword(id: string, newPassword: string, _confirmPassword?: string) {
  await axiosInstance.patch(`/admin/users/${id}/password`, { newPassword })
}
