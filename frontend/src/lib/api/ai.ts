import { api, type ApiError } from './client'

export interface SuggestedSet {
  weight: number
  reps: number
  rpe?: number | null
}

export interface ExerciseMatch {
  dbId: number
  name: string
  category: string
  confidence: number
  suggestedSets: SuggestedSet[]
  gifUrl?: string | null
  nameLocalized?: string | null
}

export interface ResolveExercisesResponse {
  matches: ExerciseMatch[]
  unmatched: string[]
}

export interface ResolveExercisesRequest {
  text: string
  domain?: string
}

export interface RateLimitError extends ApiError {
  status: 429
  retryAfter: number
}

export async function resolveExercises(
  request: ResolveExercisesRequest,
  signal?: AbortSignal
): Promise<ResolveExercisesResponse> {
  const res = await api.post<ResolveExercisesResponse>('/api/ai/resolve-exercises', {
    body: request,
    signal,
  })
  return res.data
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    error instanceof Error &&
    'status' in error &&
    (error as ApiError).status === 429
  )
}

export function getRetryAfter(error: RateLimitError): number {
  return (error as RateLimitError).retryAfter ?? 60
}