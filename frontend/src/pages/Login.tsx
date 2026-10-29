import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [emailOrLogin, setEmailOrLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login({ EmailOrLogin: emailOrLogin, Password: password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-zinc-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-lime-300"><Dumbbell aria-hidden="true" /></span>
          <span className="text-xl">pompa<span className="text-lime-500">.</span></span>
        </Link>
        <Link to="/register" className="text-sm font-medium text-zinc-700">Nie masz konta? Zarejestruj się</Link>
      </nav>
      <section className="mx-auto flex max-w-7xl items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5">
            <div className="p-8 sm:p-10">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Zaloguj się</h1>
                <p className="mt-2 text-zinc-600">Witaj ponownie w pompie</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email lub nazwa użytkownika</label>
                  <input 
                    value={emailOrLogin} 
                    onChange={(e) => setEmailOrLogin(e.target.value)} 
                    required 
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" 
                    placeholder="Wpisz email lub login"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Hasło</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" 
                      placeholder="Wpisz hasło"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
                <button disabled={loading} className="group inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:hover:translate-y-0">
                  {loading ? 'Logowanie...' : 'Zaloguj się'} <ArrowRight size={16} className="ml-2 transition group-hover:translate-x-1" />
                </button>
              </form>
            </div>
            <div class="border-t border-zinc-100 px-8 py-6 text-center text-sm text-zinc-600 sm:px-10">
              Nie masz konta? <Link to="/register" className="font-medium text-zinc-950 hover:underline">Zarejestruj się</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
