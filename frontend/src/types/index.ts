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

export type SessionStatus = 'planned' | 'in_progress' | 'completed'

export interface TemplateExercise {
  exerciseId: number
  exerciseName: string
  gifUrl?: string | null
  category: string
  order: number
}

export interface WorkoutTemplate {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  exercises: TemplateExercise[]
}

export interface CreateTemplateDto {
  name: string
  exerciseIds: number[]
}

export interface UpdateTemplateDto {
  name: string
  exerciseIds: number[]
}

export interface ExerciseSearchResult {
  id: number
  name: string
  gifUrl?: string | null
}

export interface ExerciseByBodyPart {
  id: number
  name: string
  category: string
  imageUrl?: string | null
  gifUrl?: string | null
  muscleMappings: { muscleGroupKey: string; weightPercentage: number }[]
}

export interface SessionSetDto {
  id: number
  setNumber: number
  weight: number
  reps: number
  rpe?: number | null
  setType: string
  durationSeconds?: number | null
}

export interface SessionExerciseDto {
  userExerciseId: number
  exerciseId: number
  exerciseName: string
  category: string
  gifUrl: string
  supersetGroupId?: string | null
  notes?: string | null
  sets: SessionSetDto[]
  setsCount?: number
  reps?: number
  weight?: number
  rpe?: number | null
  setType: string
  volume: number
}

export interface WorkoutSessionResponseDto {
  id: number
  userId: number
  date: string
  status: SessionStatus
  templateId?: number | null
  templateName?: string | null
  startMode: string
  totalVolume: number
  exerciseCount: number
  canLogSets: boolean
  canReopen: boolean
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
  exercises: SessionExerciseDto[]
}

export interface WorkoutTemplatesForStartDto {
  id: number
  name: string
  exerciseCount: number
  createdAt: string
}
