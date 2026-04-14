import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'cases',
          name: 'Cases',
          component: () => import('@/views/cases/CaseListView.vue'),
          meta: { title: '案例管理' }
        },
        {
          path: 'cases/create',
          name: 'CaseCreate',
          component: () => import('@/views/cases/CaseFormView.vue'),
          meta: { title: '新增案例' }
        },
        {
          path: 'cases/:id/edit',
          name: 'CaseEdit',
          component: () => import('@/views/cases/CaseFormView.vue'),
          meta: { title: '编辑案例' }
        },
        {
          path: 'cases/:id',
          name: 'CaseDetail',
          component: () => import('@/views/cases/CaseDetailView.vue'),
          meta: { title: '案例详情' }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/UserListView.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'crawler',
          name: 'Crawler',
          component: () => import('@/views/crawler/CrawlerView.vue'),
          meta: { title: '爬虫管理' }
        },
        {
          path: 'hot-keywords',
          name: 'HotKeywords',
          component: () => import('@/views/hotKeywords/HotKeywordView.vue'),
          meta: { title: '热门搜索词' }
        },
        {
          path: 'feedback',
          name: 'Feedback',
          component: () => import('@/views/feedback/FeedbackListView.vue'),
          meta: { title: '用户反馈' }
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
