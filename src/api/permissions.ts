import axiosInstance from './axiosInstance'
import type { Permission } from '../types'

export interface PaginatedPermissions {
  items: Permission[]
  total: number
  page: number
  limit: number
}

export async function getPermissions(page = 1, limit = 20): Promise<PaginatedPermissions> {
  const res = await axiosInstance.get<{ success: true; data: PaginatedPermissions }>('/permissions', {
    params: { page, limit },
  })
  return res.data.data
}

export async function createPermission(data: { action: string; description?: string }): Promise<Permission> {
  const res = await axiosInstance.post('/permissions', data)
  return res.data.data
}

export async function updatePermission(id: string, data: { action?: string; description?: string }): Promise<Permission> {
  const res = await axiosInstance.patch(`/permissions/${id}`, data)
  return res.data.data
}

export async function deletePermission(id: string): Promise<void> {
  await axiosInstance.delete(`/permissions/${id}`)
}
