import axiosInstance from './axiosInstance'
import type { AppConfig } from '../types'

export async function getAppConfig(): Promise<AppConfig[]> {
  const res = await axiosInstance.get('/admin/app-config')
  return res.data.data
}

export async function updateAppConfig(key: string, value: string): Promise<AppConfig> {
  const res = await axiosInstance.patch(`/admin/app-config/${key}`, { value })
  return res.data.data
}
