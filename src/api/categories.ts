import axiosInstance from './axiosInstance'
import type { Category, TransactionType } from '../types'

export async function getCategories() {
  const res = await axiosInstance.get<{ success: true; data: Category[] }>('/categories')
  return res.data.data
}

export async function getCategory(id: string) {
  const res = await axiosInstance.get<{ success: true; data: Category }>(`/categories/${id}`)
  return res.data.data
}

export async function createCategory(payload: { name: string; icon?: string; type: TransactionType }) {
  const res = await axiosInstance.post<{ success: true; data: Category }>('/categories', payload)
  return res.data.data
}

export async function updateCategory(id: string, payload: { name?: string; icon?: string; type?: TransactionType }) {
  const res = await axiosInstance.patch<{ success: true; data: Category }>(`/categories/${id}`, payload)
  return res.data.data
}

export async function deleteCategory(id: string) {
  await axiosInstance.delete(`/categories/${id}`)
}
