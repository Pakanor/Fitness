import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useEffect, useState } from 'react'
import { fetchTopFatigue, fetchCurrent1Rm } from '@/lib/api/home'
import { getWorkoutsByDate } from '@/lib/api/workouts'
import type { WorkoutSessionResponseDto } from '@/types'
import { ApiError } from '@/lib/api/client'

export default function Page() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [fatigue, setFatigue] = useState<{ name: string; value: number }[]>([])
  const [oneRm, setOneRm] = useState<string>('—')
  const [workout, setWorkout] = useState<WorkoutSessionResponseDto | null>(null)
  const [workoutLoading, setWorkoutLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchTopFatigue().then(setFatigue).catch(() => setFatigue([]))
    fetchCurrent1Rm().then(setOneRm).catch(() => {})
  }, [])

  useEffect(() => {
    let mounted = true
    getWorkoutsByDate(today)
      .then(res => {
        if (mounted) setWorkout(res)
      })
      .catch((e: ApiError) => {
        if (mounted && e.status !== 404) {
          console.error('Failed to load workout:', e)
        }
        if (mounted) setWorkout(null)
      })
      .finally(() => {
        if (mounted) setWorkoutLoading(false)
      })
    return () => { mounted = false }
  }, [today])

  const handleStartWorkout = () => {
    if (workout) {
      navigate(`/trening/sesja/${workout.id}`)
    } else {
      navigate('/trening/szablony')
    }
  }

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {(user?.username ?? 'F').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-dim">Welcome back</p>
          <h1 className="truncate font-display text-xl font-bold">{user?.username ?? 'Hadi'}</h1>
        </div>
        <button type="button" aria-label="Powiadomienia" className="grid h-11 w-11 place-items-center rounded-inner border border-rule bg-surface">
          🔔
        </button>
        <Link to="/ai-trainer" className="rounded-inner bg-primary px-3 py-2 text-sm font-semibold text-primary-ink">
          AI Trainer
        </Link>
      </header>

      <div className="card flex gap-2 overflow-x-auto p-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - 3 + i)
          const day = d.getDate()
          const active = day === selectedDay
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={[
                'flex min-w-[3.25rem] flex-col items-center rounded-inner px-2 py-2 text-xs transition-colors',
                active ? 'bg-primary text-primary-ink shadow-active' : 'text-ink-dim hover:bg-surface-2',
              ].join(' ')}
            >
              <span className="text-[10px] uppercase">{d.toLocaleDateString('pl-PL', { weekday: 'short' })}</span>
              <span className="font-display text-base font-bold">{day}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <article className="card col-span-1 flex flex-col gap-3 p-4 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Trening dnia</h2>
            {workout && (
              <span className="rounded-inner bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {workout.templateName ?? 'Trening dnia'}
              </span>
            )}
          </div>
          {workoutLoading ? (
            <p className="text-sm text-ink-dim">Ładowanie...</p>
          ) : workout ? (
            <p className="text-sm text-ink-dim">
              {workout.templateName ?? 'Trening dnia'} · {workout.exerciseCount} ćwiczeń
            </p>
          ) : (
            <p className="text-sm text-ink-dim">Brak zaplanowanego treningu na dziś</p>
          )}
          <button
            type="button"
            onClick={handleStartWorkout}
            className="mt-auto w-full rounded-inner bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-active sm:w-auto"
          >
            {workout ? 'Rozpocznij trening' : 'Wybierz szablon'}
          </button>
        </article>

        <article className="card flex flex-col gap-2 p-4">
          <h2 className="font-display text-base font-bold">Zmęczenie</h2>
          {fatigue.map((m) => (
            <div key={m.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{m.name}</span>
                <span className="tabular-nums text-ink-dim">{m.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary" style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </article>

        <article className="card flex flex-col gap-2 p-4">
          <h2 className="font-display text-base font-bold">1RM</h2>
          <p className="font-display text-3xl font-bold tabular-nums">{oneRm}</p>
          <div className="h-12 rounded-inner bg-surface-2" aria-hidden="true" />
          <p className="text-xs text-ink-dim">Trend ostatnich tygodni</p>
        </article>

        <article className="card flex flex-col gap-2 p-4">
          <h2 className="font-display text-base font-bold">Objętość</h2>
          <div className="flex h-24 items-end gap-1.5" aria-hidden="true">
            {[40, 65, 30, 80, 55, 70, 45].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${v}%` }} />
            ))}
          </div>
          <p className="text-xs text-ink-dim">Ostatnie 7 dni</p>
        </article>

        <article className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
          <h2 className="font-display text-base font-bold">Kroki</h2>
          <p className="text-2xl font-bold tabular-nums">—</p>
          <p className="text-xs text-ink-dim">Wkrótce</p>
        </article>
      </div>

      <article className="card p-4">
        <h2 className="mb-2 font-display text-base font-bold">Aktywność (miesiąc)</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((d) => (
            <div key={d} className="py-1 text-[10px] font-medium text-ink-dim">{d}</div>
          ))}
          {Array.from({ length: 30 }).map((_, i) => {
            const trained = [2, 5, 9, 14, 20, 25].includes(i)
            return (
              <div key={i} className="flex aspect-square flex-col items-center justify-center rounded-inner text-[11px] leading-none">
                <span className="tabular-nums text-ink-dim">{i + 1}</span>
                {trained && <span className="text-sm">🏋️</span>}
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}