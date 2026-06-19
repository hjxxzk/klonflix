import { createRouter, createWebHistory } from 'vue-router'
import AppHome from '@/components/home/AppHome.vue'
import AppLogin from '@/components/login/AppLogin.vue'
import AppRegister from '@/components/register/AppRegister.vue'
import AppOverview from '@/components/overview/AppOverview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: AppHome,
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: AppLogin,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: AppRegister,
      meta: { guestOnly: true },
    },
    {
      path: '/overview',
      name: 'Overview',
      component: AppOverview,
      meta: { requiresAuth: true },
    },
  ],
})

export default router
