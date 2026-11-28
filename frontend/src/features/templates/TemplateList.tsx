import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as templatesApi from '../../lib/api/templates'
import type { WorkoutTemplate } from '@/types'

export function TemplateList() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await templatesApi.getTemplates()
      setTemplates(data)
    } catch (err) {
      setError('Nie udało się załadować szablonów')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten szablon?')) return
    try {
      await templatesApi.deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Nie udało się usunąć szablonu')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-ink-dim">Ładowanie szablonów...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ink-dim">Brak szablonów</p>
        <Link to="/trening/szablony/nowy" className="mt-4 inline-block text-primary hover:underline">
          Utwórz pierwszy szablon
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map(template => (
        <article
          key={template.id}
          className="card flex items-center justify-between p-4 gap-4"
        >
          <Link to={`/trening/szablony/${template.id}`} className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{template.name}</h3>
            <p className="text-sm text-ink-dim mt-1">
              {template.exercises.length === 0
                ? '0 ćwiczeń'
                : template.exercises.length === 1
                ? '1 ćwiczenie'
                : `${template.exercises.length} ćwiczenia`}
            </p>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/trening/szablony/${template.id}`}
              className="rounded-inner border border-rule bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface transition-colors"
            >
              Edytuj
            </Link>
            <button
              onClick={() => handleDelete(template.id)}
              className="rounded-inner px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`Usuń szablon ${template.name}`}
            >
              Usuń
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}