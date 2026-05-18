import axiosInstance from './axiosInstance'
import type { Subscription, SubscriptionPlan } from '../types'

export async function getMySubscription(): Promise<Subscription | null> {
  try {
    const res = await axiosInstance.get<{ success: true; data: Subscription | null }>('/subscriptions/me')
    return res.data.data
  } catch (err: unknown) {
    if ((err as { response?: { status: number } }).response?.status === 404) return null
    throw err
  }
}

export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const res = await axiosInstance.get<{ success: true; data: SubscriptionPlan[] }>('/plans')
  return res.data.data
}

export async function createCheckoutSession(planId: string): Promise<string> {
  try {
    const res = await axiosInstance.post<{ success: true; data: { checkoutUrl: string } }>(
      '/subscriptions/checkout',
      { planId },
    )
    return res.data.data.checkoutUrl
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
    throw new Error(msg ?? 'Error al iniciar el pago')
  }
}
