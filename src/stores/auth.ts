import { defineStore } from 'pinia'
import type { UserData } from '@/types/UserData'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | UserData,
  }),
  getters: {
    isLogged: (state) => !!state.user,
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
    logout() {
      this.setUser(null)
    },
  },
})
