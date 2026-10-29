import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, ArrowRight } from 'lucide-react'
import { authApi } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    Username: '',
    Email: '',
    Password: '',
    BirthDate: '',
    CurrentWeight: '',
    Height: '',
    Gender: '',
    JobType: 'sedentary',
    Goal: 'maintain',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: any = { ...form }
      if (payload.BirthDate) payload.BirthDate = new Date(payload.BirthDate).toISOString()
      if (payload.CurrentWeight) payload.CurrentWeight = parseFloat(payload.CurrentWeight)
      if (payload.Height) payload.Height = parseFloat(payload.Height)
      await authApi.register(payload)
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Błąd rejestracji')
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
        <Link to="/login" className="text-sm font-medium text-zinc-700">Masz konto? Zaloguj się</Link>
      </nav>
      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5">
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Utwórz konto</h1>
              <p className="mt-2 text-zinc-600">Rozpocznij swoją przygodę z pompą</p>
            </div>
            <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Nazwa użytkownika</label>
                <input value={form.Username} onChange={(e) => update('Username', e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input type="email" value={form.Email} onChange={(e) => update('Email', e.target.value)} required className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Hasło</label>
                <input type="password" value={form.Password} onChange={(e) => update('Password', e.target.value)} required className="w-full rounded-xl border border-zcing-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Data urodzenia</label>
                <input type="date" value={form.BirthDate} onChange={(e) => update('BirthDate', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Waga (kg)</label>
                <input type="number" step="0.1" value={form.CurrentWeight} onChange={(e) => update('CurrentWeight', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Wzrost (cm)</label>
                <input type="number" step="0.1" value={form.Height} onChange={(e) => update('Height', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Płeć</label>
                <select value={form.Gender} onChange={(e) => update('Gender', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50">
                  <option value="">Wybierz</option>
                  <option value="male">Mężczyzna</option>
                  <option value="female">Kobieta</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Aktywność</label>
                <select value={form.JobType} onChange={(e) => update('JobType', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50">
                  <option value="sedentary">Siedzący</option>
                  <option value="light_active">Lekko aktywny</option>
                  <option value="moderate_active">Średnio aktywny</option>
                  <option value="very_active">Bardzo aktywny</option>
                  <option value="extra_active">Ekstra aktywny</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Cel</label>
                <select value={form.Goal} onChange={(e) => update('Goal', e.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-lime-300/50">
                  <option value="lose">Redukcja</option>
                  <option value="maintain">Utrzymanie</option>
                  <option value="gain">Budowa</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
                <button disabled={loading} className="group inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                  {loading ? 'Rejestracja...' : 'Zarejestruj się'} <ArrowRight size={16} className="ml-2 transition group-hover:translate-x-1" />
                </button>
              </div>
            </form>
          </div>
          <div className="mt-6 text-center text-sm text-zinc-600">
            Masz już konto? <Link to="/login" className="font-medium text-zinc-950 hover:underline">Zaloguj się</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
