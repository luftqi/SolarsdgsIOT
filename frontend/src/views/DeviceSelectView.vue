<template>
  <div class="device-select-container">
    <!-- 頂部導航欄 -->
    <div class="navbar">
      <div class="navbar-left">
        <img :src="logoBase64" alt="SOLARSDGS" class="navbar-logo">
        <span class="navbar-title">SolarSDGs IoT</span>
      </div>
      <div class="navbar-right">
        <span class="user-name">👤 {{ userName }}</span>
        <button @click="handleLogout" class="btn-logout">登出</button>
      </div>
    </div>

    <!-- 設備選擇主內容 -->
    <div class="device-select-content">
      <div class="select-header">
        <h1>選擇監控設備</h1>
        <p class="subtitle">請選擇要監控的太陽能發電設備</p>
      </div>

      <!-- 載入中 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>載入設備列表中...</p>
      </div>

      <!-- 錯誤訊息 -->
      <div v-else-if="error" class="error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-message">{{ error }}</p>
        <button @click="loadDevices" class="btn-retry">重新載入</button>
      </div>

      <!-- 設備卡片列表 -->
      <div v-else class="device-grid">
        <div
          v-for="device in devices"
          :key="device.device_id"
          class="device-card"
          :class="{ 'device-offline': device.status !== 'online' }"
          @click="selectDevice(device)"
        >
          <!-- 設備狀態指示器 -->
          <div class="device-status">
            <span
              class="status-dot"
              :class="{ on: device.status === 'online' }"
            ></span>
            <span class="status-text">
              {{ device.status === 'online' ? '在線' : '離線' }}
            </span>
          </div>

          <!-- 設備資訊 -->
          <div class="device-info">
            <div class="device-icon">🔆</div>
            <h3>設備 {{ device.device_id }}</h3>
            <p class="device-name">{{ device.device_name || '太陽能發電系統' }}</p>
          </div>

          <!-- 設備統計 -->
          <div class="device-stats">
            <div class="stat-item">
              <span class="stat-label">設備類型</span>
              <span class="stat-value">{{ device.device_type || 'Solar' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最後上線</span>
              <span class="stat-value">{{ formatDate(device.last_seen) }}</span>
            </div>
          </div>

          <!-- 最後更新時間 -->
          <div class="device-footer">
            <span class="last-update">
              {{ device.last_seen ? `更新於 ${formatDate(device.last_seen)}` : '暫無數據' }}
            </span>
          </div>
        </div>

        <!-- 無設備提示 -->
        <div v-if="devices.length === 0" class="no-devices">
          <p class="empty-icon">📭</p>
          <p class="empty-message">暫無可用設備</p>
          <p class="empty-hint">請聯繫管理員添加設備</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Logo (與 LoginView 相同)
const logoBase64 = ref('/logo.png')

const router = useRouter()

// 設備介面定義
interface Device {
  device_id: string
  device_name?: string
  device_type?: string
  status: string
  last_seen?: string
  created_at?: string
  updated_at?: string
}

// 狀態
const devices = ref<Device[]>([])
const loading = ref(false)
const error = ref('')
const userName = ref('')

/**
 * 格式化日期
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW')
  } catch {
    return 'N/A'
  }
}

/**
 * 載入設備列表
 */
async function loadDevices() {
  loading.value = true
  error.value = ''

  try {
    // 從 localStorage 讀取 token 和 user
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      // 未登入，跳轉到登入頁
      await router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    userName.value = user.customer_name || user.customer_code

    // API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    // 獲取設備列表
    const response = await axios.get(`${apiUrl}/api/devices`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    console.log('API Response:', response.data)

    if (response.data.success) {
      // 修正: API 回傳格式是 { success: true, data: { count, devices } }
      devices.value = response.data.data?.devices || []
      console.log('✅ 設備列表載入成功:', devices.value)
    } else {
      error.value = response.data.message || '載入設備列表失敗'
    }
  } catch (err: any) {
    console.error('❌ 載入設備錯誤:', err)

    if (err.response?.status === 401) {
      // Token 過期或無效
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      await router.push('/login')
    } else {
      error.value = err.response?.data?.message || '載入設備列表失敗'
    }
  } finally {
    loading.value = false
  }
}

/**
 * 選擇設備
 */
function selectDevice(device: Device) {
  // Phase 2.4: 允許進入 Dashboard，即使設備離線
  // 用戶仍然可以查看歷史數據和設備資訊

  // 儲存選中的設備 ID
  localStorage.setItem('selectedDeviceId', device.device_id)

  console.log('✅ 選擇設備:', device.device_id, '- 狀態:', device.status)

  // 跳轉到儀表板
  router.push('/dashboard')
}

/**
 * 登出
 */
function handleLogout() {
  // 清除登入資訊
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('selectedDeviceId')

  console.log('✅ 已登出')

  // 跳轉到登入頁
  router.push('/login')
}

// 載入設備列表
onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
/* ========================================
   設備選擇容器
   ======================================== */
.device-select-container {
  width: 100vw;
  min-height: 100vh;
  background: #3e5563;
  display: flex;
  flex-direction: column;
}

/* ========================================
   導航欄
   ======================================== */
.navbar {
  background: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: white;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.navbar-title {
  font-size: 20px;
  font-weight: 700;
  color: #FFC107;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  font-size: 14px;
  color: #ecf0f1;
  font-weight: 600;
}

.btn-logout {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

/* ========================================
   主內容區域
   ======================================== */
.device-select-content {
  flex: 1;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.select-header {
  text-align: center;
  margin-bottom: 40px;
}

.select-header h1 {
  font-size: 36px;
  color: #FFC107;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 16px;
  color: #b0bec5;
  margin: 0;
}

/* ========================================
   載入中狀態
   ======================================== */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #ecf0f1;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #34495e;
  border-top: 4px solid #FFC107;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ========================================
   錯誤狀態
   ======================================== */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-message {
  font-size: 18px;
  color: #e74c3c;
  margin-bottom: 30px;
}

.btn-retry {
  padding: 12px 24px;
  background: #FFC107;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #FFB300;
  transform: translateY(-2px);
}

/* ========================================
   設備卡片網格
   ======================================== */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.device-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-color: #FFC107;
}

.device-card.device-offline {
  opacity: 0.6;
  cursor: not-allowed;
}

.device-card.device-offline:hover {
  transform: none;
  border-color: transparent;
}

/* ========================================
   設備狀態
   ======================================== */
.device-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #bdc3c7;
  transition: all 0.3s;
}

.status-dot.on {
  background: #2ecc71;
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.6);
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #7f8c8d;
}

/* ========================================
   設備資訊
   ======================================== */
.device-info {
  text-align: center;
  margin-bottom: 20px;
}

.device-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.device-info h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.device-name {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

/* ========================================
   設備統計
   ======================================== */
.device-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #ecf0f1;
  border-bottom: 1px solid #ecf0f1;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

/* ========================================
   設備頁腳
   ======================================== */
.device-footer {
  text-align: center;
}

.last-update {
  font-size: 12px;
  color: #95a5a6;
}

/* ========================================
   無設備提示
   ======================================== */
.no-devices {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #ecf0f1;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-message {
  font-size: 20px;
  color: #ecf0f1;
  margin: 0 0 10px 0;
}

.empty-hint {
  font-size: 14px;
  color: #b0bec5;
  margin: 0;
}

/* ========================================
   響應式設計
   ======================================== */
@media (max-width: 768px) {
  .navbar {
    padding: 12px 16px;
  }

  .navbar-title {
    font-size: 16px;
  }

  .user-name {
    display: none;
  }

  .select-header h1 {
    font-size: 28px;
  }

  .device-grid {
    grid-template-columns: 1fr;
  }
}
</style>
