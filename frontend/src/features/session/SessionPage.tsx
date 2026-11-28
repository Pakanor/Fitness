import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { WorkoutSessionResponseDto, SessionExerciseDto, ExerciseSearchResult, ExerciseByBodyPart, SessionStatus } from '@/types'
import * as W from '@/lib/api/workouts'
import { ExercisePicker } from '@/components/ExercisePicker'
import { ApiError } from '@/lib/api/client'

interface Row { setNumber: number; weight: string; reps: string; rpe: string; setType: string }

export default function SessionPage() {
  const { id } = useParams()
  const [session, setSession] = useState<WorkoutSessionResponseDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [rowsByEx, setRowsByEx] = useState<Record<number, Row[]>>({})
  const [countByEx, setCountByEx] = useState<Record<number, number>>({})
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [editRow, setEditRow] = useState<Row>({ setNumber: 1, weight: '', reps: '', rpe: '', setType: 'Normal' })
  const [pr, setPr] = useState(false)

  const mutate = async (fn: () => Promise<WorkoutSessionResponseDto>) => {
    try { setError(null); setSession(await fn()) } catch (e) {
      const ae = e as ApiError
      setError(ae.status === 409 ? 'Operacja niedozwolona: zakończona sesja / przyszły planowany / duplikat.' : ae.message)
    }
  }

  useEffect(() => {
    if (!id) return
    W.getWorkout(Number(id)).then(setSession).catch(e => setError((e as ApiError).message))
  }, [id])

  if (error && !session) return <div className="p-4">{error}</div>
  if (!session) return <div className="p-4">Ładowanie...</div>

  const status = session.status as SessionStatus
  const canLog = session.canLogSets

  const handlePickerSelect = (ex: ExerciseSearchResult | ExerciseByBodyPart) => {
    W.logSet({ sessionId: session.id, userExerciseId: null, exerciseId: ex.id, setType: 'Normal', sets: [{ setNumber: 1, weight: 0, reps: 0, rpe: 8, setType: 'Normal' }] }).then(res => { setSession(res.session); if (res.isPr) setPr(true) }).catch(e => setError((e as ApiError).message))
  }

  const genRows = (ex: SessionExerciseDto) => {
    const n = countByEx[ex.userExerciseId] ?? 3
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({ setNumber: i + 1, weight: '', reps: '', rpe: '', setType: 'Normal' }))
    setRowsByEx(prev => ({ ...prev, [ex.userExerciseId]: rows }))
  }

  const saveSets = (ex: SessionExerciseDto) => {
    const rows = rowsByEx[ex.userExerciseId] ?? []
    const sets = rows.map(r => ({ setNumber: r.setNumber, weight: Number(r.weight) || 0, reps: Number(r.reps) || 0, rpe: Number(r.rpe) || 8, setType: r.setType }))
    mutate(async () => {
      const res = await W.logSet({ sessionId: session.id, userExerciseId: ex.userExerciseId, exerciseId: ex.exerciseId, setType: 'Normal', sets })
      if (res.isPr) setPr(true)
      return res.session
    })
  }

  return (
    <section className="p-4 space-y-4">
      {error && <div className="rounded-inner bg-red-100 text-red-700 p-2">{error}</div>}
      {pr && <div className="rounded-inner bg-yellow-100 text-yellow-800 p-2 font-bold">PR!</div>}
      <header className="card p-4">
        <h1 className="font-medium">{session.templateName ?? 'Sesja'}</h1>
        <p className="text-sm text-ink-dim">{session.date} · {status}</p>
        <p className="text-sm">Wolumen: {session.totalVolume} · ćwiczeń: {session.exerciseCount}</p>
        <div className="flex gap-2 mt-2">
          {status === 'planned' && <button className="rounded-inner bg-primary px-3 py-1.5 text-primary-ink" onClick={() => mutate(() => W.startWorkout(session.id))}>Start</button>}
          {status === 'in_progress' && <button className="rounded-inner bg-primary px-3 py-1.5 text-primary-ink" onClick={() => mutate(() => W.finishWorkout(session.id))}>Zakończ</button>}
          {status === 'completed' && session.canReopen && <button className="rounded-inner bg-surface-2 px-3 py-1.5" onClick={() => mutate(() => W.reopenWorkout(session.id))}>Wznów</button>}
        </div>
      </header>

      <button className="rounded-inner bg-muscle-secondary px-3 py-1.5" onClick={() => setPickerOpen(true)}>Dodaj ćwiczenie</button>
      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickerSelect} />

      <ul className="space-y-3">
        {session.exercises.map(ex => (
          <li key={ex.userExerciseId} className="card p-3">
            <div className="font-medium">{ex.exerciseName} {pr && <span className="ml-2 text-xs bg-yellow-200 text-yellow-900 px-1 rounded">PR</span>}</div>
            {canLog && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Liczba serii</label>
                  <input type="number" min={1} max={20} value={countByEx[ex.userExerciseId] ?? 3} onChange={e => setCountByEx(p => ({ ...p, [ex.userExerciseId]: Number(e.target.value) }))} className="w-16 rounded-inner border border-rule px-2 py-1" />
                  <button className="rounded-inner bg-surface-2 px-2 py-1 text-sm" onClick={() => genRows(ex)}>Wstaw wiersze</button>
                </div>
                {(rowsByEx[ex.userExerciseId] ?? []).map((r, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input placeholder="kg" value={r.weight} onChange={e => setRowsByEx(p => { const arr = [...(p[ex.userExerciseId] ?? [])]; arr[idx] = { ...arr[idx], weight: e.target.value }; return { ...p, [ex.userExerciseId]: arr } })} className="w-16 rounded-inner border border-rule px-2 py-1" />
                    <input placeholder="reps" value={r.reps} onChange={e => setRowsByEx(p => { const arr = [...(p[ex.userExerciseId] ?? [])]; arr[idx] = { ...arr[idx], reps: e.target.value }; return { ...p, [ex.userExerciseId]: arr } })} className="w-16 rounded-inner border border-rule px-2 py-1" />
                    <input placeholder="RPE" value={r.rpe} onChange={e => setRowsByEx(p => { const arr = [...(p[ex.userExerciseId] ?? [])]; arr[idx] = { ...arr[idx], rpe: e.target.value }; return { ...p, [ex.userExerciseId]: arr } })} className="w-16 rounded-inner border border-rule px-2 py-1" />
                  </div>
                ))}
                {(rowsByEx[ex.userExerciseId] ?? []).length > 0 && (
                  <button className="rounded-inner bg-primary px-3 py-1.5 text-primary-ink text-sm" onClick={() => saveSets(ex)}>Zapisz serie</button>
                )}
              </div>
            )}
            <ul className="mt-2 space-y-1">
              {ex.sets.map(s => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  {editingSet === s.id ? (
                    <>
                      <input value={editRow.weight} onChange={e => setEditRow(r => ({ ...r, weight: e.target.value }))} className="w-16 rounded-inner border border-rule px-2 py-1" />
                      <input value={editRow.reps} onChange={e => setEditRow(r => ({ ...r, reps: e.target.value }))} className="w-16 rounded-inner border border-rule px-2 py-1" />
                      <input value={editRow.rpe} onChange={e => setEditRow(r => ({ ...r, rpe: e.target.value }))} className="w-16 rounded-inner border border-rule px-2 py-1" />
                      <button className="text-primary" onClick={() => mutate(() => W.updateSet(s.id, { setNumber: editRow.setNumber, reps: Number(editRow.reps) || 0, weight: Number(editRow.weight) || 0, rpe: Number(editRow.rpe) || null, setType: editRow.setType }))}>Zapisz</button>
                      <button onClick={() => setEditingSet(null)}>Anuluj</button>
                    </>
                  ) : (
                    <>
                      <span>#{s.setNumber} {s.weight}kg x {s.reps} RPE {s.rpe}</span>
                      <button className="text-primary" onClick={() => { setEditingSet(s.id); setEditRow({ setNumber: s.setNumber, weight: String(s.weight), reps: String(s.reps), rpe: String(s.rpe ?? ''), setType: s.setType }) }}>Edytuj</button>
                      <button className="text-red-500" onClick={() => mutate(() => W.deleteSet(s.id))}>Usuń</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
