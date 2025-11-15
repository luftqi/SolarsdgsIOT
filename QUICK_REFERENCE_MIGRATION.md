# Vue 3 遷移快速參考手冊

> **快速查找 Node-RED 功能對應的 Vue 3 實作方式**

---

## 🔐 1. 登入系統 (5 分鐘快速實作)

### 資料庫 Schema
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  devices TEXT[],
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);
```

### API 端點
```typescript
// POST /api/auth/login
interface LoginRequest {
  customer_code: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  customer_data?: {
    customer_code: string;
    customer_name: string;
    devices: string[];
  };
}
```

### Node.js Service
```typescript
// backend/src/services/auth/AuthService.ts
import bcrypt from 'bcrypt';

export class AuthService {
  async login(customer_code: string, password: string) {
    // 1. 查詢客戶
    const customer = await this.customerRepo.findByCode(customer_code);
    if (!customer || !customer.active) {
      throw new AppError(401, '客戶代碼不存在或已停用');
    }

    // 2. 驗證密碼
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      throw new AppError(401, '密碼錯誤');
    }

    // 3. 更新登入記錄
    await this.customerRepo.updateLoginRecord(customer_code);

    // 4. 生成 JWT Token
    const token = jwt.sign(
      { customer_code, devices: customer.devices },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: '登入成功',
      token,
      customer_data: {
        customer_code: customer.customer_code,
        customer_name: customer.customer_name,
        devices: customer.devices
      }
    };
  }
}
```

### Vue 3 Composable
```typescript
// frontend/src/composables/useAuth.ts
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export function useAuth() {
  const router = useRouter();
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function login(customer_code: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post('/api/auth/login', {
        customer_code,
        password
      });

      if (response.data.success) {
        // 儲存 Token
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('customer_data', JSON.stringify(response.data.customer_data));

        // 導向儀表板
        router.push('/page1');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '登入失敗';
    } finally {
      loading.value = false;
    }
  }

  return { login, loading, error };
}
```

### Vue 3 Component
```vue
<!-- frontend/src/views/LoginView.vue -->
<template>
  <div class="login-container">
    <v-card max-width="400">
      <v-card-title>客戶登入</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="customerCode"
          label="客戶代碼"
          prepend-icon="mdi-account"
        />
        <v-text-field
          v-model="password"
          label="密碼"
          type="password"
          prepend-icon="mdi-lock"
        />
        <v-alert v-if="error" type="error">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          :loading="loading"
          @click="handleLogin"
        >
          登入
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const customerCode = ref('');
const password = ref('');

const { login, loading, error } = useAuth();

async function handleLogin() {
  await login(customerCode.value, password.value);
}
</script>
```

---

## 📊 2. Dashboard 即時數據 (10 分鐘快速實作)

### WebSocket 事件

```typescript
// backend/src/services/realtime/WebSocketService.ts

