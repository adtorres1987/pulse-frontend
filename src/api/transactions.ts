import axiosInstance from './axiosInstance'
import type { Transaction, TransactionType, EmotionTag } from '../types'

export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  emotionTag?: EmotionTag
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  limit: number
}

export async function getTransactions(filters?: TransactionFilters): Promise<PaginatedTransactions> {
  const res = await axiosInstance.get<{ success: true; data: PaginatedTransactions }>('/transactions', {
    params: filters,
  })
  return res.data.data
}

export async function getTransaction(id: string) {
  const res = await axiosInstance.get<{ success: true; data: Transaction }>(`/transactions/${id}`)
  return res.data.data
}

export async function createTransaction(payload: {
  amount: number
  type: TransactionType
  occurredAt: string
  emotionTag?: EmotionTag
  note?: string
  categoryId?: string
}) {
  const res = await axiosInstance.post<{ success: true; data: Transaction }>('/transactions', payload)
  return res.data.data
}

export async function updateTransaction(
  id: string,
  payload: {
    amount?: number
    type?: TransactionType
    occurredAt?: string
    emotionTag?: EmotionTag
    note?: string
    categoryId?: string
  }
) {
  const res = await axiosInstance.patch<{ success: true; data: Transaction }>(`/transactions/${id}`, payload)
  return res.data.data
}

export async function deleteTransaction(id: string) {
  await axiosInstance.delete(`/transactions/${id}`)
}
