import { api } from './client'
import type { AuthMe, LoginDto, RegisterDto } from '@/types'

/** GET /api/auth/me — 401 when unauthenticated (caller redirects to /login). */
export function getMe(signal?: AbortSignal) {
  return api.get<AuthMe>('/api/auth/me', { signal })
}

/** POST /api/auth/login — sets HttpOnly cookie; Gateway returns Location: /home. */
export function login(body: LoginDto) {
  return api.post<{ message: string }>('/api/auth/login', { body })
}

/** POST /api/auth/register */
export function register(body: RegisterDto) {
  return api.post<{ message: string }>('/api/auth/register', { body })
}

/** POST /api/auth/logout — clears the cookie. */
export function logout() {
  return api.post<{ message: string }>('/api/auth/logout')
}
