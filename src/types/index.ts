// --- API envelope ---
export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
}

export interface ApiValidationError {
  success: false
  errors: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError | ApiValidationError

// --- Enums ---
export type Language = 'es' | 'en'
export type Mood = 'calm' | 'stressed' | 'confident' | 'neutral'
export type TransactionType = 'expense' | 'income'
export type EmotionTag = 'need' | 'impulse' | 'emotional'
export type HabitFrequency = 'daily' | 'weekly'
export type InvestmentStrategy = 'conservative' | 'balanced' | 'long_term'

// --- Auth ---
export interface AuthUser {
  id: string
  email: string
  language: Language
  timezone: string
}

export interface AuthLoginResponse {
  token: string
  user: AuthUser
}

// --- Me (profile) ---
export interface UserProfile {
  id: string
  email: string
  language: Language
  timezone: string
  onboardingCompleted: boolean
  createdAt: string
  person: {
    firstName: string
    lastName: string
    phone: string | null
    birthDate: string | null
    country: string | null
    avatarUrl: string | null
  } | null
}

// --- Categories ---
export interface Category {
  id: string
  name: string
  icon: string | null
  type: TransactionType
  isSystem: boolean
}

// --- Transactions ---
export interface Transaction {
  id: string
  amount: string
  type: TransactionType
  emotionTag: EmotionTag | null
  note: string | null
  occurredAt: string
  createdAt: string
  category: {
    id: string
    name: string
    icon: string | null
  } | null
}

// --- Daily Snapshots ---
export interface DailySnapshot {
  id: string
  date: string
  mood: Mood | null
  reflection: string | null
  consciousScore: number | null
  createdAt: string
}

// --- Saving Goals ---
export interface SavingGoal {
  id: string
  name: string
  targetAmount: string
  currentAmount: string
  targetDate: string | null
  createdAt: string
}

// --- Habits ---
export interface Habit {
  id: string
  name: string
  frequency: HabitFrequency
  active: boolean
  createdAt: string
}

export interface HabitLog {
  id: string
  date: string
  completed: boolean
  createdAt: string
}

// --- Investment Profiles ---
export interface InvestmentProfile {
  id: string
  strategy: InvestmentStrategy
  monthlyAmount: string
  expectedReturn: string
  createdAt: string
}
