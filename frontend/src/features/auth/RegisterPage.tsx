import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import type { RegisterDto } from '@/types'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordChecks = useMemo(
    () => [
      { label: 'min. 8 znaków', ok: password.length >= 8 },
      { label: 'wielka litera', ok: /[A-Z]/.test(password) },
      { label: 'mała litera', ok: /[a-z]/.test(password) },
      { label: 'cyfra', ok: /[0-9]/.test(password) },
      { label: 'znak specjalny', ok: /[^a-zA-Z0-9]/.test(password) },
    ],
    [password],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (username.trim().length < 3 || username.trim().length > 20) {
      setError('Nazwa użytkownika musi mieć od 3 do 20 znaków.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Niepoprawny format adresu email.')
      return
    }
    if (passwordChecks.some((c) => !c.ok)) {
      setError('Hasło nie spełnia wymagań (patrz listę poniżej).')
      return
    }

    const body: RegisterDto = { username: username.trim(), email: email.trim(), password }

    setSubmitting(true)
    try {
      await register(body)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Nie udało się utworzyć konta. Spróbuj ponownie.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="space-y-1 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-inner bg-primary font-display text-xl font-bold text-primary-ink">
            F
          </span>
          <h1 className="pt-2 font-display text-xl font-bold">Utwórz konto</h1>
          <p className="text-sm text-ink-dim">FitnessApp</p>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-ink-dim">Nazwa użytkownika (3–20 znaków)</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
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

        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {passwordChecks.map((c) => (
            <li
              key={c.label}
              className={c.ok ? 'text-primary' : 'text-ink-dim'}
            >
              {c.ok ? '✓' : '○'} {c.label}
            </li>
          ))}
        </ul>

        {error && (
          <p
            role="alert"
            className="rounded-inner bg-muscle-primary/10 px-3 py-2 text-sm text-muscle-primary"
          >
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
