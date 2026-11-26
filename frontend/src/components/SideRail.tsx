import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

export function SideRail() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-rule bg-surface lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="grid h-9 w-9 place-items-center rounded-inner bg-primary font-display text-lg font-bold text-primary-ink">
          F
        </span>
        <span className="font-display text-lg font-bold tracking-tight">FitnessApp</span>
      </div>
      <nav aria-label="Nawigacja główna" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.route}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-inner px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-ink shadow-active'
                      : 'text-ink-dim hover:bg-surface-2 hover:text-ink',
                  ].join(' ')
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
