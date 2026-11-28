import { useNavigate } from 'react-router-dom'
import { Avatar } from './Avatar'
import { useAuth } from '@/features/auth/AuthContext'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold">{user?.username ?? ''}</p>
      </div>
      <Avatar name={user?.username} size={36} />
      <button
        type="button"
        onClick={onLogout}
        className="rounded-inner border border-rule px-3 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:text-ink"
      >
        Wyloguj
      </button>
    </div>
  )
}
