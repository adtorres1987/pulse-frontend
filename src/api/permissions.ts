import axiosInstance from './axiosInstance'
import type { Permission } from '../types'

export async function getPermissions(): Promise<Permission[]> {
  const res = await axiosInstance.get('/permissions')
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
