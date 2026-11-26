import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

/** Mobile bottom navigation (UI-SPEC 1.3 / 2.1). Hidden ≥1024px. */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Nawigacja główna"
    >
      <ul className="mx-auto flex max-w-app items-stretch justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.route} className="flex-1">
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-0.5 rounded-inner px-2 py-1.5 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-primary-ink bg-primary shadow-active'
                    : 'text-ink-dim hover:text-ink',
                ].join(' ')
              }
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
