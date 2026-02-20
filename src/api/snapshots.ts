import axiosInstance from './axiosInstance'
import type { DailySnapshot, Mood } from '../types'

export async function getSnapshots() {
  const res = await axiosInstance.get<{ success: true; data: DailySnapshot[] }>('/snapshots')
  return res.data.data
}

export async function getTodaySnapshot() {
  const res = await axiosInstance.get<{ success: true; data: DailySnapshot | null }>('/snapshots/today')
  return res.data.data
}

export async function createSnapshot(payload: {
  mood?: Mood
  reflection?: string
  consciousScore?: number
}) {
  const res = await axiosInstance.post<{ success: true; data: DailySnapshot }>('/snapshots', payload)
  return res.data.data
}

export async function updateTodaySnapshot(payload: {
  mood?: Mood
  reflection?: string
  consciousScore?: number
}) {
  const res = await axiosInstance.patch<{ success: true; data: DailySnapshot }>('/snapshots/today', payload)
  return res.data.data
}
