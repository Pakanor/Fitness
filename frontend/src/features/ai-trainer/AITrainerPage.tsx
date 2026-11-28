import { useState } from 'react'
import { Link } from 'react-router-dom'
import AITrainerDrawer from './AITrainerDrawer'

export default function AITrainerPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)

  const handleClose = () => {
    setIsDrawerOpen(false)
    setTimeout(() => {
      window.history.back()
    }, 200)
  }

  const handleSave = (matches: any[], day: Date, sessionId?: number) => {
    console.log('Save matches to day/session:', { matches, day, sessionId })
    alert(`Zapisano ${matches.length} ćwiczeń do ${day.toLocaleDateString('pl-PL')}${sessionId ? ` (sesja ${sessionId})` : ''}`)
  }

  return (
    <section className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">AI / Trainer</p>
          <h1 className="font-display text-2xl font-bold">AI Trainer</h1>
        </div>
        <Link to="/" className="rounded-inner border border-rule bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 transition-colors">
          Powrót
        </Link>
      </header>

      <AITrainerDrawer
        isOpen={isDrawerOpen}
        onClose={handleClose}
        onSave={handleSave}
      />
    </section>
  )
}