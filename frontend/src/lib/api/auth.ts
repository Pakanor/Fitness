import { api } from './client'
import type { AuthMe, LoginDto, RegisterDto } from '@/types'

export function getMe(signal?: AbortSignal) {
  return api.get<AuthMe>('/api/auth/me', { signal })
}

export function login(body: LoginDto) {
  return api.post<{ message: string }>('/api/auth/login', { body })
}

export function register(body: RegisterDto) {
  return api.post<{ message: string }>('/api/auth/register', { body })
}

export function logout() {
  return api.post<{ message: string }>('/api/auth/logout')
}
