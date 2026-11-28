import { useEffect, useState } from 'react'
import type { ExerciseSearchResult, ExerciseByBodyPart } from '@/types'
import { searchExercises, getExerciseCategories, getExercisesByBodyPart } from '@/lib/api/templates'

export interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (ex: ExerciseSearchResult | ExerciseByBodyPart) => void
}

export function ExercisePicker({ open, onClose, onSelect }: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseSearchResult[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [bodyPartExercises, setBodyPartExercises] = useState<ExerciseByBodyPart[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    getExerciseCategories().then(setCategories).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      setLoading(true)
      searchExercises(searchQuery).then(setSearchResults).catch(() => setSearchResults([])).finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const loadBodyPart = (cat: string) => {
    setSelectedCategory(cat)
    getExercisesByBodyPart(cat).then(setBodyPartExercises).catch(() => setBodyPartExercises([]))
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="card w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-rule">
          <h2 className="font-medium">Wyszukaj ćwiczenie</h2>
          <button onClick={onClose} aria-label="Zamknij" className="p-1 text-ink-dim hover:text-ink">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-4 space-y-4 overflow-y-auto">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Szukaj ćwiczenia..." className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary" autoFocus />
          {loading && <p className="text-xs text-ink-dim mt-1">Szukanie...</p>}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wide text-ink-dim mb-2">Kategorie</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => loadBodyPart(cat)} className={`rounded-pill px-3 py-1.5 text-sm ${selectedCategory === cat ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink'}`}>{cat}</button>
              ))}
            </div>
          </div>
          {searchQuery && searchResults.length > 0 && (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(ex => (
                <li key={ex.id} className="flex items-center justify-between">
                  <span>{ex.name}</span>
                  <button className="text-primary" onClick={() => { onSelect(ex); onClose() }}>Dodaj</button>
                </li>
              ))}
            </ul>
          )}
          {selectedCategory && !searchQuery && bodyPartExercises.length > 0 && (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {bodyPartExercises.map(ex => (
                <li key={ex.id} className="flex items-center justify-between">
                  <span>{ex.name}</span>
                  <button className="text-primary" onClick={() => { onSelect(ex); onClose() }}>Dodaj</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
