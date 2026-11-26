import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '@/lib/api/client'
import { getMe, login as loginRequest, logout as logoutRequest } from '@/lib/api/auth'
import type { AuthMe, LoginDto } from '@/types'

interface AuthContextValue {
  user: AuthMe | null
  loading: boolean
  /** Authenticate with email/login + password. */
  login: (body: LoginDto) => Promise<void>
  /** Clear the session cookie and drop the cached user. */
  logout: () => Promise<void>
  /** Re-fetch the current user (e.g. after profile edits). */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const me = await getMe()
      setUser(me)
    } catch (err) {
      // 401 → unauthenticated; anything else also leaves us logged out.
      if (!(err instanceof ApiError) || err.status === 401) {
        // swallow — treat as logged out
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (body: LoginDto) => {
    await loginRequest(body)
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
