import axiosInstance from './axiosInstance'
import type { AdminUser, AdminUserFilters, UpdateAdminUserData, PaginatedResponse } from '../types'

interface BackendPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export async function listClientUsers(params: AdminUserFilters = {}): Promise<PaginatedResponse<AdminUser>> {
  const res = await axiosInstance.get<{ success: true; data: BackendPaginatedResponse<AdminUser> }>(
    '/admin/users',
    { params },
  )
  const { data: users, total, page, limit } = res.data.data
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) }
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

export async function resetClientUserPassword(id: string, newPassword: string, confirmPassword: string) {
  await axiosInstance.patch(`/admin/users/${id}/password`, { newPassword, confirmPassword })
}
