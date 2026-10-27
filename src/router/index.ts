import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { showLoading, hideLoading } from '@/utils/alert'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: { loadingTitle: 'Otvaranje početne stranice...', loadingText: 'Pripremamo ponudu za vas.' },
    },
    {
      path: '/plants',
      component: () => import('@/views/PlantsView.vue'),
      meta: { loadingTitle: 'Otvaranje ponude biljaka...', loadingText: 'Učitavamo katalog.' },
    },
    {
      path: '/plants/:id',
      component: () => import('@/views/PlantDetailView.vue'),
      meta: { loadingTitle: 'Otvaranje biljke...', loadingText: 'Učitavamo detalje i recenzije.' },
    },
    {
      path: '/cart',
      component: () => import('@/views/CartView.vue'),
      meta: { requiresAuth: true, loadingTitle: 'Otvaranje korpe...', loadingText: 'Učitavamo vaše rezervacije.' },
    },
    {
      path: '/profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, loadingTitle: 'Otvaranje profila...', loadingText: 'Učitavamo vaše podatke.' },
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { loadingTitle: 'Otvaranje prijave...', loadingText: 'Molimo sačekajte trenutak.' },
    },
    {
      path: '/register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { loadingTitle: 'Otvaranje registracije...', loadingText: 'Molimo sačekajte trenutak.' },
    },
  ],
})

let routeToken = 0

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  routeToken = showLoading(
    to.meta.loadingTitle ?? 'Učitavanje stranice...',
    to.meta.loadingText ?? 'Molimo sačekajte trenutak.',
  )
})

router.afterEach(() => {
  hideLoading(routeToken, 300)
})

router.onError(() => {
  hideLoading(routeToken, 0)
})

export default router