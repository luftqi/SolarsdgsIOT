# Phase 2 開發計劃

> 📅 開始日期: 2025-11-13
> 🎯 目標: API 層 + WebSocket + 前端 Dashboard
> ⏱️ 預估時間: 2-3 週

---

## 📦 Phase 1 完成回顧

### ✅ 已完成項目

**後端核心:**
- ✅ DataParser (303 lines Node-RED → 240 lines TypeScript)
- ✅ GpsParser (130 lines Node-RED → 130 lines TypeScript)
- ✅ PowerDataRepository + GpsLocationRepository
- ✅ MqttService (完整 MQTT 整合)
- ✅ DatabaseService (連接池管理)

**基礎設施:**
- ✅ PostgreSQL Schema (6 個資料表)
- ✅ VPS 部署 (72.61.117.219)
- ✅ IoT 模擬器 (完整功能)

**測試結果:**
- ✅ 數據流測試: 100% 成功
- ✅ 已收集 50+ 條功率數據
- ✅ 已收集 4 條 GPS 數據
- ✅ 系統穩定運行

---

## 🚀 Phase 2 目標

### 核心目標

**1. Express API 層**
- 提供 RESTful API 查詢功率數據
- 提供 RESTful API 查詢 GPS 數據
- 提供設備管理 API
- 提供統計分析 API

**2. WebSocket 服務**
- 即時推送功率數據到前端
- 即時推送 GPS 數據到前端
- 支援多客戶端連接
- 房間管理（按設備 ID 分組）

**3. Vue 前端 Dashboard**
- 即時功率監控卡片
- Chart.js 歷史數據圖表
- Leaflet GPS 地圖
- 設備控制面板

**4. 整合與部署**
- Caddy 反向代理配置
- Docker Compose 整合
- 生產環境部署

---

## 📋 Phase 2 任務分解

### Week 1: Express API 層 (7-10 天)

#### Task 1.1: 設置 Express 應用 ✅

**檔案清單:**
```
backend/src/
├── app.ts                    # Express 應用配置
├── routes/
│   ├── index.ts             # 路由總入口
│   ├── powerData.routes.ts  # 功率數據路由
│   ├── gps.routes.ts        # GPS 路由
│   ├── devices.routes.ts    # 設備路由
│   └── stats.routes.ts      # 統計路由
├── controllers/
│   ├── PowerDataController.ts
│   ├── GpsController.ts
│   ├── DeviceController.ts
│   └── StatsController.ts
└── middleware/
    ├── errorHandler.ts
    ├── validateRequest.ts
    └── cors.ts
```

**API 端點設計:**

**功率數據 API:**
```typescript
GET  /api/power-data                    // 查詢所有設備最新數據
GET  /api/power-data/:deviceId          // 查詢特定設備最新數據
GET  /api/power-data/:deviceId/latest   // 最新 N 條
GET  /api/power-data/:deviceId/range    // 時間範圍查詢
GET  /api/power-data/:deviceId/stats    // 統計數據
```

**GPS API:**
```typescript
GET  /api/gps/:deviceId                 // 最新 GPS 位置
GET  /api/gps/:deviceId/track           // GPS 軌跡
GET  /api/gps/all                       // 所有設備最新位置
```

**設備 API:**
```typescript
GET  /api/devices                       // 所有設備列表
GET  /api/devices/:deviceId             // 設備詳情
PUT  /api/devices/:deviceId/config      // 更新設備配置
POST /api/devices/:deviceId/control     // 設備控制命令
```

**統計 API:**
```typescript
GET  /api/stats/daily/:deviceId         // 每日統計
GET  /api/stats/hourly/:deviceId        // 每小時統計
GET  /api/stats/summary                 // 總覽統計
```

#### Task 1.2: 實作 Controllers

**PowerDataController 範本:**
```typescript
export class PowerDataController {
  constructor(private readonly powerDataRepo: PowerDataRepository) {}

  async getLatest(req: Request, res: Response) {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await this.powerDataRepo.getLatestData(deviceId, limit);
    res.json({ success: true, data });
  }

  async getByRange(req: Request, res: Response) {
    const { deviceId } = req.params;
    const { start, end } = req.query;

    const data = await this.powerDataRepo.getDataByTimeRange(
      deviceId,
      new Date(start as string),
      new Date(end as string)
    );
    res.json({ success: true, data, count: data.length });
  }
}
```

#### Task 1.3: 錯誤處理與驗證

**統一錯誤處理:**
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // 未預期的錯誤
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

#### Task 1.4: API 測試

**使用 Postman 或 curl 測試:**
```bash
# 測試功率數據查詢
curl http://72.61.117.219:3000/api/power-data/6001/latest?limit=5

# 測試 GPS 查詢
curl http://72.61.117.219:3000/api/gps/6001

# 測試設備列表
curl http://72.61.117.219:3000/api/devices
```

