import { api } from './client'
import type {
  WorkoutSessionResponseDto,
  LogSetDto,
  LogSingleSetDto,
  LogSetResponse,
  IncompleteSessionDto,
} from '@/types'

export type {
  WorkoutSessionResponseDto,
  LogSetDto,
  LogSingleSetDto,
  LogSetResponse,
  IncompleteSessionDto,
}

export async function getWorkoutsByDate(date: string, signal?: AbortSignal): Promise<WorkoutSessionResponseDto> {
  const res = await api.get<WorkoutSessionResponseDto>('/api/workouts', { query: { date }, signal })
  return res.data
}

export async function getActiveWorkout(signal?: AbortSignal): Promise<WorkoutSessionResponseDto> {
  const res = await api.get<WorkoutSessionResponseDto>('/api/workouts/active', { signal })
  return res.data
}

export async function getIncompleteWorkouts(signal?: AbortSignal): Promise<IncompleteSessionDto[]> {
  const res = await api.get<IncompleteSessionDto[]>('/api/workouts/incomplete', { signal })
  return res.data
}

export async function getWorkout(id: number, signal?: AbortSignal): Promise<WorkoutSessionResponseDto> {
  const res = await api.get<WorkoutSessionResponseDto>(`/api/workouts/${id}`, { signal })
  return res.data
}

export async function startWorkout(id: number): Promise<WorkoutSessionResponseDto> {
  const res = await api.patch<WorkoutSessionResponseDto>(`/api/workouts/${id}/start`)
  return res.data
}

export async function finishWorkout(id: number): Promise<WorkoutSessionResponseDto> {
  const res = await api.patch<WorkoutSessionResponseDto>(`/api/workouts/${id}/finish`)
  return res.data
}

export async function reopenWorkout(id: number): Promise<WorkoutSessionResponseDto> {
  const res = await api.patch<WorkoutSessionResponseDto>(`/api/workouts/${id}/reopen`)
  return res.data
}

export async function logSet(dto: LogSetDto): Promise<LogSetResponse> {
  const res = await api.post<LogSetResponse>('/api/workouts/sets', { body: dto })
  return res.data
}

export async function updateSet(setId: number, dto: LogSingleSetDto): Promise<WorkoutSessionResponseDto> {
  const res = await api.put<WorkoutSessionResponseDto>(`/api/workouts/sets/${setId}`, { body: dto })
  return res.data
}

export async function deleteSet(setId: number): Promise<WorkoutSessionResponseDto> {
  const res = await api.delete<WorkoutSessionResponseDto>(`/api/workouts/sets/${setId}`)
  return res.data
}

export async function getWorkoutStatus(date: string, signal?: AbortSignal): Promise<{ status: string }> {
  const res = await api.get<{ status: string }>('/api/workout-status', { query: { date }, signal })
  return res.data
}
