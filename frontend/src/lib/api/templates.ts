import { api } from './client'
import type { WorkoutTemplate, CreateTemplateDto, UpdateTemplateDto, ExerciseSearchResult, ExerciseByBodyPart, TemplateExercise } from '@/types'

export type { WorkoutTemplate, CreateTemplateDto, UpdateTemplateDto, ExerciseSearchResult, ExerciseByBodyPart, TemplateExercise }

export async function getTemplates(signal?: AbortSignal): Promise<WorkoutTemplate[]> {
  return api.get<WorkoutTemplate[]>('/api/templates', { signal })
}

export async function getTemplate(id: number, signal?: AbortSignal): Promise<WorkoutTemplate> {
  return api.get<WorkoutTemplate>(`/api/templates/${id}`, { signal })
}

export async function createTemplate(dto: CreateTemplateDto): Promise<WorkoutTemplate> {
  return api.post<WorkoutTemplate>('/api/templates', { body: dto })
}

export async function updateTemplate(id: number, dto: UpdateTemplateDto): Promise<WorkoutTemplate> {
  return api.put<WorkoutTemplate>(`/api/templates/${id}`, { body: dto })
}

export async function deleteTemplate(id: number, signal?: AbortSignal): Promise<void> {
  return api.delete<void>(`/api/templates/${id}`, { signal })
}

export async function searchExercises(
  term: string,
  offset = 0,
  limit = 50,
  signal?: AbortSignal
): Promise<ExerciseSearchResult[]> {
  return api.get<ExerciseSearchResult[]>(`/api/exercisedb/exercise/search/${encodeURIComponent(term)}`, {
    query: { offset, limit },
    signal,
  })
}

export async function getExerciseCategories(signal?: AbortSignal): Promise<string[]> {
  return api.get<string[]>('/api/exercisedb/exercise/categories', { signal })
}

export async function getExercisesByBodyPart(
  bodyPart: string,
  signal?: AbortSignal
): Promise<ExerciseByBodyPart[]> {
  return api.get<ExerciseByBodyPart[]>(`/api/exercisedb/exercise/${encodeURIComponent(bodyPart)}`, { signal })
}

export async function startWorkoutFromTemplate(
  templateId: number,
  date: string
): Promise<{ id: number; date: string; status: string; exercises: unknown[] }> {
  return api.post('/api/workouts/from-template/' + templateId, { body: { Date: date } })
}