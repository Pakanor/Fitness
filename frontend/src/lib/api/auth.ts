import { api } from './client'
import type { AuthMe, LoginDto, RegisterDto } from '@/types'

export function getMe(signal?: AbortSignal): Promise<AuthMe> {
  return api.get<AuthMe>('/api/auth/me', { signal }).then(res => res.data)
}

export function login(body: LoginDto): Promise<{ message: string }> {
  return api.post<{ message: string }>('/api/auth/login', { body }).then(res => res.data)
}

export function register(body: RegisterDto): Promise<{ message: string }> {
  return api.post<{ message: string }>('/api/auth/register', { body }).then(res => res.data)
}

export function logout(): Promise<{ message: string }> {
  return api.post<{ message: string }>('/api/auth/logout').then(res => res.data)
}