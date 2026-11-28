import { api } from './client'

export interface MuscleDamage {
  muscleGroupName?: string
  muscleGroupKey?: string
  damagePercent?: number
}

export interface OneRmProgressionLift {
  current1RM?: number
  name?: string
}

export interface OneRmProgressionResponse {
  lifts?: OneRmProgressionLift[]
}

export async function fetchTopFatigue(): Promise<{ name: string; value: number }[]> {
  const res = await api.get<MuscleDamage[]>('/api/fatigue-analysis/muscle-damage')
  return (res.data ?? [])
    .slice(0, 3)
    .map((x) => ({ name: x.muscleGroupName ?? x.muscleGroupKey ?? '—', value: Math.round(x.damagePercent ?? 0) }))
}

export async function fetchCurrent1Rm(): Promise<string> {
  const res = await api.get<OneRmProgressionResponse>('/api/records/1rm-progression')
  const lift = res.data?.lifts?.[0]
  return lift?.current1RM != null ? `${lift.current1RM} kg` : '—'
}