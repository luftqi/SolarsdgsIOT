import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

/**
 * Vue Router 配置
 * 從 Node-RED Dashboard 遷移
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'SolarSDGs IoT - 太陽能監控系統'
      }
    }
  ]
})

// 更新頁面標題
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
