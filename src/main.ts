import { createApp } from 'vue'
import { createPinia } from 'pinia'
import BootstrapVue3 from 'bootstrap-vue-3'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth.ts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(BootstrapVue3)
app.use(router)

const auth = useAuthStore(pinia)
auth.initFromStorage()

router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !auth.isLogged) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.guestOnly && auth.isLogged) {
    return { name: 'Overview' }
  }
})

app.mount('#app')
