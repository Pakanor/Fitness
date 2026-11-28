import { Link } from 'react-router-dom'
import { TemplateList } from '../templates/TemplateList'

export default function PlansPage() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">04A / 04B</p>
          <h1 className="font-display text-2xl font-bold">Trening</h1>
        </div>
        <Link to="/trening/szablony" className="rounded-inner bg-primary px-4 py-2 font-medium text-primary-ink shadow-active">
          Szablony
        </Link>
      </header>
      <TemplateList />
    </section>
  )
}