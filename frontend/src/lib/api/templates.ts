import { api } from './client'
import type {
  WorkoutTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
  ExerciseSearchResult,
  ExerciseByBodyPart,
  TemplateExercise,
  WorkoutSessionResponseDto,
  WorkoutTemplatesForStartDto,
} from '@/types'

export type {
  WorkoutTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
  ExerciseSearchResult,
  ExerciseByBodyPart,
  TemplateExercise,
  WorkoutSessionResponseDto,
  WorkoutTemplatesForStartDto,
}

export interface CreateTemplateResponse {
  template: WorkoutTemplate
  location?: string
}

export async function getTemplates(signal?: AbortSignal): Promise<WorkoutTemplate[]> {
  const res = await api.get<WorkoutTemplate[]>('/api/templates', { signal })
  return res.data
}

export async function getTemplate(id: number, signal?: AbortSignal): Promise<WorkoutTemplate> {
  const res = await api.get<WorkoutTemplate>(`/api/templates/${id}`, { signal })
  return res.data
}

export async function createTemplate(dto: CreateTemplateDto): Promise<CreateTemplateResponse> {
  const res = await api.post<WorkoutTemplate>('/api/templates', { body: dto })
  return { template: res.data, location: res.location }
}

export async function updateTemplate(id: number, dto: UpdateTemplateDto): Promise<WorkoutTemplate> {
  const res = await api.put<WorkoutTemplate>(`/api/templates/${id}`, { body: dto })
  return res.data
}

export async function deleteTemplate(id: number, signal?: AbortSignal): Promise<void> {
  await api.delete<void>(`/api/templates/${id}`, { signal })
}

export async function searchExercises(
  term: string,
  offset = 0,
  limit = 50,
  signal?: AbortSignal
): Promise<ExerciseSearchResult[]> {
  const res = await api.get<ExerciseSearchResult[]>(`/api/ExerciseDb/exercise/search/${encodeURIComponent(term)}`, {
    query: { offset, limit },
    signal,
  })
  return res.data
}

export async function getAllExercises(signal?: AbortSignal): Promise<ExerciseByBodyPart[]> {
  const res = await api.get<ExerciseByBodyPart[]>('/api/ExerciseDb/exercise', { signal })
  return res.data
}

export async function getExerciseCategories(signal?: AbortSignal): Promise<string[]> {
  const res = await api.get<string[]>('/api/ExerciseDb/exercise/categories', { signal })
  return res.data
}

export async function getExercisesByBodyPart(
  bodyPart: string,
  signal?: AbortSignal
): Promise<ExerciseByBodyPart[]> {
  const res = await api.get<ExerciseByBodyPart[]>(`/api/ExerciseDb/exercise/${encodeURIComponent(bodyPart)}`, { signal })
  return res.data
}

export async function getWorkoutStartTemplates(signal?: AbortSignal): Promise<WorkoutTemplatesForStartDto[]> {
  const res = await api.get<WorkoutTemplatesForStartDto[]>('/api/workout-start/templates', { signal })
  return res.data
}

export async function startWorkoutFromTemplate(
  templateId: number,
  date: string
): Promise<WorkoutSessionResponseDto> {
  const res = await api.post<WorkoutSessionResponseDto>('/api/workouts/from-template/' + templateId, {
    body: { date },
  })
  return res.data
}