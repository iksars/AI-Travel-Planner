import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      redirect: '/auth',
    },
    {
      path: '/plans',
      name: 'plans',
      component: () => import('../views/PlansView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plans/:id',
      name: 'plan-detail',
      component: () => import('../views/PlanDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ai-generator',
      name: 'ai-generator',
      component: () => import('../views/AIGeneratorView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next({ name: 'auth', query: { redirect: to.fullPath } })
  } else if ((to.name === 'auth' || to.name === 'login') && authStore.isAuthenticated) {
    // 已登录用户访问登录页，跳转到计划页
    next({ name: 'plans' })
  } else {
    next()
  }
})

export default router
