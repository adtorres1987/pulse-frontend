import axiosInstance from './axiosInstance'
import type { InvestmentProfile, InvestmentStrategy } from '../types'

export async function getInvestmentProfiles() {
  const res = await axiosInstance.get<{ success: true; data: InvestmentProfile[] }>('/investment-profiles')
  return res.data.data
}

export async function getInvestmentProfile(id: string) {
  const res = await axiosInstance.get<{ success: true; data: InvestmentProfile }>(`/investment-profiles/${id}`)
  return res.data.data
}

export async function createInvestmentProfile(payload: {
  strategy: InvestmentStrategy
  monthlyAmount: number
  expectedReturn: number
}) {
  const res = await axiosInstance.post<{ success: true; data: InvestmentProfile }>('/investment-profiles', payload)
  return res.data.data
}

export async function updateInvestmentProfile(
  id: string,
  payload: { strategy?: InvestmentStrategy; monthlyAmount?: number; expectedReturn?: number }
) {
  const res = await axiosInstance.patch<{ success: true; data: InvestmentProfile }>(
    `/investment-profiles/${id}`,
    payload
  )
  return res.data.data
}

export async function deleteInvestmentProfile(id: string) {
  await axiosInstance.delete(`/investment-profiles/${id}`)
}
