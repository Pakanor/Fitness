import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { WorkoutSessionResponseDto } from '@/types'
import * as W from '@/lib/api/workouts'

export default function SessionPage() {
  const { id } = useParams()
  const [session, setSession] = useState<WorkoutSessionResponseDto | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [setsCount, setSetsCount] = useState(3)

  useEffect(() => {
    if (!id) return
    W.getWorkout(Number(id)).then(setSession).catch(e => setErr(e.message))
  }, [id])

  if (err) return <div className="p-4">{err}</div>
  if (!session) return <div className="p-4">Ładowanie...</div>

  return (
    <section className="p-4 space-y-4">
      <header className="card p-4">
        <h1 className="font-medium">{session.templateName ?? 'Sesja'}</h1>
        <p className="text-sm text-ink-dim">{session.date} · {session.status}</p>
        <p className="text-sm">Wolumen: {session.totalVolume} · ćwiczeń: {session.exerciseCount}</p>
        <div className="flex gap-2 mt-2">
          {session.status === 'planned' && <button className="rounded-inner bg-primary px-3 py-1.5 text-primary-ink" onClick={async () => setSession(await W.startWorkout(session.id))}>Start</button>}
          {session.status === 'in_progress' && <button className="rounded-inner bg-primary px-3 py-1.5 text-primary-ink" onClick={async () => setSession(await W.finishWorkout(session.id))}>Zakończ</button>}
          {session.status === 'completed' && session.canReopen && <button className="rounded-inner bg-surface-2 px-3 py-1.5" onClick={async () => setSession(await W.reopenWorkout(session.id))}>Wznów</button>}
        </div>
      </header>

      <div className="flex items-center gap-2">
        <label className="text-sm">Liczba serii</label>
        <input type="number" min={1} max={20} value={setsCount} onChange={e => setSetsCount(Number(e.target.value))} className="w-16 rounded-inner border border-rule px-2 py-1" />
      </div>

      <ul className="space-y-3">
        {session.exercises.map(ex => (
          <li key={ex.userExerciseId} className="card p-3">
            <div className="font-medium">{ex.exerciseName}</div>
            <div className="text-xs text-ink-dim">{ex.sets.length} serii</div>
            {session.canLogSets && (
              <button
                className="mt-2 rounded-inner bg-muscle-secondary px-3 py-1.5 text-sm text-ink"
                onClick={async () => {
                  const sets = Array.from({ length: setsCount }, (_, i) => ({
                    setNumber: i + 1, weight: ex.weight ?? 0, reps: ex.reps ?? 0, rpe: ex.rpe ?? 8, setType: ex.setType ?? 'normal',
                  }))
                  const res = await W.logSet({ sessionId: session.id, userExerciseId: ex.userExerciseId, exerciseId: ex.exerciseId, setType: ex.setType ?? 'normal', sets })
                  setSession(res.session)
                  if (res.isPr) alert('PR!')
                }}
              >Loguj serie</button>
            )}
            <ul className="mt-2 space-y-1">
              {ex.sets.map(s => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span>#{s.setNumber} {s.weight}kg x {s.reps} RPE {s.rpe}</span>
                  <button className="text-red-500" onClick={async () => setSession(await W.deleteSet(s.id))}>Usuń</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
