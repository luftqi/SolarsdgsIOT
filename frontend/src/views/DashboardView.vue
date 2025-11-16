<template>
  <div class="dashboard-container">
    <!-- 頂部導航欄 -->
    <div class="navbar">
      <div class="navbar-left">
        <img :src="logoPath" alt="SOLARSDGS" class="navbar-logo">
        <span class="navbar-title">SolarSDGs IoT</span>
        <span class="device-badge">設備 {{ deviceId }}</span>
      </div>
      <div class="navbar-right">
        <span class="connection-status" :class="{ connected: isConnected }">
          {{ isConnected ? '🟢 已連線' : '🔴 未連線' }}
        </span>
        <span class="user-name">👤 {{ userName }}</span>
        <button @click="handleBack" class="btn-back">返回設備列表</button>
        <button @click="handleLogout" class="btn-logout">登出</button>
      </div>
    </div>

    <!-- 主內容區域 -->
    <div class="dashboard-content">
      <!-- 載入中 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>載入設備數據中...</p>
      </div>

      <!-- 錯誤訊息 -->
      <div v-else-if="error" class="error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-message">{{ error }}</p>
        <button @click="loadDashboard" class="btn-retry">重新載入</button>
      </div>

      <!-- Dashboard 主內容 -->
      <div v-else class="dashboard-main">
        <!-- 設備資訊與狀態 (移到最上方) -->
        <div class="info-section">
          <h2 class="section-title">設備資訊</h2>
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">設備名稱</div>
              <div class="info-value">{{ deviceInfo?.device_name || 'N/A' }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">設備類型</div>
              <div class="info-value">{{ deviceInfo?.device_type || 'N/A' }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">設備狀態</div>
              <div class="info-value" :class="getStatusClass(deviceInfo?.status)">
                {{ getStatusText(deviceInfo?.status) }}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">最後更新</div>
              <div class="info-value">{{ formatDateTime(latestData?.timestamp) }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">數據總數</div>
              <div class="info-value">{{ dataCount }} 筆</div>
            </div>
            <div class="info-card">
              <div class="info-label">自動刷新</div>
              <div class="info-value">每 5 秒</div>
            </div>
          </div>
        </div>

        <!-- 即時功率卡片 -->
        <div class="power-section">
          <h2 class="section-title">即時功率數據</h2>
          <div class="power-cards">
            <div class="power-card pg-card">
              <div class="card-header">
                <div class="card-icon">⚡</div>
                <h3>發電功率 (PG)</h3>
              </div>
              <div class="card-value">{{ formatNumber(latestData?.pg) }}<span class="unit">W</span></div>
              <div class="card-footer">Generation Power</div>
            </div>

            <div class="power-card pa-card">
              <div class="card-header">
                <div class="card-icon">🔌</div>
                <h3>負載 A (PA)</h3>
              </div>
              <div class="card-value">{{ formatNumber(latestData?.pa) }}<span class="unit">W</span></div>
              <div class="efficiency" :class="getEfficiencyClass(pagEfficiency)">
                {{ formatEfficiency(pagEfficiency) }}
              </div>
            </div>

            <div class="power-card pp-card">
              <div class="card-header">
                <div class="card-icon">💡</div>
                <h3>負載 P (PP)</h3>
              </div>
              <div class="card-value">{{ formatNumber(latestData?.pp) }}<span class="unit">W</span></div>
              <div class="efficiency" :class="getEfficiencyClass(ppgEfficiency)">
                {{ formatEfficiency(ppgEfficiency) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Factor 設定 (修正係數) -->
        <div class="factor-section">
          <h2 class="section-title">Factor 設定 (效率修正係數)</h2>
          <div class="factor-controls">
            <div class="factor-input-group">
              <label for="factor-a">Factor A (PA修正):</label>
              <input
                id="factor-a"
                v-model.number="factorA"
                type="number"
                step="0.01"
                min="0.5"
                max="2.0"
                class="factor-input"
              />
            </div>
            <div class="factor-input-group">
              <label for="factor-p">Factor P (PP修正):</label>
              <input
                id="factor-p"
                v-model.number="factorP"
                type="number"
                step="0.01"
                min="0.5"
                max="2.0"
                class="factor-input"
              />
            </div>
            <button @click="updateFactors" class="btn-update-factor" :disabled="updatingFactor">
              {{ updatingFactor ? '更新中...' : '更新 Factor' }}
            </button>
            <button @click="resetFactors" class="btn-reset-factor">
              重置為 1.0
            </button>
          </div>
          <div class="factor-info">
            <p>💡 Factor 用於修正功率數據的效率計算</p>
            <p>公式: PGA% = (PA × Factor_A - PG) / PG × 100</p>
            <p>公式: PGP% = (PP × Factor_P - PG) / PG × 100</p>
          </div>
        </div>

        <!-- 功率趨勢圖表 -->
        <div class="chart-section">
          <div class="section-header">
            <h2 class="section-title">功率趨勢圖</h2>
            <div class="chart-controls">
              <select v-model="chartTimeRange" @change="updateChart" class="time-range-select">
                <option value="1">1 分鐘/點 (過去 60 分鐘)</option>
                <option value="5">5 分鐘/點 (過去 5 小時)</option>
                <option value="10">10 分鐘/點 (過去 10 小時)</option>
                <option value="30">30 分鐘/點 (過去 30 小時)</option>
                <option value="60">1 小時/點 (過去 60 小時)</option>
                <option value="360">6 小時/點 (過去 15 天)</option>
                <option value="1440">1 天/點 (過去 60 天)</option>
              </select>
              <button @click="openDownloadModal" class="btn-download">
                📥 下載資料 (CSV)
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

        <!-- 效率趨勢圖 (新增) -->
        <div class="chart-section">
          <div class="section-header">
            <h2 class="section-title">效率趨勢圖 (PGA% / PGP%)</h2>
            <div class="chart-controls">
              <select v-model="efficiencyTimeRange" @change="updateEfficiencyChart" class="time-range-select">
                <option value="60">最近 1 小時</option>
                <option value="180">最近 3 小時</option>
                <option value="360">最近 6 小時</option>
                <option value="720">最近 12 小時</option>
                <option value="1440">最近 1 天</option>
                <option value="4320">最近 3 天</option>
                <option value="10080">最近 1 週</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="efficiencyChartCanvas"></canvas>
          </div>
        </div>

        <!-- 最新圖像 (Phase 3.1) -->
        <LatestImageCard
          :device-id="deviceId"
          :auto-refresh="true"
          :refresh-interval="60"
        />
      </div>
    </div>

    <!-- CSV 下載模態框 -->
    <div v-if="showDownloadModal" class="modal-overlay" @click="closeDownloadModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📥 下載發電資料 (CSV)</h3>
          <button @click="closeDownloadModal" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="date-picker-group">
            <label for="start-date">開始日期:</label>
            <input
              id="start-date"
              v-model="downloadStartDate"
              type="datetime-local"
              class="date-input"
            />
          </div>
          <div class="date-picker-group">
            <label for="end-date">結束日期:</label>
            <input
              id="end-date"
              v-model="downloadEndDate"
              type="datetime-local"
              class="date-input"
            />
          </div>
          <div class="modal-hint">
            💡 將下載指定時間範圍內的所有原始數據（未經聚合）
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDownloadModal" class="btn-cancel">取消</button>
          <button @click="downloadPowerData" class="btn-confirm" :disabled="downloadingData">
            {{ downloadingData ? '下載中...' : '確認下載' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,  // 新增: LineController 是必需的！
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import LatestImageCard from '@/components/dashboard/LatestImageCard.vue'

// 註冊 Chart.js 組件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,  // 新增: 註冊 LineController
  Title,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()
const logoPath = ref('/logo.png')

// 設備資料介面
interface PowerData {
  id: number
  deviceId: string
  timestamp: string
  pg: number
  pa: number
  pp: number
  pagEfficiency: number  // 修正: 使用正確的欄位名稱
  pgpEfficiency: number  // 修正: 使用正確的欄位名稱
}

interface DeviceInfo {
  device_id: string
  device_name?: string
  device_type?: string
  status: string
  last_seen?: string
}

// 狀態管理
const deviceId = ref('')
const userName = ref('')
const loading = ref(false)
const error = ref('')
const isConnected = ref(false)

const latestData = ref<PowerData | null>(null)
const historicalData = ref<PowerData[]>([])
const deviceInfo = ref<DeviceInfo | null>(null)
const dataCount = ref(0)

const chartCanvas = ref<HTMLCanvasElement | null>(null)
// 時間粒度（分鐘/點）
const chartTimeRange = ref('10')  // 預設 10 分鐘/點
const efficiencyChartCanvas = ref<HTMLCanvasElement | null>(null)
const efficiencyTimeRange = ref('60')
let chartInstance: Chart | null = null
let efficiencyChartInstance: Chart | null = null
let refreshInterval: NodeJS.Timeout | null = null

// Factor 設定
const factorA = ref(1.0)
const factorP = ref(1.0)
const updatingFactor = ref(false)

// 下載狀態
const downloadingData = ref(false)
const showDownloadModal = ref(false)
const downloadStartDate = ref('')
const downloadEndDate = ref('')

// 計算效率
const pagEfficiency = computed(() => {
  if (!latestData.value?.pagEfficiency) return 0
  // 將字串轉為數字
  return typeof latestData.value.pagEfficiency === 'string'
    ? parseFloat(latestData.value.pagEfficiency)
    : latestData.value.pagEfficiency
})

const ppgEfficiency = computed(() => {
  if (!latestData.value?.pgpEfficiency) return 0
  // 將字串轉為數字
  return typeof latestData.value.pgpEfficiency === 'string'
    ? parseFloat(latestData.value.pgpEfficiency)
    : latestData.value.pgpEfficiency
})

// 格式化函數
function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '0'
  return value.toLocaleString('zh-TW')
}

function formatEfficiency(value: number): string {
  const formatted = value.toFixed(2)
  return value >= 0 ? `+${formatted}%` : `${formatted}%`
}

function getEfficiencyClass(value: number): string {
  if (value > 10) return 'efficiency-high'
  if (value > 0) return 'efficiency-positive'
  if (value > -10) return 'efficiency-negative'
  return 'efficiency-low'
}

function getStatusClass(status?: string): string {
  return status === 'online' ? 'status-online' : 'status-offline'
}

function getStatusText(status?: string): string {
  return status === 'online' ? '在線' : '離線'
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

// 初始載入 Dashboard（只在首次載入時顯示 loading）
async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    deviceId.value = localStorage.getItem('selectedDeviceId') || ''

    if (!token || !userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    userName.value = user.customerName || user.customerCode

    if (!user.devices || !user.devices.includes(deviceId.value)) {
      error.value = `無權訪問設備 ${deviceId.value}`
      setTimeout(() => router.push('/devices'), 2000)
      return
    }

    await refreshData()
    isConnected.value = true
    console.log('Dashboard loaded successfully')

  } catch (err: any) {
    console.error('Dashboard loading error:', err)

    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    } else if (err.response?.status === 403) {
      error.value = err.response.data.message || '無權訪問此設備'
      setTimeout(() => router.push('/devices'), 2000)
    } else {
      error.value = err.response?.data?.message || 'Dashboard 載入失敗'
    }
    isConnected.value = false
  } finally {
    loading.value = false
  }
}

// 刷新數據（靜默更新，不顯示 loading，避免閃爍）
async function refreshData() {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    // 並行載入設備資訊和最新數據
    const [deviceResponse, latestResponse] = await Promise.all([
      axios.get(
        `${apiUrl}/api/devices/${deviceId.value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `${apiUrl}/api/power-data/${deviceId.value}/latest`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ])

    if (deviceResponse.data.success) {
      deviceInfo.value = deviceResponse.data.data
    }

    if (latestResponse.data.success) {
      latestData.value = latestResponse.data.data
    }

    await loadHistoricalData()

  } catch (err: any) {
    console.error('Data refresh error:', err)
    // 靜默失敗，不影響用戶體驗
    if (err.response?.status === 401) {
      router.push('/login')
    }
  }
}

async function loadHistoricalData() {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'
    const interval = parseInt(chartTimeRange.value)  // 時間粒度（分鐘/點）
    const points = 60  // 固定 60 個資料點

    console.log(`[loadHistoricalData] 載入聚合數據: interval=${interval}分鐘, points=${points}`)

    const response = await axios.get(
      `${apiUrl}/api/power-data/device/${deviceId.value}/aggregated`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { interval, points }
      }
    )

    if (response.data.success) {
      // 後端返回的 records 包含 bucket_time, avg_pg, avg_pa, avg_pp, avg_pag, avg_pgp
      const records = response.data.data.records

      // 轉換為前端需要的格式
      historicalData.value = records.map((record: any) => ({
        timestamp: record.bucket_time,
        pg: parseFloat(record.avg_pg) || 0,
        pa: parseFloat(record.avg_pa) || 0,
        pp: parseFloat(record.avg_pp) || 0,
        pag_efficiency: parseFloat(record.avg_pag) || 0,
        pgp_efficiency: parseFloat(record.avg_pgp) || 0
      }))

      dataCount.value = historicalData.value.length
      console.log(`[loadHistoricalData] 成功載入 ${dataCount.value} 筆聚合數據`)

      renderChart()
      renderEfficiencyChart()
    }
  } catch (err) {
    console.error('Failed to load historical data:', err)
  }
}

function updateChart() {
  loadHistoricalData()
}

function updateEfficiencyChart() {
  renderEfficiencyChart()
}

function renderChart() {
  console.log('renderChart called', {
    hasCanvas: !!chartCanvas.value,
    dataLength: historicalData.value.length,
    hasChartInstance: !!chartInstance
  })

  if (!chartCanvas.value) {
    console.error('Canvas element not found!')
    return
  }

  if (historicalData.value.length === 0) {
    console.warn('No historical data to render')
    return
  }

  const labels = historicalData.value.map(item => {
    const date = new Date(item.timestamp)
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  })

  const pgData = historicalData.value.map(item => item.pg)
  const paData = historicalData.value.map(item => item.pa)
  const ppData = historicalData.value.map(item => item.pp)

  console.log('Chart data prepared', { labels: labels.slice(0, 3), pgData: pgData.slice(0, 3) })

  // 如果圖表已存在，只更新數據（避免閃爍）
  if (chartInstance) {
    console.log('Updating existing chart')
    chartInstance.data.labels = labels
    chartInstance.data.datasets[0].data = pgData
    chartInstance.data.datasets[1].data = paData
    chartInstance.data.datasets[2].data = ppData
    chartInstance.update('none')  // 'none' 模式：不使用動畫，立即更新
    return
  }

  // 首次創建圖表
  console.log('Creating new chart')
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'PG (發電功率)',
          data: pgData,
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        },
        {
          label: 'PA (負載 A)',
          data: paData,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        },
        {
          label: 'PP (負載 P)',
          data: ppData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#ecf0f1',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFC107',
          bodyColor: '#ecf0f1',
          borderColor: '#FFC107',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.y} W`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#b0bec5',
            font: {
              size: 11
            },
            autoSkip: true,
            maxTicksLimit: 10  // 最多顯示 10 個標籤
          },
          grid: {
            color: 'rgba(176, 190, 197, 0.1)'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#b0bec5',
            font: {
              size: 12
            },
            callback: (value) => `${value} W`
          },
          grid: {
            color: 'rgba(176, 190, 197, 0.1)'
          }
        }
      }
    }
  }

  try {
    chartInstance = new Chart(chartCanvas.value, config)
    console.log('Chart created successfully!', chartInstance)
  } catch (error) {
    console.error('Failed to create chart:', error)
  }
}

// 效率趨勢圖渲染
function renderEfficiencyChart() {
  if (!efficiencyChartCanvas.value) {
    console.error('Efficiency canvas element not found!')
    return
  }

  if (historicalData.value.length === 0) {
    console.warn('No historical data for efficiency chart')
    return
  }

  const labels = historicalData.value.map(item => {
    const date = new Date(item.timestamp)
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  })

  const pagData = historicalData.value.map(item => item.pagEfficiency || 0)
  const pgpData = historicalData.value.map(item => item.pgpEfficiency || 0)

  // 如果圖表已存在,只更新數據
  if (efficiencyChartInstance) {
    efficiencyChartInstance.data.labels = labels
    efficiencyChartInstance.data.datasets[0].data = pagData
    efficiencyChartInstance.data.datasets[1].data = pgpData
    efficiencyChartInstance.update('none')
    return
  }

  // 首次創建效率圖表
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'PGA 效率 (%)',
          data: pagData,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        },
        {
          label: 'PGP 效率 (%)',
          data: pgpData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#ecf0f1',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFC107',
          bodyColor: '#ecf0f1',
          borderColor: '#FFC107',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              return `${context.dataset.label}: ${value !== null ? value.toFixed(2) : '0.00'}%`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#b0bec5',
            font: {
              size: 11
            },
            autoSkip: true,
            maxTicksLimit: 10  // 最多顯示 10 個標籤
          },
          grid: {
            color: 'rgba(176, 190, 197, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#b0bec5',
            font: {
              size: 12
            },
            callback: (value) => `${value}%`
          },
          grid: {
            color: 'rgba(176, 190, 197, 0.1)'
          }
        }
      }
    }
  }

  try {
    efficiencyChartInstance = new Chart(efficiencyChartCanvas.value, config)
    console.log('Efficiency chart created successfully!')
  } catch (error) {
    console.error('Failed to create efficiency chart:', error)
  }
}

