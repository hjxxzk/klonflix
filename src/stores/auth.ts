import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import type { UserData } from '@/types/UserData'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | UserData,
  }),
  getters: {
    isLogged: (state) => {
      if (!state.user) return false
      const now = Math.floor(Date.now() / 1000)
      return state.user.expiresAt > now
    },
  },
  actions: {
    setUser(user: UserData | null) {
      this.user = user
      if (user) localStorage.setItem('user', JSON.stringify(user))
      else localStorage.removeItem('user')
    },
    initFromStorage() {
      const raw = localStorage.getItem('user')
      if (raw) {
        try {
          this.user = JSON.parse(raw) as UserData
        } catch {
          this.user = null
        }
      }
    },
    async login(email: string, password: string) {
      const user = await authApi.login({ email, password })
      this.setUser(user)
    },
    async register(email: string, password: string) {
      const user = await authApi.register({ email, password })
      this.setUser(user)
    },
    async logout() {
      const token = this.user?.accessToken
      if (token) {
        try {
          await authApi.logout(token)
        } catch {
          // clear local session even when server logout fails
        }
      }
      this.setUser(null)
    },
  },
})
