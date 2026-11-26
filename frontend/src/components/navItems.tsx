import type { AppRoute } from '@/types'

export interface NavItem {
  route: AppRoute
  path: string
  label: string
  icon: (props: { className?: string }) => JSX.Element
}

const HomeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
)

const PlansIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 4h9l3 3v13H6V4Zm9 0v3h3M9 12h6M9 16h6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

const AnalysisIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 20V10m5 10V4m5 16v-7m5 7V8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export const NAV_ITEMS: NavItem[] = [
  { route: 'home', path: '/', label: 'Home', icon: HomeIcon },
  { route: 'plans', path: '/trening', label: 'Trening', icon: PlansIcon },
  { route: 'analysis', path: '/analiza', label: 'Analiza', icon: AnalysisIcon },
  { route: 'settings', path: '/ustawienia', label: 'Ustawienia', icon: SettingsIcon },
]
