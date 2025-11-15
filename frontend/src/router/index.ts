import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DeviceSelectView from '../views/DeviceSelectView.vue'
import DashboardView from '../views/DashboardView.vue'

/**
 * Vue Router 配置
 * Phase 2.3: 完整的三頁面流程
 * 1. Login (登入)
 * 2. Device Selection (設備選擇)
 * 3. Dashboard (即時儀表板)
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'SolarSDGs IoT - 登入',
        requiresAuth: false
      }
    },
    {
      path: '/devices',
      name: 'devices',
      component: DeviceSelectView,
      meta: {
        title: 'SolarSDGs IoT - 選擇設備',
        requiresAuth: true
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'SolarSDGs IoT - 即時監控',
        requiresAuth: true
      }
    }
  ]
})

/**
 * 路由守衛 (Authentication Guard)
 * 100% 沿用 Node-RED 認證邏輯
 */
router.beforeEach((to, _from, next) => {
  // 更新頁面標題
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 檢查是否需要認證
  const requiresAuth = to.meta.requiresAuth
  const token = localStorage.getItem('token')

  if (requiresAuth && !token) {
    // 需要認證但沒有 token，跳轉到登入頁
    console.log('⚠️ 未登入，跳轉到登入頁')
    next('/login')
  } else if (!requiresAuth && token && to.path === '/login') {
    // 已登入但訪問登入頁，跳轉到設備選擇頁
    console.log('✅ 已登入，跳轉到設備選擇頁')
    next('/devices')
  } else {
    next()
  }
})

export default router
