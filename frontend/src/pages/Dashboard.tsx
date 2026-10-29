import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Dumbbell, LogOut } from 'lucide-react'
import { authApi } from '../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then((data) => {
        if (!data.authenticated) {
          navigate('/login')
          return
        }
        setUser(data)
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f1] grid place-items-center">
        <p className="text-zinc-600">Ładowanie...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-zinc-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-lime-300"><Dumbbell aria-hidden="true" /></span>
          <span className="text-xl">pompa<span className="text-lime-500">.</span></span>
        </Link>
        <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
          <LogOut size={16} /> Wyloguj
        </button>
      </nav>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="rounded-3xl bg-zinc-950 p-8 text-white sm:p-10">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Witaj, {user?.username}</h1>
          <p className="mt-3 text-zinc-400">Twój panel treningowy</p>
        </div>
      </section>
    </main>
  )
}
