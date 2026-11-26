import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

/**
 * Public registration screen (ticket 02). POST /api/auth/register does NOT set
 * the auth cookie, so on success we send the user to /login to sign in.
 */
export default function RegisterPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({ username, email, password })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się utworzyć konta.')
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
          <h1 className="pt-2 font-display text-xl font-bold">Utwórz konto</h1>
          <p className="text-sm text-ink-dim">FitnessApp</p>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Nazwa użytkownika</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-inner border border-rule bg-surface-2 px-3 py-2 outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Hasło</span>
          <input
            type="password"
            autoComplete="new-password"
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
          {submitting ? 'Tworzenie konta…' : 'Utwórz konto'}
        </button>

        <p className="text-center text-sm text-ink-dim">
          Masz już konto?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Zaloguj się
          </Link>
        </p>
      </form>
    </div>
  )
}