export class WebSocketService {
  private io: Server;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: { origin: '*' }
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe_device', (deviceId: string) => {
        socket.join(`device_${deviceId}`);
        console.log(`Client ${socket.id} subscribed to device ${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // 廣播功率數據
  broadcastPowerData(deviceId: string, data: PowerData) {
    this.io.to(`device_${deviceId}`).emit('power_data', {
      device_id: deviceId,
      pg: data.pg,
      pa: data.pa,
      pp: data.pp,
      pag: data.pag,
      ppg: data.ppg,
      timestamp: data.timestamp
    });
  }

  // 廣播 GPS 數據
  broadcastGpsUpdate(deviceId: string, data: GpsLocation) {
    this.io.to(`device_${deviceId}`).emit('gps_update', {
      device_id: deviceId,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      satellites: data.satellites
    });
  }
}
```

### Vue 3 Composable (WebSocket)

```typescript
// frontend/src/composables/useWebSocket.ts

import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  function connect() {
    socket.value = io('wss://api.solarsdgs.online', {
      transports: ['websocket']
    });

    socket.value.on('connect', () => {
      connected.value = true;
      console.log('WebSocket connected');
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('WebSocket disconnected');
    });
  }

  function subscribeDevice(deviceId: string) {
    if (!socket.value) return;
    socket.value.emit('subscribe_device', deviceId);
  }

  function onPowerData(callback: (data: PowerData) => void) {
    if (!socket.value) return;
    socket.value.on('power_data', callback);
  }

  function onGpsUpdate(callback: (data: GpsLocation) => void) {
    if (!socket.value) return;
    socket.value.on('gps_update', callback);
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
    }
  }

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    subscribeDevice,
    onPowerData,
    onGpsUpdate,
    disconnect
  };
}
```

### Vue 3 Component (Dashboard)

```vue
<!-- frontend/src/views/DashboardView.vue -->
<template>
  <div class="dashboard">
    <!-- 設備選擇器 -->
    <v-select
      v-model="selectedDevice"
      :items="devices"
      label="選擇設備"
      @update:model-value="handleDeviceChange"
    />

    <!-- 即時數據卡片 -->
    <v-row>
      <v-col cols="12" md="6" lg="2">
        <PowerCard label="PG" :value="powerData.pg" unit="W" color="#4CAF50" />
      </v-col>
      <v-col cols="12" md="6" lg="2">
        <PowerCard label="PA" :value="powerData.pa" unit="W" color="#2196F3" />
      </v-col>
      <v-col cols="12" md="6" lg="2">
        <PowerCard label="PP" :value="powerData.pp" unit="W" color="#FF9800" />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <PowerCard label="PAG" :value="powerData.pag" unit="%" color="#9C27B0" />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <PowerCard label="PPG" :value="powerData.ppg" unit="%" color="#F44336" />
      </v-col>
    </v-row>

    <!-- 功率圖表 -->
    <v-row>
      <v-col cols="12">
        <PowerChart :chart-data="chartData" />
      </v-col>
    </v-row>

    <!-- GPS 地圖 -->
    <v-row>
      <v-col cols="12">
        <GpsMap :location="gpsLocation" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useWebSocket } from '@/composables/useWebSocket';
import PowerCard from '@/components/dashboard/PowerCard.vue';
import PowerChart from '@/components/dashboard/PowerChart.vue';
import GpsMap from '@/components/dashboard/GpsMap.vue';

const selectedDevice = ref('6001');
const devices = ref(['6001', '6002', '6003']);

const powerData = reactive({
  pg: 0,
  pa: 0,
  pp: 0,
  pag: 0,
  ppg: 0
});

const gpsLocation = reactive({
  latitude: 25.033671,
  longitude: 121.564427,
  altitude: 100.5
});

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'PG',
      data: [],
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)'
    },
    {
      label: 'PA',
      data: [],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      label: 'PP',
      data: [],
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)'
    }
  ]
});

const { subscribeDevice, onPowerData, onGpsUpdate } = useWebSocket();

onMounted(() => {
  subscribeDevice(selectedDevice.value);

  onPowerData((data) => {
    powerData.pg = data.pg;
    powerData.pa = data.pa;
    powerData.pp = data.pp;
    powerData.pag = data.pag;
    powerData.ppg = data.ppg;

    // 更新圖表數據
    chartData.value.labels.push(new Date(data.timestamp).toLocaleTimeString());
    chartData.value.datasets[0].data.push(data.pg);
    chartData.value.datasets[1].data.push(data.pa);
    chartData.value.datasets[2].data.push(data.pp);

    // 保留最近 100 個數據點
    if (chartData.value.labels.length > 100) {
      chartData.value.labels.shift();
      chartData.value.datasets.forEach(ds => ds.data.shift());
    }
  });

  onGpsUpdate((data) => {
    gpsLocation.latitude = data.latitude;
    gpsLocation.longitude = data.longitude;
    gpsLocation.altitude = data.altitude;
  });
});

function handleDeviceChange(deviceId: string) {
  subscribeDevice(deviceId);
  // 清空圖表數據
  chartData.value.labels = [];
  chartData.value.datasets.forEach(ds => ds.data = []);
}
</script>
```

---

## 📈 3. Chart.js 圖表 (5 分鐘快速實作)

### PowerChart 組件

```vue
<!-- frontend/src/components/dashboard/PowerChart.vue -->
<template>
  <v-card>
    <v-card-title>功率趨勢圖</v-card-title>
    <v-card-text>
      <Line :data="chartData" :options="chartOptions" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps<{
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
}>();

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,  // 即時數據不需動畫
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: true,
      text: '即時功率數據'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Power (W)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
      }
    }
  }
}));
</script>

<style scoped>
canvas {
  height: 400px !important;
}
</style>
```

---

## 🗺️ 4. GPS 地圖 (5 分鐘快速實作)

### GpsMap 組件 (使用 Leaflet)

```vue
<!-- frontend/src/components/dashboard/GpsMap.vue -->
<template>
  <v-card>
    <v-card-title>GPS 位置</v-card-title>
    <v-card-text>
      <div ref="mapContainer" class="map-container"></div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

onMounted(() => {
  if (!mapContainer.value) return;

  // 初始化地圖
  map = L.map(mapContainer.value).setView(
    [props.location.latitude, props.location.longitude],
    15
  );

  // 添加 OpenStreetMap 圖層
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 添加標記
  marker = L.marker([props.location.latitude, props.location.longitude])
    .addTo(map)
    .bindPopup(`<b>設備位置</b><br>高度: ${props.location.altitude}m`)
    .openPopup();
});

// 監聽位置變化
watch(() => props.location, (newLocation) => {
  if (!map || !marker) return;

  const newLatLng = L.latLng(newLocation.latitude, newLocation.longitude);
  marker.setLatLng(newLatLng);
  map.setView(newLatLng, 15);

  marker.getPopup()?.setContent(
    `<b>設備位置</b><br>高度: ${newLocation.altitude}m`
  );
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 400px;
}
</style>
```

**安裝依賴**:
```bash
npm install leaflet
npm install -D @types/leaflet
```

---

## 🛠️ 5. 客戶管理 CRUD (10 分鐘快速實作)

### API 端點

```typescript
// backend/src/routes/customerRoutes.ts

import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new CustomerController();

router.get('/customers', authMiddleware, controller.getAll);
router.get('/customers/:code', authMiddleware, controller.getOne);
router.post('/customers', authMiddleware, controller.create);
router.put('/customers/:code', authMiddleware, controller.update);
router.delete('/customers/:code', authMiddleware, controller.delete);

export default router;
```

### Vue 3 組件 (客戶清單)

```vue
<!-- frontend/src/views/CustomerManageView.vue -->
<template>
  <div class="customer-manage">
    <v-card>
      <v-card-title>
        客戶管理
        <v-spacer />
        <v-btn color="primary" @click="openCreateDialog">
          新增客戶
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="customers"
          :loading="loading"
        >
          <template v-slot:item.active="{ item }">
            <v-chip :color="item.active ? 'success' : 'error'">
              {{ item.active ? '啟用' : '停用' }}
            </v-chip>
          </template>
          <template v-slot:item.devices="{ item }">
            <v-chip-group>
              <v-chip v-for="device in item.devices" :key="device" size="small">
                {{ device }}
              </v-chip>
            </v-chip-group>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon size="small" @click="editCustomer(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="deleteCustomer(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 新增/編輯對話框 -->
    <CustomerDialog
      v-model="dialogOpen"
      :customer="selectedCustomer"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomer } from '@/composables/useCustomer';
import CustomerDialog from '@/components/customer/CustomerDialog.vue';

const headers = [
  { title: '客戶代碼', value: 'customer_code' },
  { title: '客戶名稱', value: 'customer_name' },
  { title: '設備清單', value: 'devices' },
  { title: '狀態', value: 'active' },
  { title: '最後登入', value: 'last_login' },
  { title: '登入次數', value: 'login_count' },
  { title: '操作', value: 'actions', sortable: false }
];

const dialogOpen = ref(false);
const selectedCustomer = ref(null);

const { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomer();

onMounted(() => {
  fetchCustomers();
});

function openCreateDialog() {
  selectedCustomer.value = null;
  dialogOpen.value = true;
}

function editCustomer(customer: any) {
  selectedCustomer.value = customer;
  dialogOpen.value = true;
}

async function handleSave(customer: any) {
  if (customer.id) {
    await updateCustomer(customer);
  } else {
    await createCustomer(customer);
  }
  dialogOpen.value = false;
  fetchCustomers();
}
</script>
```

---

## 📦 6. 套件安裝清單

### Backend (Node.js)

```bash
# 核心框架
npm install express
npm install -D @types/express

# 資料庫
npm install pg
npm install -D @types/pg

# MQTT
npm install mqtt
npm install -D @types/mqtt

# WebSocket
npm install socket.io
npm install -D @types/socket.io

# 認證與加密
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt

# 環境變數
npm install dotenv

# 日誌
npm install winston

# TypeScript
npm install -D typescript ts-node @types/node

# 開發工具
npm install -D nodemon
```

### Frontend (Vue 3)

```bash
# 核心框架
npm create vite@latest frontend -- --template vue-ts

# UI 框架
npm install vuetify@next
npm install @mdi/font

# 路由與狀態管理
npm install vue-router@4 pinia

# HTTP 客戶端
npm install axios

# WebSocket 客戶端
npm install socket.io-client

# MQTT 客戶端
npm install mqtt

# 圖表庫
npm install chart.js vue-chartjs

# 地圖庫
npm install leaflet
npm install -D @types/leaflet

# PWA
npm install -D vite-plugin-pwa

# 表單驗證
npm install @vuelidate/core @vuelidate/validators

# 日期處理
npm install dayjs
```

---

## 🚀 7. 啟動流程

### 開發環境

```bash
# 1. 啟動資料庫 (Docker)
docker compose -f docker/docker-compose.yml up -d postgres mqtt

# 2. 啟動後端
cd backend
npm run dev  # nodemon src/server.ts

# 3. 啟動前端
cd frontend
npm run dev  # vite

# 訪問: http://localhost:5173
```

### 生產環境 (VPS)

```bash
# 1. 上傳專案到 VPS
git clone https://github.com/your-repo/solarsdgs-iot.git
cd solarsdgs-iot

# 2. 配置環境變數
cd docker
cp .env.example .env
nano .env  # 修改密碼等配置

# 3. 啟動所有服務
docker compose up -d

# 4. 檢查服務狀態
docker compose ps
docker compose logs -f

# 5. 檢查 HTTPS 憑證
docker compose exec caddy caddy list-certificates

# 訪問: https://solarsdgs.online
```

---

## 📊 8. 數據流對照表

| Node-RED | Vue 3 實作 | 說明 |
|---------|-----------|-----|
| **MQTT In** → Function → PostgreSQL | `MqttService.subscribe()` → `DataParser.parse()` → `PowerDataRepo.insert()` | 數據接收與儲存 |
| **Function** → UI Template | `WebSocketService.broadcast()` → Vue Component | 即時推送 |
| **Dashboard Template** | Vue Component + Chart.js | UI 渲染 |
| **Flow Context** | PostgreSQL `device_configs` | 配置儲存 |
| **HTTP In** → Function | Express Router → Controller → Service | API 端點 |

---

## ✅ 9. 檢查清單

### Phase 2.1 完成標準

- [ ] **API 層**
  - [ ] `/api/auth/login` 端點
  - [ ] `/api/customers/*` CRUD 端點
  - [ ] JWT Token 認證中間件
  - [ ] 錯誤處理中間件

- [ ] **資料庫**
  - [ ] `customers` 表創建
  - [ ] bcrypt 密碼加密
  - [ ] Login 記錄更新

- [ ] **測試**
  - [ ] 登入 API 測試 (Postman/cURL)
  - [ ] 客戶 CRUD 測試
  - [ ] JWT Token 驗證測試

### Phase 2.2 完成標準

- [ ] **WebSocket**
  - [ ] Socket.io 服務啟動
  - [ ] `power_data` 事件推送
  - [ ] `gps_update` 事件推送
  - [ ] 設備訂閱機制

- [ ] **測試**
  - [ ] WebSocket 連接測試
  - [ ] 數據推送測試 (使用 IoT 模擬器)

### Phase 3 完成標準

- [ ] **前端頁面**
  - [ ] Login 頁面 + 認證邏輯
  - [ ] Dashboard 頁面 + 即時數據
  - [ ] Customer Manage 頁面 + CRUD

- [ ] **UI 組件**
  - [ ] PowerCard (5 個)
  - [ ] PowerChart (Chart.js)
  - [ ] GpsMap (Leaflet)
  - [ ] CustomerList (Vuetify DataTable)

- [ ] **測試**
  - [ ] 端對端測試 (E2E)
  - [ ] UI/UX 對照 Node-RED Dashboard

---

**快速參考完成！立即開始 Phase 2.1 開發！**
