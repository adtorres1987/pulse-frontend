import axiosInstance from './axiosInstance'
import type { DailySnapshot, Mood } from '../types'

export interface PaginatedSnapshots {
  items: DailySnapshot[]
  total: number
  page: number
  limit: number
}

export async function getSnapshots(page = 1, limit = 20): Promise<PaginatedSnapshots> {
  const res = await axiosInstance.get<{ success: true; data: PaginatedSnapshots }>('/snapshots', {
    params: { page, limit },
  })
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
