import axiosInstance from './axiosInstance'
import type { Role } from '../types'

export async function getRoles() {
  const res = await axiosInstance.get<{ success: true; data: Role[] }>('/roles')
  return res.data.data
}

export async function createRole(payload: { name: string; description?: string }) {
  const res = await axiosInstance.post<{ success: true; data: Role }>('/roles', payload)
  return res.data.data
}

export async function updateRole(id: string, payload: { description?: string }) {
  const res = await axiosInstance.patch<{ success: true; data: Role }>(`/roles/${id}`, payload)
  return res.data.data
}

export async function deleteRole(id: string) {
  await axiosInstance.delete(`/roles/${id}`)
}
