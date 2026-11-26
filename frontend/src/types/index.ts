export interface AuthMe {
  authenticated: true
  id: number
  username: string
  email: string
  weight: number
  trainingExperience: string
}

export interface RegisterDto {
  username: string
  email: string
  password: string
  birthDate?: string | null
  currentWeight?: number | null
  height?: number | null
  gender?: string | null
  jobType?: string | null
  goal?: string | null
  weightUnit?: 'kg' | 'lbs' | null
  defaultWeightIncrement?: number | null
  defaultRestTimerSeconds?: number | null
}

export interface LoginDto {
  emailOrLogin: string
  password: string
}

export type AppRoute = 'home' | 'plans' | 'analysis' | 'settings'
