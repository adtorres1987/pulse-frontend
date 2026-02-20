import axiosInstance from './axiosInstance'
import type { SavingGoal } from '../types'

export async function getSavingGoals() {
  const res = await axiosInstance.get<{ success: true; data: SavingGoal[] }>('/saving-goals')
  return res.data.data
}

export async function getSavingGoal(id: string) {
  const res = await axiosInstance.get<{ success: true; data: SavingGoal }>(`/saving-goals/${id}`)
  return res.data.data
}

export async function createSavingGoal(payload: {
  name: string
  targetAmount: number
  targetDate?: string
}) {
  const res = await axiosInstance.post<{ success: true; data: SavingGoal }>('/saving-goals', payload)
  return res.data.data
}

export async function updateSavingGoal(
  id: string,
  payload: { name?: string; targetAmount?: number; targetDate?: string }
) {
  const res = await axiosInstance.patch<{ success: true; data: SavingGoal }>(`/saving-goals/${id}`, payload)
  return res.data.data
}

export async function depositToGoal(id: string, amount: number) {
  const res = await axiosInstance.patch<{ success: true; data: SavingGoal }>(
    `/saving-goals/${id}/deposit`,
    { amount }
  )
  return res.data.data
}

export async function deleteSavingGoal(id: string) {
  await axiosInstance.delete(`/saving-goals/${id}`)
}
