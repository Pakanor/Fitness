import { useState, useEffect, useCallback } from 'react'
import { resolveExercises, type ExerciseMatch, isRateLimitError, getRetryAfter } from '@/lib/api/ai'
import type { AITrainerState } from '@/types'

interface AITrainerDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (matches: ExerciseMatch[], day: Date, sessionId?: number) => void
  initialDay?: Date
  initialSessionId?: number
}

export default function AITrainerDrawer({
  isOpen,
  onClose,
  onSave,
  initialDay,
  initialSessionId,
}: AITrainerDrawerProps) {
  const [state, setState] = useState<AITrainerState>({
    inputText: '',
    isLoading: false,
    response: undefined,
    selectedDay: initialDay ?? new Date(),
    selectedSessionId: initialSessionId,
  })

  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (retryCountdown !== null && retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown((c) => (c === null ? null : c - 1)), 1000)
      return () => clearTimeout(timer)
    }
    if (retryCountdown === 0) {
      setRetryCountdown(null)
    }
  }, [retryCountdown])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const text = state.inputText.trim()
    if (!text || state.isLoading) return

    setState((prev) => ({ ...prev, isLoading: true, error: undefined, response: undefined }))

    try {
      const response = await resolveExercises({ text, domain: 'exercise' })
      setState((prev) => ({ ...prev, isLoading: false, response }))
    } catch (error) {
      if (isRateLimitError(error)) {
        const retryAfter = getRetryAfter(error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Limit zapytań przekroczony. Spróbuj za ${retryAfter}s.`,
        }))
        setRetryCountdown(retryAfter)
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Wystąpił błąd',
        }))
      }
    }
  }, [state.inputText, state.isLoading])

  const handleSave = useCallback(() => {
    if (!state.response || !onSave) return
    onSave(state.response.matches, state.selectedDay ?? new Date(), state.selectedSessionId)
    onClose()
  }, [state.response, state.selectedDay, state.selectedSessionId, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="ai-trainer-title">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl bg-surface flex flex-col h-full md:max-w-3xl lg:max-w-4xl">
        <header className="flex items-center justify-between border-b border-rule p-4">
          <h2 id="ai-trainer-title" className="font-display text-lg font-bold">
            AI Trainer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-inner border border-rule bg-surface text-ink-dim hover:bg-surface-2 transition-colors"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="ai-trainer-input" className="block text-sm font-medium mb-2">
                Opisz trening lub ćwiczenia
              </label>
              <textarea
                id="ai-trainer-input"
                value={state.inputText}
                onChange={(e) => setState((prev) => ({ ...prev, inputText: e.target.value }))}
                placeholder="np. 'Push day: klatka, barki, triceps 3x8-12' lub 'chcę zrobić przysiady, martwe ciągi i wiosłowanie'"
                rows={3}
                className="w-full rounded-inner border border-rule bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                disabled={state.isLoading}
              />
            </div>

            {retryCountdown !== null && (
              <div className="rounded-inner bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Zbyt wiele zapytań. Ponowna próba za {retryCountdown}s...
              </div>
            )}

            {state.error && (
              <div className="rounded-inner bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {state.error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={state.isLoading || !state.inputText.trim()}
                className="flex-1 rounded-inner bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-active disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? 'Analizuję...' : 'Rozwiąż ćwiczenia'}
              </button>
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, inputText: '', response: undefined, error: undefined }))}
                className="rounded-inner border border-rule bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2 transition-colors"
              >
                Wyczyść
              </button>
            </div>
          </form>

          {state.response && (
            <div className="space-y-4 border-t border-rule pt-4">
              <h3 className="font-display text-base font-bold">Podgląd dopasowanych ćwiczeń</h3>

              {state.response.matches.length === 0 && (
                <p className="text-sm text-ink-dim text-center py-4">
                  Nie znaleziono dopasowań. Spróbuj innego opisu.
                </p>
              )}

              <div className="space-y-3">
                {state.response.matches.map((match) => (
                  <ExerciseMatchCard key={match.dbId} match={match} />
                ))}
              </div>

              {state.response.unmatched.length > 0 && (
                <details className="text-sm text-ink-dim">
                  <summary className="cursor-pointer font-medium">Nierozpoznane fragmenty ({state.response.unmatched.length})</summary>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {state.response.unmatched.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex gap-2 pt-4 border-t border-rule">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="date"
                    value={state.selectedDay?.toISOString().split('T')[0] ?? ''}
                    onChange={(e) => setState((prev) => ({ ...prev, selectedDay: e.target.value ? new Date(e.target.value) : undefined }))}
                    className="rounded-inner border border-rule bg-surface px-2 py-1 text-sm"
                  />
                  Dzień
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    placeholder="Session ID"
                    value={state.selectedSessionId ?? ''}
                    onChange={(e) => setState((prev) => ({ ...prev, selectedSessionId: e.target.value ? Number(e.target.value) : undefined }))}
                    className="rounded-inner border border-rule bg-surface px-2 py-1 text-sm w-24"
                  />
                  Sesja (opcjonalnie)
                </label>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="w-full rounded-inner bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-active"
              >
                Zapisz do dnia/sesji
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseMatchCard({ match }: { match: ExerciseMatch }) {
  const confidencePercent = Math.round(match.confidence * 100)
  const confidenceColor =
    confidencePercent >= 80 ? 'text-green-600' :
    confidencePercent >= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <article className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-base font-bold truncate">
            {match.nameLocalized ?? match.name}
          </h4>
          <p className="text-xs text-ink-dim capitalize">{match.category}</p>
        </div>
        <span className={`font-mono text-xs font-bold ${confidenceColor} shrink-0`}>
          {confidencePercent}%
        </span>
      </div>

      {match.gifUrl && (
        <img
          src={match.gifUrl}
          alt={`${match.name} demo`}
          className="w-full aspect-video object-cover rounded-inner bg-surface-2"
          loading="lazy"
        />
      )}

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-ink-dim uppercase tracking-wide">Sugerowane serie</h5>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {match.suggestedSets.map((set, i) => (
            <div key={i} className="card p-3 text-center space-y-1">
              <div className="font-display text-lg font-bold tabular-nums">{set.weight} kg</div>
              <div className="font-mono text-sm text-ink-dim">{set.reps} powt.</div>
              {set.rpe != null && (
                <div className="text-xs text-ink-dim">RPE {set.rpe}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}