import { z } from 'zod'

// --- Auth ---
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  timezone: z.string().min(1, 'Requerido'),
  language: z.enum(['es', 'en']).optional(),
})
export type RegisterForm = z.infer<typeof registerSchema>

// --- Me ---
export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  country: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})
export type UpdateProfileForm = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
})
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>

// --- Categories ---
export const categorySchema = z.object({
  name: z.string().min(1, 'Requerido'),
  icon: z.string().optional(),
  type: z.enum(['expense', 'income']),
})
export type CategoryForm = z.infer<typeof categorySchema>

// --- Transactions ---
export const transactionSchema = z.object({
  amount: z.number().positive('Debe ser positivo'),
  type: z.enum(['expense', 'income']),
  occurredAt: z.string().min(1, 'Requerido'),
  emotionTag: z.enum(['need', 'impulse', 'emotional']).optional(),
  note: z.string().optional(),
  categoryId: z.string().uuid().optional().or(z.literal('')),
})
export type TransactionForm = z.infer<typeof transactionSchema>

// --- Snapshots ---
export const snapshotSchema = z.object({
  mood: z.enum(['calm', 'stressed', 'confident', 'neutral']).optional(),
  reflection: z.string().optional(),
  consciousScore: z.number().int().min(1).max(10).optional(),
})
export type SnapshotForm = z.infer<typeof snapshotSchema>

// --- Saving Goals ---
export const savingGoalSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  targetAmount: z.number().positive('Debe ser positivo'),
  targetDate: z.string().optional(),
})
export type SavingGoalForm = z.infer<typeof savingGoalSchema>

export const depositSchema = z.object({
  amount: z.number().positive('Debe ser positivo'),
})
export type DepositForm = z.infer<typeof depositSchema>

// --- Habits ---
export const habitSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  frequency: z.enum(['daily', 'weekly']),
})
export type HabitForm = z.infer<typeof habitSchema>

// --- Investment Profiles ---
export const investmentProfileSchema = z.object({
  strategy: z.enum(['conservative', 'balanced', 'long_term']),
  monthlyAmount: z.number().positive('Debe ser positivo'),
  expectedReturn: z.number().min(0).max(100),
})
export type InvestmentProfileForm = z.infer<typeof investmentProfileSchema>
