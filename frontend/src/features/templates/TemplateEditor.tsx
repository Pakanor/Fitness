import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import * as templatesApi from '../../lib/api/templates'
import type { CreateTemplateDto, UpdateTemplateDto, TemplateExercise, ExerciseSearchResult, ExerciseByBodyPart } from '../../lib/api/templates'
import { searchExercises, getExerciseCategories, getExercisesByBodyPart } from '../../lib/api/templates'

export function TemplateEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'nowy'
  const templateId = isNew ? null : parseInt(id || '0', 10)

  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<TemplateExercise[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Exercise search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [bodyPartExercises, setBodyPartExercises] = useState<ExerciseByBodyPart[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Load template if editing
  useEffect(() => {
    if (!isNew && templateId) {
      loadTemplate()
    }
  }, [templateId, isNew])

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim())
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const template = await templatesApi.getTemplate(templateId!)
      setName(template.name)
      setExercises(template.exercises.map((e, i) => ({ ...e, order: i + 1 })))
    } catch {
      setError('Nie udało się załadować szablonu')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await getExerciseCategories()
      setCategories(cats)
    } catch {
      console.error('Failed to load categories')
    }
  }

  const performSearch = async (term: string) => {
    try {
      setSearchLoading(true)
      const results = await searchExercises(term)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const loadBodyPart = async (bodyPart: string) => {
    try {
      const exercises = await getExercisesByBodyPart(bodyPart)
      setBodyPartExercises(exercises)
      setSelectedCategory(bodyPart)
    } catch {
      setBodyPartExercises([])
    }
  }

  const handleAddExercise = (exercise: ExerciseSearchResult | ExerciseByBodyPart) => {
    const newExercise: TemplateExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      gifUrl: exercise.gifUrl || null,
      category: 'category' in exercise ? exercise.category : '',
      order: exercises.length + 1,
    }
    setExercises(prev => [...prev, newExercise])
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i + 1 })))
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev]
      const [removed] = newExercises.splice(fromIndex, 1)
      newExercises.splice(toIndex, 0, removed)
      return newExercises.map((e, i) => ({ ...e, order: i + 1 }))
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nazwa szablonu jest wymagana')
      return
    }
    if (exercises.length === 0) {
      setError('Szablon musi zawierać co najmniej jedno ćwiczenie')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const dto: CreateTemplateDto | UpdateTemplateDto = {
        name: name.trim(),
        exerciseIds: exercises.map(e => e.exerciseId),
      }

      if (isNew) {
        await templatesApi.createTemplate(dto)
      } else {
        await templatesApi.updateTemplate(templateId!, dto)
      }

      navigate('/trening/szablony')
    } catch {
      setError('Nie udało się zapisać szablonu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-ink-dim">Ładowanie szablonu...</div>
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">04A</p>
          <h1 className="font-display text-2xl font-bold">{isNew ? 'Nowy szablon' : 'Edytuj szablon'}</h1>
        </div>
        <Link to="/trening/szablony" className="rounded-inner border border-rule bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface transition-colors">
          Anuluj
        </Link>
      </header>

      {error && (
        <div className="rounded-inner bg-muscle-primary/10 px-3 py-2 text-sm text-muscle-primary" role="alert">
          {error}
        </div>
      )}

      <div className="card space-y-4 p-4">
        <div>
          <label className="block text-sm text-ink-dim mb-1">Nazwa szablonu</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="np. Push Day, Full Body A"
            className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Ćwiczenia ({exercises.length})</span>
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="rounded-inner bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink shadow-active"
            >
              Dodaj ćwiczenie
            </button>
          </div>

          {exercises.length === 0 ? (
            <p className="text-center py-8 text-ink-dim">Brak ćwiczeń. Kliknij "Dodaj ćwiczenie", aby zacząć.</p>
          ) : (
            <ul className="space-y-2" role="list">
              {exercises.map((exercise, index) => (
                <li
                  key={`${exercise.exerciseId}-${index}`}
                  className="card flex items-center justify-between p-3 gap-2"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-ink-dim font-mono text-sm w-6 text-center">{index + 1}</span>
                    {exercise.gifUrl && (
                      <img
                        src={exercise.gifUrl}
                        alt=""
                        className="h-10 w-10 rounded-inner object-cover bg-surface-2"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{exercise.exerciseName}</p>
                      <p className="text-xs text-ink-dim">{exercise.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {index > 0 && (
                      <button
                        onClick={() => handleReorder(index, index - 1)}
                        className="p-1 text-ink-dim hover:text-ink transition-colors"
                        aria-label="Przenieś w górę"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                    )}
                    {index < exercises.length - 1 && (
                      <button
                        onClick={() => handleReorder(index, index + 1)}
                        className="p-1 text-ink-dim hover:text-ink transition-colors"
                        aria-label="Przenieś w dół"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-inner transition-colors"
                      aria-label={`Usuń ${exercise.exerciseName}`}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-rule">
          <Link to="/trening/szablony" className="rounded-inner border border-rule bg-surface-2 px-4 py-2 font-medium text-ink hover:bg-surface transition-colors">
            Anuluj
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-inner bg-primary px-4 py-2 font-medium text-primary-ink shadow-active transition-opacity disabled:opacity-60"
          >
            {saving ? 'Zapisywanie...' : isNew ? 'Utwórz szablon' : 'Zapisz zmiany'}
          </button>
        </div>
      </div>

      {/* Exercise Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 lg:items-start lg:pt-16" role="dialog" aria-modal="true" aria-labelledby="search-title">
          <div className="card w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b border-rule">
              <h2 id="search-title" className="font-medium">Wyszukaj ćwiczenie</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 text-ink-dim hover:text-ink transition-colors"
                aria-label="Zamknij"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Search input */}
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Szukaj ćwiczenia..."
                  className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
                  autoFocus
                />
                {searchLoading && <p className="text-xs text-ink-dim mt-1">Szukanie...</p>}
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wide text-ink-dim mb-2">Kategorie</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => loadBodyPart(cat)}
                      className={`rounded-pill px-3 py-1.5 text-sm transition-colors ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-ink'
                          : 'bg-surface-2 text-ink hover:bg-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search results */}
              {searchQuery && searchResults.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-ink-dim mb-2">Wyniki wyszukiwania</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map(ex => (
                      <li key={ex.id}>
                        <button
                          onClick={() => handleAddExercise(ex)}
                          className="w-full flex items-center gap-3 p-2 text-left hover:bg-surface-2 rounded-inner transition-colors"
                        >
                          {ex.gifUrl && (
                            <img src={ex.gifUrl} alt="" className="h-10 w-10 rounded-inner object-cover bg-surface-2" loading="lazy" />
                          )}
                          <div>
                            <p className="font-medium">{ex.name}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Body part exercises */}
              {selectedCategory && !searchQuery && bodyPartExercises.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-ink-dim mb-2">{selectedCategory}</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {bodyPartExercises.map(ex => (
                      <li key={ex.id}>
                        <button
                          onClick={() => handleAddExercise(ex)}
                          className="w-full flex items-center gap-3 p-2 text-left hover:bg-surface-2 rounded-inner transition-colors"
                        >
                          {ex.gifUrl && (
                            <img src={ex.gifUrl} alt="" className="h-10 w-10 rounded-inner object-cover bg-surface-2" loading="lazy" />
                          )}
                          <div>
                            <p className="font-medium">{ex.name}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(!searchQuery || searchResults.length === 0) && !selectedCategory && (
                <p className="text-center py-8 text-ink-dim">Wpisz nazwę ćwiczenia lub wybierz kategorię</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}