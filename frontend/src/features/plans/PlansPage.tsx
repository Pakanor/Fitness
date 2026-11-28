import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { IncompleteSessionDto, WorkoutSessionResponseDto } from '@/types'
import * as W from '@/lib/api/workouts'
import { getWorkoutStartTemplates } from '@/lib/api/templates'

export default function PlansPage() {
  const [active, setActive] = useState<WorkoutSessionResponseDto | null>(null)
  const [incomplete, setIncomplete] = useState<IncompleteSessionDto[]>([])
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([])
  const [status, setStatus] = useState<string>('none')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    W.getActiveWorkout().then(setActive).catch(() => {
      W.getIncompleteWorkouts().then(setIncomplete).catch(() => {})
    })
    getWorkoutStartTemplates().then(t => setTemplates(t.map(x => ({ id: x.id, name: x.name })))) .catch(() => {})
    W.getWorkoutStatus(today).then(r => setStatus(r.status)).catch(() => {})
  }, [])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">04A / 04B</p>
          <h1 className="font-display text-2xl font-bold">Trening</h1>
          <p className="text-sm text-ink-dim">Status dnia: {status}</p>
        </div>
        <Link to="/trening/szablony" className="rounded-inner bg-primary px-4 py-2 font-medium text-primary-ink shadow-active">
          Szablony
        </Link>
      </header>
      {active && (
        <div className="card p-3">
          <Link to={`/trening/sesja/${active.id}`} className="font-medium">Aktywna sesja: {active.templateName ?? active.id}</Link>
        </div>
      )}
      {incomplete.map(s => (
        <div key={s.id} className="card p-3">
          <Link to={`/trening/sesja/${s.id}`}>Niedokończona: {s.templateName ?? s.id} ({s.status})</Link>
        </div>
      ))}
      {templates.length > 0 && (
        <ul className="space-y-2">
          {templates.map(t => (
            <li key={t.id} className="card p-3">{t.name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
