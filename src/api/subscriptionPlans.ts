import axiosInstance from './axiosInstance'
import type { SubscriptionPlan } from '../types'
import type { SubscriptionPlanForm } from '../schemas'

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await axiosInstance.get('/admin/subscription-plans')
  return res.data.data
}

export async function createSubscriptionPlan(data: Omit<SubscriptionPlanForm, 'isActive'>): Promise<SubscriptionPlan> {
  const res = await axiosInstance.post('/admin/subscription-plans', data)
  return res.data.data
}

export async function updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlanForm>): Promise<SubscriptionPlan> {
  const res = await axiosInstance.patch(`/admin/subscription-plans/${id}`, data)
  return res.data.data
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/subscription-plans/${id}`)
}