// 載入 Factor 配置
async function loadFactorConfig() {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    const response = await axios.get(
      `${apiUrl}/api/devices/${deviceId.value}/config`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.data.success) {
      const config = response.data.data
      factorA.value = config.factor_a || 1.0
      factorP.value = config.factor_p || 1.0
      console.log(`Factor config loaded: A=${factorA.value}, P=${factorP.value}`)
    }
  } catch (err) {
    console.error('Failed to load factor config:', err)
  }
}

// 更新 Factor 配置
async function updateFactors() {
  if (updatingFactor.value) return

  updatingFactor.value = true

  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://72.61.117.219:3000'

    const response = await axios.put(
      `${apiUrl}/api/devices/${deviceId.value}/config`,
      {
        factor_a: factorA.value,
        factor_p: factorP.value
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (response.data.success) {
      alert(`✅ Factor 更新成功!\nFactor A: ${factorA.value}\nFactor P: ${factorP.value}`)
      // 重新載入數據以套用新 Factor
      await refreshData()
    }
  } catch (err: any) {
    console.error('Failed to update factors:', err)
    alert(`❌ Factor 更新失敗: ${err.response?.data?.message || err.message}`)
  } finally {
    updatingFactor.value = false
  }
}

// 重置 Factor 為 1.0
function resetFactors() {
  factorA.value = 1.0
  factorP.value = 1.0
}

// 開啟下載模態框
function openDownloadModal() {
  // 設置預設時間範圍：過去 7 天
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 轉換為 datetime-local 格式 (YYYY-MM-DDTHH:mm)
  downloadEndDate.value = endTime.toISOString().slice(0, 16)
  downloadStartDate.value = startTime.toISOString().slice(0, 16)

  showDownloadModal.value = true
}

// 關閉下載模態框
function closeDownloadModal() {
  showDownloadModal.value = false
  downloadStartDate.value = ''
  downloadEndDate.value = ''
}

// 下載發電資料 (CSV)
async function downloadPowerData() {
  if (downloadingData.value) return

  // 驗證日期
  if (!downloadStartDate.value || !downloadEndDate.value) {
    alert('請選擇開始和結束日期')
    return
  }

  const startTime = new Date(downloadStartDate.value)
  const endTime = new Date(downloadEndDate.value)

  if (startTime >= endTime) {
    alert('開始日期必須早於結束日期')
    return
  }

  // 檢查時間範圍（最多 90 天）
  const daysDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff > 90) {
    alert('時間範圍不能超過 90 天')
    return
  }

  downloadingData.value = true

  try {
    // 獲取數據
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await axios.get(`${apiUrl}/api/power-data/device/${deviceId.value}/range`, {
      params: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }
    })

    const records = response.data.data.records || []

    if (records.length === 0) {
      alert('沒有可下載的數據')
      return
    }

    // 轉換為 CSV
    const headers = [
      'Timestamp',
      'Device ID',
      'PG (W)',
      'PA (W)',
      'PP (W)',
      'PGA Efficiency (%)',
      'PGP Efficiency (%)'
    ]

    const rows = records.map((item: any) => [
      new Date(item.timestamp).toLocaleString('zh-TW'),
      item.device_id,
      item.pg,
      item.pa,
      item.pp,
      item.pga_efficiency?.toFixed(2) || '0.00',
      item.pgp_efficiency?.toFixed(2) || '0.00'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n')

    // 下載檔案
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const startLabel = startTime.toISOString().split('T')[0]
    const endLabel = endTime.toISOString().split('T')[0]
    link.href = url
    link.download = `${deviceId.value}_power_data_${startLabel}_to_${endLabel}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`✅ CSV 下載成功 - ${records.length} 筆資料`)
    alert(`✅ CSV 下載成功！\n共 ${records.length} 筆資料`)

    // 關閉模態框
    closeDownloadModal()
  } catch (err: any) {
    console.error('❌ CSV 下載失敗:', err)
    alert('下載失敗: ' + (err.message || '未知錯誤'))
  } finally {
    downloadingData.value = false
  }
}

function handleBack() {
  router.push('/devices')
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('selectedDeviceId')
  router.push('/login')
}

onMounted(() => {
  loadDashboard()
  loadFactorConfig()  // 新增: 載入 Factor 配置

  // 每 5 秒靜默刷新數據（不閃爍）
  refreshInterval = setInterval(() => {
    refreshData()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (chartInstance) {
    chartInstance.destroy()
  }
  if (efficiencyChartInstance) {
    efficiencyChartInstance.destroy()
  }
})
</script>

<style scoped>
/* ========================================
   Dashboard Container
   ======================================== */
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #3e5563 0%, #2c3e50 100%);
  display: flex;
  flex-direction: column;
}

/* ========================================
   Navbar
   ======================================== */
.navbar {
  background: #2c3e50;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-bottom: 3px solid #FFC107;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.navbar-logo {
  height: 40px;
  width: auto;
}

.navbar-title {
  font-size: 24px;
  font-weight: bold;
  color: #FFC107;
  letter-spacing: 1px;
}

.device-badge {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #FFC107;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connection-status {
  font-size: 14px;
  color: #e74c3c;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 15px;
  background: rgba(231, 76, 60, 0.1);
  transition: all 0.3s;
}

.connection-status.connected {
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.1);
}

.user-name {
  color: #ecf0f1;
  font-size: 14px;
  font-weight: 500;
}

.btn-back,
.btn-logout {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back {
  background: #3498db;
  color: white;
}

.btn-back:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-logout {
  background: #e74c3c;
  color: white;
}

.btn-logout:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

/* ========================================
   Dashboard Content
   ======================================== */
.dashboard-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* ========================================
   Loading State
   ======================================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #ecf0f1;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 193, 7, 0.2);
  border-top-color: #FFC107;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 18px;
  font-weight: 500;
}

/* ========================================
   Error State
   ======================================== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #ecf0f1;
}

.error-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.error-message {
  font-size: 18px;
  margin-bottom: 30px;
  color: #e74c3c;
  font-weight: 600;
}

.btn-retry {
  padding: 12px 30px;
  background: #FFC107;
  color: #2c3e50;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #ffb300;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 193, 7, 0.4);
}

/* ========================================
   Dashboard Main
   ======================================== */
.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* ========================================
   Section Titles
   ======================================== */
.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #FFC107;
  margin-bottom: 20px;
  border-left: 4px solid #FFC107;
  padding-left: 15px;
}

/* ========================================
   Power Section
   ======================================== */
.power-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.power-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.power-card {
  background: rgba(255, 255, 255, 0.08);
  padding: 25px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

.power-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.pg-card {
  border-color: #FFC107;
}

.pg-card:hover {
  background: rgba(255, 193, 7, 0.1);
  box-shadow: 0 10px 25px rgba(255, 193, 7, 0.3);
}

.pa-card {
  border-color: #2196F3;
}

.pa-card:hover {
  background: rgba(33, 150, 243, 0.1);
  box-shadow: 0 10px 25px rgba(33, 150, 243, 0.3);
}

.pp-card {
  border-color: #4CAF50;
}

.pp-card:hover {
  background: rgba(76, 175, 80, 0.1);
  box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.card-icon {
  font-size: 32px;
}

.card-header h3 {
  font-size: 16px;
  color: #b0bec5;
  font-weight: 600;
  margin: 0;
}

.card-value {
  font-size: 48px;
  font-weight: bold;
  color: #ecf0f1;
  margin-bottom: 10px;
}

.card-value .unit {
  font-size: 24px;
  color: #b0bec5;
  margin-left: 8px;
  font-weight: 500;
}

.card-footer {
  font-size: 13px;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.efficiency {
  font-size: 16px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  text-align: center;
  margin-top: 10px;
}

.efficiency-high {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.efficiency-positive {
  background: rgba(139, 195, 74, 0.2);
  color: #8BC34A;
}

.efficiency-negative {
  background: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

.efficiency-low {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

/* ========================================
   Chart Section
   ======================================== */
.chart-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.time-range-select {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #ecf0f1;
  border: 2px solid #FFC107;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.time-range-select:hover {
  background: rgba(255, 193, 7, 0.2);
}

.time-range-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.3);
}

.time-range-select option {
  background: #263238;
  color: #ecf0f1;
  padding: 8px;
  font-size: 14px;
}

.btn-download {
  padding: 8px 16px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.btn-download:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(33, 150, 243, 0.4);
}

.btn-download:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.chart-container {
  height: 400px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 8px;
}

/* ========================================
   Info Section
   ======================================== */
.info-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.08);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #FFC107;
  transition: all 0.3s;
}

.info-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(5px);
}

.info-label {
  font-size: 13px;
  color: #b0bec5;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  font-weight: 600;
}

.info-value {
  font-size: 18px;
  color: #ecf0f1;
  font-weight: 700;
}

.status-online {
  color: #2ecc71;
}

.status-offline {
  color: #e74c3c;
}

/* ========================================
   Responsive Design
   ======================================== */
@media (max-width: 1024px) {
  .navbar {
    flex-direction: column;
    gap: 15px;
  }

  .navbar-left,
  .navbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .power-cards {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 20px 15px;
  }

  .navbar {
    padding: 15px;
  }

  .navbar-title {
    font-size: 18px;
  }

  .section-title {
    font-size: 18px;
  }

  .card-value {
    font-size: 36px;
  }

  .chart-container {
    height: 300px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .navbar-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .navbar-right {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .card-value {
    font-size: 28px;
  }
}

/* ========================================
   Factor Section
   ======================================== */
.factor-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.factor-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.factor-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.factor-input-group label {
  color: #ecf0f1;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.factor-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #ecf0f1;
  border: 2px solid #FFC107;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  width: 100px;
  text-align: center;
  transition: all 0.3s;
}

.factor-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.btn-update-factor,
.btn-reset-factor {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-update-factor {
  background: #4CAF50;
  color: white;
}

.btn-update-factor:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-update-factor:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset-factor {
  background: #9E9E9E;
  color: white;
}

.btn-reset-factor:hover {
  background: #757575;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(158, 158, 158, 0.3);
}

.factor-info {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #FFC107;
  border-radius: 6px;
}

.factor-info p {
  margin: 5px 0;
  color: #ecf0f1;
  font-size: 13px;
  line-height: 1.6;
}

/* Modal 樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #2c3e50;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #34495e;
}

.modal-header h3 {
  margin: 0;
  color: #ecf0f1;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  color: #ecf0f1;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 24px;
}

.date-picker-group {
  margin-bottom: 20px;
}

.date-picker-group label {
  display: block;
  margin-bottom: 8px;
  color: #ecf0f1;
  font-size: 14px;
  font-weight: 600;
}

.date-input {
  width: 100%;
  padding: 12px;
  background: #34495e;
  border: 2px solid #4a5f7f;
  border-radius: 6px;
  color: #ecf0f1;
  font-size: 14px;
  transition: border-color 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #3498db;
}

.modal-hint {
  padding: 12px;
  background: rgba(52, 152, 219, 0.1);
  border-left: 4px solid #3498db;
  border-radius: 4px;
  color: #b0bec5;
  font-size: 13px;
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 2px solid #34495e;
}

.btn-cancel, .btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-confirm {
  background: #3498db;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #2980b9;
}

.btn-confirm:disabled {
  background: #7f8c8d;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
