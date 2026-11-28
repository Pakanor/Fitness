import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import type { WorkoutSessionResponseDto, SessionExerciseDto, ExerciseSearchResult, ExerciseByBodyPart, SessionStatus } from '@/types'
import * as W from '@/lib/api/workouts'
import { ExercisePicker } from '@/components/ExercisePicker'
import AITrainerDrawer from '@/features/ai-trainer/AITrainerDrawer'
import { getWorkoutStartTemplates, getTemplate } from '@/lib/api/templates'
import { ApiError } from '@/lib/api/client'

interface Row {
  setNumber: number
  weight: string
  reps: string
  rpe: string
  setType: string
}

const SET_TYPES = ['Normal', 'Warmup', 'Dropset', 'ToFailure'] as const

export default function SessionPage() {
  const params = useParams()
  const location = useLocation()
  const id = params.id ?? location.pathname.split('/').filter(Boolean).pop()
  const [session, setSession] = useState<WorkoutSessionResponseDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [rowsByEx, setRowsByEx] = useState<Record<number, Row[]>>({})
  const [countByEx, setCountByEx] = useState<Record<number, number>>({})
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [editRow, setEditRow] = useState<Row>({ setNumber: 1, weight: '', reps: '', rpe: '', setType: 'Normal' })
  const [prExercises, setPrExercises] = useState<Set<number>>(new Set())
  const [aiOpen, setAiOpen] = useState(false)
  const [tplPickerOpen, setTplPickerOpen] = useState(false)
  const [templates, setTemplates] = useState<{id:number; name:string}[]>([])
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({})

  const mutate = async (fn: () => Promise<WorkoutSessionResponseDto>) => {
    try {
      setError(null)
      setSession(await fn())
    } catch (e) {
      const ae = e as ApiError
      setError(ae.status === 409 ? 'Operacja niedozwolona: zakończona sesja / przyszły planowany / duplikat.' : ae.message)
    }
  }

  useEffect(() => {
    if (!id) return
    W.getWorkout(Number(id)).then(setSession).catch(e => setError((e as ApiError).message))
  }, [id])

  useEffect(() => {
    if (session) {
      const newPrExercises = new Set<number>()
      session.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.setType === 'Normal' && ex.sets.some(set => set.setType === 'Normal' && set.reps > 0 && set.weight > 0)) {
            // PR detection is handled by backend, we track via isPr in responses
          }
        })
      })
      setPrExercises(newPrExercises)
    }
  }, [session])

  if (error && !session) return <div className="p-4">{error}</div>
  if (!session) return <div className="p-4">Ładowanie...</div>

  const status = session.status as SessionStatus
  const canLog = session.canLogSets

  const handlePickerSelect = async (ex: ExerciseSearchResult | ExerciseByBodyPart) => {
    try {
      setError(null)
      const res = await W.logSet({
        sessionId: session.id,
        userExerciseId: null,
        exerciseId: ex.id,
        setType: 'Normal',
        sets: [{ setNumber: 1, weight: 0, reps: 0, rpe: 8, setType: 'Normal' }]
      })
      setSession(res.session)
      if (res.isPr) setPrExercises(prev => new Set(prev).add(res.entry.userExerciseId))
    } catch (e) {
      setError((e as ApiError).message)
    }
  }

  const genRows = (ex: SessionExerciseDto) => {
    const n = countByEx[ex.userExerciseId] ?? 3
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({
      setNumber: i + 1,
      weight: '',
      reps: '',
      rpe: '',
      setType: 'Normal'
    }))
    setRowsByEx(prev => ({ ...prev, [ex.userExerciseId]: rows }))
    setSaveErrors(prev => {
      const next = { ...prev }
      delete next[ex.userExerciseId]
      return next
    })
  }

  const saveSets = async (ex: SessionExerciseDto) => {
    const rows = rowsByEx[ex.userExerciseId] ?? []
    const firstEmpty = rows.find(r => r.weight.trim() === '' || r.reps.trim() === '')
    if (firstEmpty) {
      setSaveErrors(prev => ({ ...prev, [ex.userExerciseId]: 'Uzupełnij ciężar i powtórzenia' }))
      return
    }
    const sets = rows.map(r => ({
      setNumber: r.setNumber,
      weight: Number(r.weight),
      reps: Number(r.reps),
      rpe: r.rpe.trim() ? Number(r.rpe) : null,
      setType: r.setType
    }))
    try {
      setError(null)
      setSaveErrors(prev => {
        const next = { ...prev }
        delete next[ex.userExerciseId]
        return next
      })
      const res = await W.logSet({
        sessionId: session.id,
        userExerciseId: ex.userExerciseId,
        exerciseId: ex.exerciseId,
        setType: 'Normal',
        sets
      })
      setSession(res.session)
      if (res.isPr) setPrExercises(prev => new Set(prev).add(ex.userExerciseId))
    } catch (e) {
      setError((e as ApiError).message)
    }
  }

  const handleAiSave = async (matches: { dbId: number; suggestedSets: { weight: number; reps: number; rpe?: number | null }[] }[]) => {
    try {
      setError(null)
      for (const m of matches) {
        const sets = (m.suggestedSets || []).map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe ?? 8,
          setType: 'Normal' as const
        }))
        const res = await W.logSet({
          sessionId: session.id,
          userExerciseId: null,
          exerciseId: m.dbId,
          setType: 'Normal',
          sets
        })
        setSession(res.session)
        if (res.isPr) setPrExercises(prev => new Set(prev).add(res.entry.userExerciseId))
      }
    } catch (e) {
      setError((e as ApiError).message)
    }
  }

  const handleTemplateAdd = async (templateId: number) => {
    try {
      setError(null)
      const tpl = await getTemplate(templateId)
      for (const ex of tpl.exercises) {
        const res = await W.logSet({
          sessionId: session.id,
          userExerciseId: null,
          exerciseId: ex.exerciseId,
          setType: 'Normal',
          sets: [{ setNumber: 1, weight: 0, reps: 0, rpe: 8, setType: 'Normal' }]
        })
        setSession(res.session)
        if (res.isPr) setPrExercises(prev => new Set(prev).add(res.entry.userExerciseId))
      }
      setTplPickerOpen(false)
    } catch (e) {
      setError((e as ApiError).message)
    }
  }

  return (
    <section className="p-4 space-y-4">
      {error && <div className="rounded-inner bg-red-100 text-red-700 p-2">{error}</div>}
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

      <div className="flex gap-2 flex-wrap">
        <button className="rounded-inner bg-muscle-secondary px-3 py-1.5" onClick={() => setAiOpen(true)}>AI Trainer</button>
        <button className="rounded-inner bg-muscle-secondary px-3 py-1.5" onClick={() => setPickerOpen(true)}>Ręcznie</button>
        <button
          className="rounded-inner bg-muscle-secondary px-3 py-1.5"
          onClick={async () => {
            const t = await getWorkoutStartTemplates()
            setTemplates(t.map(x => ({ id: x.id, name: x.name })))
            setTplPickerOpen(true)
          }}
        >
          Z szablonu
        </button>
        <Link to="/trening/szablony/nowy" className="rounded-inner bg-muscle-secondary px-3 py-1.5">Dodaj szablon</Link>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickerSelect} />
      <AITrainerDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        initialSessionId={session.id}
        initialDay={new Date()}
        onSave={handleAiSave}
      />
      {tplPickerOpen && (
        <div className="card p-3">
          <ul className="space-y-2">
            {templates.map(t => (
              <li key={t.id} className="flex justify-between">
                <span>{t.name}</span>
                <button className="text-primary" onClick={() => handleTemplateAdd(t.id)}>Dodaj</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-3">
        {session.exercises.map(ex => (
          <li key={ex.userExerciseId} className="card p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{ex.exerciseName}</span>
              {prExercises.has(ex.userExerciseId) && (
                <span className="text-xs bg-yellow-200 text-yellow-900 px-1 rounded">PR</span>
              )}
            </div>
            {canLog && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Liczba serii</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={countByEx[ex.userExerciseId] ?? 3}
                    onChange={e => setCountByEx(p => ({ ...p, [ex.userExerciseId]: Number(e.target.value) }))}
                    className="w-16 rounded-inner border border-rule px-2 py-1"
                  />
                  <button className="rounded-inner bg-surface-2 px-2 py-1 text-sm" onClick={() => genRows(ex)}>Wstaw wiersze</button>
                </div>
                {saveErrors[ex.userExerciseId] && (
                  <div className="text-sm text-red-600">{saveErrors[ex.userExerciseId]}</div>
                )}
                {(rowsByEx[ex.userExerciseId] ?? []).map((r, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      placeholder="kg"
                      value={r.weight}
                      onChange={e => setRowsByEx(p => {
                        const arr = [...(p[ex.userExerciseId] ?? [])]
                        arr[idx] = { ...arr[idx], weight: e.target.value }
                        return { ...p, [ex.userExerciseId]: arr }
                      })}
                      className="w-16 rounded-inner border border-rule px-2 py-1"
                    />
                    <input
                      placeholder="reps"
                      value={r.reps}
                      onChange={e => setRowsByEx(p => {
                        const arr = [...(p[ex.userExerciseId] ?? [])]
                        arr[idx] = { ...arr[idx], reps: e.target.value }
                        return { ...p, [ex.userExerciseId]: arr }
                      })}
                      className="w-16 rounded-inner border border-rule px-2 py-1"
                    />
                    <input
                      placeholder="RPE"
                      value={r.rpe}
                      onChange={e => setRowsByEx(p => {
                        const arr = [...(p[ex.userExerciseId] ?? [])]
                        arr[idx] = { ...arr[idx], rpe: e.target.value }
                        return { ...p, [ex.userExerciseId]: arr }
                      })}
                      className="w-16 rounded-inner border border-rule px-2 py-1"
                    />
                    <select
                      value={r.setType}
                      onChange={e => setRowsByEx(p => {
                        const arr = [...(p[ex.userExerciseId] ?? [])]
                        arr[idx] = { ...arr[idx], setType: e.target.value }
                        return { ...p, [ex.userExerciseId]: arr }
                      })}
                      className="rounded-inner border border-rule px-2 py-1 bg-surface"
                    >
                      {SET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
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
                      <input
                        value={editRow.weight}
                        onChange={e => setEditRow(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-16 rounded-inner border border-rule px-2 py-1"
                      />
                      <input
                        value={editRow.reps}
                        onChange={e => setEditRow(prev => ({ ...prev, reps: e.target.value }))}
                        className="w-16 rounded-inner border border-rule px-2 py-1"
                      />
                      <input
                        value={editRow.rpe}
                        onChange={e => setEditRow(prev => ({ ...prev, rpe: e.target.value }))}
                        className="w-16 rounded-inner border border-rule px-2 py-1"
                      />
                      <select
                        value={editRow.setType}
                        onChange={e => setEditRow(prev => ({ ...prev, setType: e.target.value }))}
                        className="rounded-inner border border-rule px-2 py-1 bg-surface"
                      >
                        {SET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        className="text-primary"
                        onClick={() => mutate(() => W.updateSet(s.id, {
                          setNumber: editRow.setNumber,
                          reps: editRow.reps.trim() ? Number(editRow.reps) : 0,
                          weight: editRow.weight.trim() ? Number(editRow.weight) : 0,
                          rpe: editRow.rpe.trim() ? Number(editRow.rpe) : null,
                          setType: editRow.setType
                        }))}
                      >
                        Zapisz
                      </button>
                      <button onClick={() => setEditingSet(null)}>Anuluj</button>
                    </>
                  ) : (
                    <>
                      <span>#{s.setNumber} {s.weight}kg x {s.reps} RPE {s.rpe ?? '-'} [{s.setType}]</span>
                      <button
                        className="text-primary"
                        onClick={() => {
                          setEditingSet(s.id)
                          setEditRow({
                            setNumber: s.setNumber,
                            weight: String(s.weight),
                            reps: String(s.reps),
                            rpe: String(s.rpe ?? ''),
                            setType: s.setType
                          })
                        }}
                      >
                        Edytuj
                      </button>
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