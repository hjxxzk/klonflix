import { createRouter, createWebHistory } from 'vue-router'
import AppHome from '@/components/home/AppHome.vue'
import AppLogin from '@/components/login/AppLogin.vue'
import AppRegister from '@/components/register/AppRegister.vue'
import AppOverview from '@/components/overview/AppOverview.vue'
import AppBrowseSeries from '@/components/browse/AppBrowseSeries.vue'
import AppBrowseMovie from '@/components/browse/AppBrowseMovie.vue'
import AppSearch from '@/components/search/AppSearch.vue'
import AppWatchlist from '@/components/watchlist/AppWatchlist.vue'
import AppAdminLibrary from '@/components/admin/AppAdminLibrary.vue'
import AppPlayback from '@/components/playback/AppPlayback.vue'

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
    {
      path: '/browse/movie/:id',
      name: 'BrowseMovie',
      component: AppBrowseMovie,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/browse/series/:id',
      name: 'BrowseSeries',
      component: AppBrowseSeries,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'Search',
      component: AppSearch,
      props: (route) => ({
        phrase: route.query.phrase,
      }),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/watchlist',
      name: 'Watchlist',
      component: AppWatchlist,
      meta: { requiresAuth: true },
    },
    {

      path: '/admin/library',
      name: 'AdminLibrary',
      component: AppAdminLibrary,
      meta: { requiresAuth: true, requiresLibraryAdmin: true },
    },
    {
      path: '/play/:contentId',
      name: 'Playback',
      component: AppPlayback,
      meta: { requiresAuth: true },
    },
  ],
})

export default router