---

### Week 2: WebSocket 服務 (5-7 天)

#### Task 2.1: 設置 Socket.io

**檔案清單:**
```
backend/src/services/
├── websocket/
│   ├── WebSocketService.ts    # WebSocket 服務
│   ├── SocketManager.ts        # 連接管理
│   └── RoomManager.ts          # 房間管理
```

**WebSocketService 架構:**
```typescript
export class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // 訂閱特定設備
      socket.on('subscribe:device', (deviceId) => {
        socket.join(`device:${deviceId}`);
      });

      // 退訂設備
      socket.on('unsubscribe:device', (deviceId) => {
        socket.leave(`device:${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // 廣播功率數據
  broadcastPowerData(deviceId: string, data: RealtimeUiData) {
    this.io.to(`device:${deviceId}`).emit('power:update', data);
  }

  // 廣播 GPS 數據
  broadcastGpsData(deviceId: string, data: GpsDashboardData) {
    this.io.to(`device:${deviceId}`).emit('gps:update', data);
  }
}
```

#### Task 2.2: 整合到 MqttService

**修改 MqttService:**
```typescript
export class MqttService {
  constructor(
    private readonly powerDataRepo: PowerDataRepository,
    private readonly gpsLocationRepo: GpsLocationRepository,
    private readonly wsService: WebSocketService  // ← 新增
  ) {}

  private async handlePowerData(deviceId: string, payload: Buffer) {
    const result = await this.dataParser.parse(deviceId, payload, factorConfig);

    // 儲存到資料庫
    await this.powerDataRepo.batchInsertPowerData(result.sqlData);

    // 即時推送到 WebSocket ← 新增
    if (result.uiData) {
      this.wsService.broadcastPowerData(deviceId, result.uiData);
    }
  }
}
```

#### Task 2.3: WebSocket 測試

**使用瀏覽器 Console 測試:**
```javascript
const socket = io('http://72.61.117.219:3001');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('subscribe:device', '6001');
});

socket.on('power:update', (data) => {
  console.log('Power update:', data);
});

socket.on('gps:update', (data) => {
  console.log('GPS update:', data);
});
```

---

### Week 3-4: Vue 前端 Dashboard (7-14 天)

#### Task 3.1: 專案設置

**初始化 Vue 專案:**
```bash
cd frontend
npm install
npm run dev
```

**已安裝的套件:**
- Vue 3.4 + Composition API
- Vite 6.4
- Pinia (狀態管理)
- Vue Router
- Chart.js + vue-chartjs
- Leaflet (地圖)
- Socket.io-client
- Axios

#### Task 3.2: 核心組件開發

**組件清單:**
```
frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── PowerCard.vue          # 功率卡片
│   │   ├── EfficiencyCard.vue     # 效率卡片
│   │   ├── PowerChart.vue         # 功率圖表
│   │   ├── DeviceSelector.vue     # 設備選擇器
│   │   └── DataExporter.vue       # CSV 匯出
│   ├── map/
│   │   ├── GpsMap.vue             # GPS 地圖
│   │   └── DeviceMarker.vue       # 設備標記
│   └── common/
│       ├── LoadingSpinner.vue
│       └── ErrorMessage.vue
├── composables/
│   ├── usePowerData.ts            # 功率數據邏輯
│   ├── useGpsData.ts              # GPS 數據邏輯
│   ├── useWebSocket.ts            # WebSocket 連接
│   └── useChart.ts                # 圖表邏輯
├── stores/
│   ├── powerData.ts               # 功率數據狀態
│   ├── gpsData.ts                 # GPS 數據狀態
│   └── devices.ts                 # 設備狀態
└── services/
    ├── api.ts                     # API 客戶端
    └── websocket.ts               # WebSocket 客戶端
```

**PowerCard.vue 範本:**
```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'W',
  color: '#3498db'
});

const displayValue = computed(() => props.value.toFixed(0));
</script>

<template>
  <div class="power-card" :style="{ borderColor: color }">
    <div class="power-card__label">{{ label }}</div>
    <div class="power-card__value">
      {{ displayValue }}
      <span class="power-card__unit">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped>
