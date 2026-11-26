import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

/**
 * Gate for authenticated routes (UI-SPEC 6: 401 → redirect to login).
 * While the session is being resolved we render nothing to avoid a flash.
 */
export function ProtectedLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid h-full place-items-center text-ink-dim">
        <span className="font-mono text-sm">Ładowanie…</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
