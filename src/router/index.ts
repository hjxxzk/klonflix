import { createRouter, createWebHistory } from 'vue-router'
import AppHome from '@/components/home/AppHome.vue'
import AppLogin from '@/components/login/AppLogin.vue'
import AppRegister from '@/components/register/AppRegister.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: AppHome,
    },
    {
      path: '/login',
      name: 'Login',
      component: AppLogin,
    },
    {
      path: '/register',
      name: 'Register',
      component: AppRegister,
    },
  ],
})

export default router