.power-card {
  padding: 20px;
  border: 2px solid;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.power-card__label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.power-card__value {
  font-size: 32px;
  font-weight: bold;
}

.power-card__unit {
  font-size: 16px;
  font-weight: normal;
  margin-left: 4px;
}
</style>
```

#### Task 3.3: WebSocket 整合

**useWebSocket.ts:**
```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { RealtimeUiData } from '@/types/power.types';

export function useWebSocket(deviceId: string) {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const latestData = ref<RealtimeUiData | null>(null);

  const connect = () => {
    socket.value = io('http://72.61.117.219:3001');

    socket.value.on('connect', () => {
      isConnected.value = true;
      console.log('WebSocket connected');
      socket.value?.emit('subscribe:device', deviceId);
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
      console.log('WebSocket disconnected');
    });

    socket.value.on('power:update', (data: RealtimeUiData) => {
      latestData.value = data;
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.emit('unsubscribe:device', deviceId);
      socket.value.disconnect();
    }
  };

  onMounted(() => connect());
  onUnmounted(() => disconnect());

  return {
    isConnected,
    latestData
  };
}
```

#### Task 3.4: Dashboard 頁面

**DashboardView.vue 結構:**
```vue
<script setup lang="ts">
import { ref } from 'vue';
import PowerCard from '@/components/dashboard/PowerCard.vue';
import PowerChart from '@/components/dashboard/PowerChart.vue';
import GpsMap from '@/components/map/GpsMap.vue';
import { useWebSocket } from '@/composables/useWebSocket';

const deviceId = ref('6001');
const { isConnected, latestData } = useWebSocket(deviceId.value);
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1>SolarSDGs IoT Dashboard</h1>
      <div class="status">
        <span :class="{ online: isConnected, offline: !isConnected }">
          {{ isConnected ? '● 已連線' : '○ 離線' }}
        </span>
      </div>
    </header>

    <div class="dashboard__grid">
      <!-- 功率卡片 -->
      <PowerCard
        label="發電功率 (PG)"
        :value="latestData?.pg || 0"
        color="#e74c3c"
      />
      <PowerCard
        label="負載 A (PA)"
        :value="latestData?.pa || 0"
        color="#3498db"
      />
      <PowerCard
        label="負載 P (PP)"
        :value="latestData?.pp || 0"
        color="#2ecc71"
      />

      <!-- 圖表 -->
      <PowerChart :device-id="deviceId" />

      <!-- GPS 地圖 -->
      <GpsMap :device-id="deviceId" />
    </div>
  </div>
</template>
```

---

## 📊 優先順序矩陣

### 🔴 高優先級 (Week 1)

1. **Express API 基礎架構**
   - app.ts, routes, controllers
   - 錯誤處理中介軟體
   - CORS 配置

2. **核心 API 端點**
   - GET /api/power-data/:deviceId/latest
   - GET /api/gps/:deviceId
   - GET /api/devices

3. **API 測試**
   - 使用 Postman 測試所有端點
   - 驗證數據格式正確

### 🟡 中優先級 (Week 2)

4. **WebSocket 服務**
   - Socket.io 設置
   - 房間管理
   - 事件處理

5. **即時數據推送**
   - 整合 MqttService → WebSocket
   - 測試即時推送

### 🟢 低優先級 (Week 3-4)

6. **Vue 前端開發**
   - 基礎組件
   - Dashboard 頁面
   - WebSocket 整合

7. **進階功能**
   - 圖表縮放/平移
   - CSV 匯出
   - 設備控制

---

## 🔧 開發環境配置

### 後端開發

**啟動開發伺服器:**
```bash
cd backend
npm run dev  # ts-node-dev src/server.ts
```

**API 測試:**
```bash
# 使用 curl
curl http://localhost:3000/api/power-data/6001/latest

# 使用 httpie
http GET http://localhost:3000/api/devices
```

### 前端開發

**啟動 Vite 開發伺服器:**
```bash
cd frontend
npm run dev  # 開啟 http://localhost:5173
```

**熱重載:**
- 修改 .vue 檔案自動重載
- 修改 TypeScript 自動編譯

---

## 📝 檢查清單

### Week 1 完成標準

- [ ] Express 應用啟動成功
- [ ] 所有 API 端點可訪問
- [ ] 錯誤處理正確
- [ ] CORS 配置正確
- [ ] API 測試 100% 通過

### Week 2 完成標準

- [ ] WebSocket 連接成功
- [ ] 客戶端可訂閱設備
- [ ] 即時數據推送正常
- [ ] 多客戶端支援
- [ ] 房間管理正確

### Week 3-4 完成標準

- [ ] Dashboard 頁面完成
- [ ] 即時功率卡片更新
- [ ] 圖表顯示歷史數據
- [ ] GPS 地圖顯示位置
- [ ] WebSocket 斷線重連
- [ ] 響應式設計

---

## 🚀 快速開始

### 立即開始 Week 1 開發

**Step 1: 創建 Express 應用基礎**
```bash
cd backend/src
# 創建 app.ts, routes/, controllers/, middleware/
```

**Step 2: 實作第一個 API**
```typescript
// GET /api/power-data/:deviceId/latest
```

**Step 3: 測試 API**
```bash
curl http://localhost:3000/api/power-data/6001/latest?limit=10
```

---

**Phase 2 計劃版本**: 1.0.0
**建立日期**: 2025-11-13
**預計完成**: 2025-12-06 (3-4 週)
**下一步**: 開始實作 Express API 層
