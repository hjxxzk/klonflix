export type UserRole = 'VIEWER' | 'LIBRARY_ADMIN'

export interface UserData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  viewerId: string
  role: UserRole
}
