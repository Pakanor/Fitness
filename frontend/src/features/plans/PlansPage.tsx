import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { IncompleteSessionDto, WorkoutSessionResponseDto, SessionStatus } from '@/types'
import * as W from '@/lib/api/workouts'
import * as templatesApi from '@/lib/api/templates'
import { ApiError } from '@/lib/api/client'

export default function PlansPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<WorkoutSessionResponseDto | null>(null)
  const [incomplete, setIncomplete] = useState<IncompleteSessionDto[]>([])
  const [templates, setTemplates] = useState<{ id: number; name: string; exerciseCount: number }[]>([])
  const [status, setStatus] = useState<SessionStatus>('none')
  const [error, setError] = useState<string | null>(null)
  const [startingTemplateId, setStartingTemplateId] = useState<number | null>(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const activeRes = await W.getActiveWorkout()
        if (mounted) setActive(activeRes)
      } catch {
        try {
          const incompleteRes = await W.getIncompleteWorkouts()
          if (mounted) setIncomplete(incompleteRes)
        } catch {}
      }
      try {
        const templatesRes = await templatesApi.getWorkoutStartTemplates()
        if (mounted) setTemplates(templatesRes)
      } catch {}
      try {
        const statusRes = await W.getWorkoutStatus(today)
        if (mounted) setStatus(statusRes.status as SessionStatus)
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleStartTemplate = async (templateId: number) => {
    setStartingTemplateId(templateId)
    setError(null)
    try {
      const res = await templatesApi.startWorkoutFromTemplate(templateId, today)
      navigate(`/trening/sesja/${res.id}`)
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.status === 409) {
        setError('Istnieje już trening na dziś')
      } else {
        setError('Nie udało się rozpocząć treningu')
      }
    } finally {
      setStartingTemplateId(null)
    }
  }

  const hasSession = !!active || incomplete.length > 0

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">04A / 04B</p>
          <h1 className="font-display text-2xl font-bold">Trening</h1>
          <p className="text-sm text-ink-dim">
            Status dnia:{' '}
            <span
              className={`font-medium px-2 py-0.5 rounded-pill text-xs ${
                status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'planned'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-surface-2 text-ink-dim'
              }`}
            >
              {status}
            </span>
          </p>
        </div>
        <Link to="/trening/szablony" className="rounded-inner bg-primary px-4 py-2 font-medium text-primary-ink shadow-active">
          Szablony
        </Link>
      </header>

      {error && (
        <div className="rounded-inner bg-red-100 border border-red-300 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {active && (
        <div className="card p-3">
          <Link to={`/trening/sesja/${active.id}`} className="font-medium">
            Aktywna sesja: {active.templateName ?? `Sesja ${active.id}`}
          </Link>
        </div>
      )}

      {incomplete.map(s => (
        <div key={s.id} className="card p-3">
          <Link to={`/trening/sesja/${s.id}`}>
            Niedokończona: {s.templateName ?? `Sesja ${s.id}`} ({s.status})
          </Link>
        </div>
      ))}

      {!hasSession && templates.length > 0 && (
        <ul className="space-y-2">
          {templates.map(t => (
            <li key={t.id} className="card p-3 flex items-center justify-between">
              <div>
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-sm text-ink-dim">{t.exerciseCount} ćwiczeń</span>
              </div>
              <button
                onClick={() => handleStartTemplate(t.id)}
                disabled={startingTemplateId === t.id}
                className="rounded-inner bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink shadow-active disabled:opacity-60 transition-opacity"
              >
                {startingTemplateId === t.id ? 'Trwa...' : 'Rozpocznij'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!hasSession && templates.length === 0 && (
        <p className="text-center py-8 text-ink-dim">Brak szablonów. Utwórz szablon, aby rozpocząć trening.</p>
      )}
    </section>
  )
}