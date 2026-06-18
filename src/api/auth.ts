import { apiFetch } from '@/api/client'
import type { UserData } from '@/types/UserData'

interface Credentials {
  email: string
  password: string
}

export function login(credentials: Credentials): Promise<UserData> {
  return apiFetch<UserData>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(credentials: Credentials): Promise<UserData> {
  return apiFetch<UserData>('/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logout(accessToken: string): Promise<void> {
  return apiFetch<void>(
    '/logout',
    {
      method: 'POST',
    },
    accessToken,
  )
}
