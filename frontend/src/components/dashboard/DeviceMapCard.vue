<!--
  DeviceMapCard.vue
  GPS 設備位置地圖組件

  功能:
  - 使用 Leaflet.js 顯示地圖
  - 標記設備 GPS 位置
  - 顯示設備資訊彈窗
  - 支援即時位置更新
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  deviceId: string
  autoRefresh?: boolean
  refreshInterval?: number  // 秒
}

interface GpsLocation {
  deviceId: string
  latitude: number
  longitude: number
  altitude?: number
  timestamp: string
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60
})

// State
const mapContainer = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const location = ref<GpsLocation | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null
let refreshTimer: NodeJS.Timeout | null = null

// 載入 GPS 位置
async function loadGpsLocation(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    const response = await fetch(`${apiUrl}/api/devices/${props.deviceId}/gps/latest`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      throw new Error(`Failed to load GPS location: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && data.data) {
      location.value = data.data
      updateMapMarker()
    } else {
      // 沒有 GPS 數據，使用預設位置 (台北 101)
      location.value = {
        deviceId: props.deviceId,
        latitude: 25.0330,
        longitude: 121.5654,
        timestamp: new Date().toISOString()
      }
      updateMapMarker()
    }
  } catch (err: any) {
    console.error('Failed to load GPS location:', err)
    error.value = err.message || 'Failed to load GPS location'

    // 錯誤時也使用預設位置
    location.value = {
      deviceId: props.deviceId,
      latitude: 25.0330,
      longitude: 121.5654,
      timestamp: new Date().toISOString()
    }
    updateMapMarker()
  } finally {
    loading.value = false
  }
}

// 初始化地圖
function initMap(): void {
  if (!mapContainer.value || map) return

  // 創建地圖 (預設中心為台北)
  map = L.map(mapContainer.value).setView([25.0330, 121.5654], 13)

  // 添加 OpenStreetMap 圖層
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  console.log('[DeviceMapCard] 地圖初始化完成')
}

// 更新地圖標記
function updateMapMarker(): void {
  if (!map || !location.value) return

  const { latitude, longitude } = location.value

  // 移除舊標記
  if (marker) {
    marker.remove()
  }

  // 創建自定義圖標
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-icon">📍</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  })

  // 添加新標記
  marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map)

  // 設置彈窗內容
  const popupContent = `
    <div class="device-popup">
      <h4>設備 ${props.deviceId}</h4>
      <p><strong>緯度:</strong> ${latitude.toFixed(6)}°</p>
      <p><strong>經度:</strong> ${longitude.toFixed(6)}°</p>
      ${location.value.altitude ? `<p><strong>海拔:</strong> ${location.value.altitude.toFixed(1)} m</p>` : ''}
      <p><strong>更新時間:</strong><br>${new Date(location.value.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
    </div>
  `
  marker.bindPopup(popupContent)

  // 移動地圖中心到標記位置
  map.setView([latitude, longitude], 15)

  console.log('[DeviceMapCard] 標記已更新:', { latitude, longitude })
}

// 手動刷新
function refresh(): void {
  loadGpsLocation()
}

// 生命週期
onMounted(() => {
  initMap()
  loadGpsLocation()

  // 自動刷新
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(loadGpsLocation, props.refreshInterval * 1000)
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  if (map) {
    map.remove()
    map = null
  }
})

// Watch deviceId 變化
watch(() => props.deviceId, () => {
  loadGpsLocation()
})
</script>

<template>
  <div class="device-map-card">
    <div class="card-header">
      <h3>📍 設備位置</h3>
      <button @click="refresh" :disabled="loading" class="refresh-btn">
        {{ loading ? '載入中...' : '刷新位置' }}
      </button>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <!-- 位置資訊 -->
    <div v-if="location" class="location-info">
      <div class="info-item">
        <span class="label">緯度:</span>
        <span class="value">{{ location.latitude.toFixed(6) }}°</span>
      </div>
      <div class="info-item">
        <span class="label">經度:</span>
        <span class="value">{{ location.longitude.toFixed(6) }}°</span>
      </div>
      <div v-if="location.altitude" class="info-item">
        <span class="label">海拔:</span>
        <span class="value">{{ location.altitude.toFixed(1) }} m</span>
      </div>
      <div class="info-item">
        <span class="label">更新時間:</span>
        <span class="value">{{ new Date(location.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) }}</span>
      </div>
    </div>

    <!-- 地圖容器 -->
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.device-map-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px 0;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: white;
}

.refresh-btn {
  padding: 6px 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
  margin: 12px;
}

.location-info {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.info-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.map-container {
  height: 400px;
  width: 100%;
}

/* Leaflet 自定義標記樣式 */
:global(.custom-marker) {
  background: none;
  border: none;
}

:global(.marker-icon) {
  font-size: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 彈窗樣式 */
:global(.device-popup) {
  padding: 8px;
  min-width: 200px;
}

:global(.device-popup h4) {
  margin: 0 0 8px 0;
  color: #667eea;
  font-size: 16px;
}

:global(.device-popup p) {
  margin: 4px 0;
  font-size: 13px;
  color: #333;
}

:global(.device-popup strong) {
  color: #666;
}
</style>
