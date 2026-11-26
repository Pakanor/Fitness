import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ApiError } from '@/lib/api/client'

/**
 * Minimal login screen so the protected layout has a redirect target
 * (ticket 01). Full register/login UX is built out in ticket 02.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [emailOrLogin, setEmailOrLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ emailOrLogin, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się zalogować.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="space-y-1 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-inner bg-primary font-display text-xl font-bold text-primary-ink">
            F
          </span>
          <h1 className="pt-2 font-display text-xl font-bold">Zaloguj się</h1>
          <p className="text-sm text-ink-dim">FitnessApp</p>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Email lub login</span>
          <input
            type="text"
            autoComplete="username"
            value={emailOrLogin}
            onChange={(e) => setEmailOrLogin(e.target.value)}
            required
            className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Hasło</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-muscle-primary">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-inner bg-primary px-4 py-2.5 font-semibold text-primary-ink shadow-active transition-opacity disabled:opacity-60"
        >
          {submitting ? 'Logowanie…' : 'Zaloguj się'}
        </button>

        <p className="text-center text-sm text-ink-dim">
          Nie masz konta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Utwórz konto
          </Link>
        </p>
      </form>
    </div>
  )
}
