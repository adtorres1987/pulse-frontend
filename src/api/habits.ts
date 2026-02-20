import axiosInstance from './axiosInstance'
import type { Habit, HabitLog, HabitFrequency } from '../types'

export async function getHabits(active?: boolean) {
  const res = await axiosInstance.get<{ success: true; data: Habit[] }>('/habits', {
    params: active !== undefined ? { active: String(active) } : undefined,
  })
  return res.data.data
}

export async function getHabit(id: string) {
  const res = await axiosInstance.get<{ success: true; data: Habit }>(`/habits/${id}`)
  return res.data.data
}

export async function createHabit(payload: { name: string; frequency: HabitFrequency }) {
  const res = await axiosInstance.post<{ success: true; data: Habit }>('/habits', payload)
  return res.data.data
}

export async function updateHabit(
  id: string,
  payload: { name?: string; frequency?: HabitFrequency; active?: boolean }
) {
  const res = await axiosInstance.patch<{ success: true; data: Habit }>(`/habits/${id}`, payload)
  return res.data.data
}

export async function deleteHabit(id: string) {
  await axiosInstance.delete(`/habits/${id}`)
}

export async function getHabitLogs(id: string) {
  const res = await axiosInstance.get<{ success: true; data: HabitLog[] }>(`/habits/${id}/logs`)
  return res.data.data
}

export async function logHabit(id: string, completed: boolean, date?: string) {
  const res = await axiosInstance.post<{ success: true; data: HabitLog }>(`/habits/${id}/logs`, {
    completed,
    ...(date ? { date } : {}),
  })
  return res.data.data
}
