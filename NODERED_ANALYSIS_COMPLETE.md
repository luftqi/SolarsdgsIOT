# Node-RED flows.json 完整功能分析報告

> **分析日期**: 2025-11-14
> **檔案來源**: `C:\Users\wg444\solarsdgs-iot\flows.json`
> **目的**: 為 Vue 3 + Node.js 遷移提供完整的功能清單與程式碼參考

---

## 📊 執行摘要

### 統計數據

- **總節點數量**: 121
- **節點類型數量**: 22
- **Function 節點數量**: 37
- **頁面數量**: 3
- **UI 組件數量**: 13 (template 6 + chart 5 + iframe 1 + worldmap 1)
- **MQTT Topic**: 2 (data, gps)
- **HTTP API 端點**: 8

### 主要功能模組

1. **登入認證系統** (`/login`)
2. **客戶管理系統** (`/admin`)
3. **Solar 監控儀表板** (`/page1`)
4. **MQTT 數據處理**
5. **PostgreSQL 資料庫操作**
6. **GPS 位置追蹤**
7. **設備配置同步**
8. **PWA 功能**

---

## 🎨 1. UI 架構分析

### 1.1 頁面結構

| 頁面名稱 | 路徑 | 圖標 | 用途 | Page ID |
|---------|------|-----|------|---------|
| **Login** | `/login` | home | 客戶登入頁面 | `e4c8b01d1e02491a` |
| **Customer Manage** | `/admin` | home | 客戶管理後台 | `14e4b2bc7756e5f9` |
| **Solar Monitor** | `/page1` | home | 主監控儀表板 | `d7a4298f3059e4c3` |

### 1.2 UI 群組 (Groups)

| 群組名稱 | 所屬頁面 | 寬度 | 高度 | Group ID |
|---------|---------|------|-----|----------|
| **登入畫面** | Login | 14 | 10 | `c3627b645dc69831` |
| **客戶管理** | Customer Manage | 12 | 8 | `7f54281a9ecb8f13` |
| **主監控區** | Solar Monitor | 12 | 8 | `24c6ae5a937a533f` |

### 1.3 UI 組件清單

#### ui-template (6 個)

1. **監控畫面** - Solar Monitor 頁面的主要 HTML/CSS/JS
2. **登入畫面** - Login 頁面的主要 HTML/CSS/JS
3. **管理畫面** - Customer Manage 頁面的主要 HTML/CSS/JS
4. **CSS (主監控)** - 全域樣式 (page:style scope)
5. **CSS (登入畫面)** - 登入頁面樣式
6. **CSS (管理畫面)** - 管理頁面樣式

#### ui-chart (5 個)

| 圖表名稱 | 所屬頁面 | 類型 | 數據來源 | 說明 |
|---------|---------|------|---------|-----|
| **PG** | Solar Monitor | line | MQTT `solar/+/data` | 發電功率 (Generator Power) |
| **PA** | Solar Monitor | line | MQTT `solar/+/data` | AC 功率 (修正後) |
| **PP** | Solar Monitor | line | MQTT `solar/+/data` | 主電網功率 (修正後) |
| **PAG** | Solar Monitor | line | 計算值 | PA 相對 PG 效率 (%) |
| **PPG** | Solar Monitor | line | 計算值 | PP 相對 PG 效率 (%) |

**圖表配置建議 (Vue 3 遷移)**:
- 使用 Chart.js 或 ECharts
- 啟用即時更新 (WebSocket 推送)
- 保留 Node-RED Dashboard 2.0 的外觀與配色

#### ui-iframe (1 個)

- **Worldmap** - 嵌入 GPS 地圖 (連接到 worldmap 節點)

#### worldmap (1 個)

- **GPS 地圖** - 顯示設備即時位置 (MQTT `solar/+/gps`)

---

## 🔐 2. 登入認證系統 (/login)

### 2.1 登入流程

```
[前端登入表單]
    ↓ 提交 customer_code + password
[UI→SQL (登入) Function] - 生成 SQL 查詢
    ↓
[PostgreSQL 查詢客戶資料]
    ↓
[驗證密碼 Function] - 比對密碼 + 提取設備清單
    ↓ (Output 1 & 2)
[處理登入驗證 Function]
    ├─ Output 1 → [前端] 回傳登入結果 (成功/失敗)
    └─ Output 2 → [記錄登入 Function] → 更新 last_login + login_count
```

### 2.2 關鍵 Function 節點

#### Function 1: UI→SQL (登入) - `751f2d49f9d3373d`

**功能**: 接收前端登入請求，生成 SQL 查詢

**輸入**:
```javascript
{
  payload: {
    customer_code: "CUST001",
    password: "password123"
  }
}
```

**輸出**:
```javascript
{
  query: "SELECT * FROM customers WHERE customer_code = $1 AND active = true",
  params: ["CUST001"],
  _original_request: {
    customer_code: "CUST001",
    password: "password123",
    action: "customer_login"
  }
}
```

#### Function 2: 驗證密碼 - `df344886164dbd15`

**功能**: 比對資料庫密碼與用戶輸入

**邏輯**:
1. 檢查客戶是否存在 (`msg.payload.length > 0`)
2. 比對 `customer.password === requestedPassword`
3. 設置 `msg.login_check.success = true/false`
4. 附加 `customer_data` (包含 devices 陣列)

**輸出**:
```javascript
{
  login_check: {
    success: true,
    customer_data: {
      customer_code: "CUST001",
      customer_name: "客戶名稱",
      devices: ["6001", "6002"],
      active: true
    },
    message: "登入成功"
  }
}
```

#### Function 3: 處理登入驗證 - `513266156844f26e`

**功能**: 分流登入結果，成功則記錄登入時間

**輸出數**: 2

- **Output 1**: 回傳給前端的登入結果
- **Output 2**: 觸發記錄登入動作 (僅成功時)

**關鍵邏輯**:
```javascript
if (success) {
  return [loginResponse, logMsg]; // 兩個輸出
} else {
  return [loginResponse, null];   // 只有 Output 1
}
```

#### Function 4: 記錄登入 - `aa53009946c82bc4`

**功能**: 更新客戶登入記錄

**SQL**:
```sql
UPDATE customers
SET last_login = CURRENT_TIMESTAMP,
    login_count = COALESCE(login_count, 0) + 1
WHERE customer_code = $1
RETURNING customer_code, last_login, login_count;
```

### 2.3 Vue 3 遷移建議

#### 前端 Vue 組件結構

```
LoginView.vue
  ├─ LoginForm.vue        (登入表單)
  ├─ useAuth.ts           (Composable: 登入邏輯)
  └─ authStore.ts         (Pinia Store: 認證狀態)
```

#### API 端點需求

| 方法 | 端點 | 請求 | 響應 | 說明 |
|-----|------|-----|------|-----|
| POST | `/api/auth/login` | `{customer_code, password}` | `{success, customer_data, message}` | 客戶登入 |
| POST | `/api/auth/logout` | `{customer_code}` | `{success}` | 登出 (可選) |
| GET | `/api/auth/session` | - | `{authenticated, customer_data}` | 檢查登入狀態 |

#### 資料庫 Schema 需求

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- 建議改用 bcrypt hash
  devices TEXT[],                  -- PostgreSQL 陣列類型
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);
```

**安全性改進建議**:
- ⚠️ **Critical**: 目前密碼是明文儲存，遷移時必須改用 `bcrypt` 加密
- ✅ 使用 JWT Token 進行 Session 管理
- ✅ 實作登入失敗次數限制 (防暴力破解)
- ✅ 添加 CSRF Token 保護

---

## 👥 3. 客戶管理系統 (/admin)

### 3.1 管理功能清單

1. **列出所有客戶** (`list all customers` - Function `054a07ba89e15327`)
2. **新增客戶** (透過 UI Template 表單)
3. **修改客戶資料** (包含設備清單)
4. **停用/啟用客戶** (更新 `active` 欄位)
5. **查詢客戶登入記錄** (last_login, login_count)

### 3.2 關鍵 Function 節點

#### Function 1: list all customers - `054a07ba89e15327`

**功能**: 查詢所有客戶資料

**SQL**:
```sql
SELECT
  customer_code,
  customer_name,
  devices,
  active,
  last_login,
  login_count,
  created_at
FROM customers
ORDER BY customer_code;
```

#### Function 2: UI→SQL (管理頁) - `0fd0fd6e38884b98`

**功能**: 處理管理頁的 CRUD 操作

**支援的動作**:
- `add_customer` - 新增客戶
- `update_customer` - 修改客戶資料
- `toggle_customer_status` - 啟用/停用客戶

#### Function 3: 管理頁結果處理 - `6131c7aa6f672e7d`

**功能**: 處理資料庫操作結果，回傳給前端

### 3.3 Vue 3 遷移建議

#### 前端 Vue 組件結構

```
CustomerManageView.vue
  ├─ CustomerList.vue        (客戶清單表格)
  ├─ CustomerForm.vue        (新增/編輯表單)
  ├─ CustomerDevices.vue     (設備管理)
  ├─ useCustomer.ts          (Composable: 客戶 CRUD)
  └─ customerStore.ts        (Pinia Store: 客戶狀態)
```

#### API 端點需求

| 方法 | 端點 | 請求 | 響應 | 說明 |
|-----|------|-----|------|-----|
| GET | `/api/customers` | - | `{customers: [...]}` | 列出所有客戶 |
| GET | `/api/customers/:code` | - | `{customer: {...}}` | 取得單一客戶 |
| POST | `/api/customers` | `{customer_code, customer_name, password, devices}` | `{success, customer}` | 新增客戶 |
| PUT | `/api/customers/:code` | `{customer_name, devices, active}` | `{success, customer}` | 更新客戶 |
| DELETE | `/api/customers/:code` | - | `{success}` | 刪除客戶 (或設為 inactive) |

#### UI 組件庫建議

- **表格**: [Vuetify Data Table](https://vuetifyjs.com/en/components/data-tables/) 或 [PrimeVue DataTable](https://primevue.org/datatable/)
- **表單**: [Vuelidate](https://vuelidate-next.netlify.app/) (表單驗證)
- **對話框**: Vuetify Dialog 或 PrimeVue Dialog

---

## 📊 4. Solar 監控儀表板 (/page1)

### 4.1 儀表板組件

1. **設備選擇器** (Dropdown: 從登入後的 devices 清單選擇)
2. **即時數據卡片** (PG, PA, PP, PAG, PPG)
3. **功率圖表** (5 個 Line Charts)
4. **GPS 地圖** (Worldmap iframe)
5. **設備狀態指示器** (線上/離線)
6. **最後更新時間**

### 4.2 數據流

```
[IoT 設備]
    ↓ MQTT Publish: solar/6001/data
[MQTT Broker (Mosquitto)]
    ↓
[Node-RED MQTT In]
    ↓
[數據解析器 Function] ← 讀取 Factor 配置
    ├─ Output 1 → [圖表數據] → UI Charts
    ├─ Output 2 → [SQL生成器] → PostgreSQL
    └─ Output 3 → [UI格式化] → Dashboard Template
```

### 4.3 關鍵 Function 節點

#### Function 1: 數據解析器 (V8.1) - `586ca0706858a41b`

**功能**: 解析 MQTT 數據並應用 Factor 修正

**輸入**: MQTT Topic `solar/6001/data`

**Payload 格式**:
```
"2024_11_13_14_30_00/1200/850/650/15.5/12.3,
 2024_11_13_14_30_10/1210/860/655/15.8/12.5"
```

**解析邏輯**:

1. **提取 device_id** (從 Topic `solar/{device_id}/data`)
2. **讀取 Factor 配置** (從 Flow Context)
   ```javascript
   const factorKey = `factor_${deviceId}`;
   const factorConfig = flow.get(factorKey) || {
     factor_a: 1.0,
     factor_p: 1.0
   };
   ```
3. **分割批量數據** (支援一次傳送多筆數據，逗號分隔)
4. **解析每條數據**:
   - 時間戳: `2024_11_13_14_30_00` → `2024-11-13 14:30:00`
   - 功率值: `pg/pa/pp/pag/ppg`
5. **應用 Factor 修正**:
   ```javascript
   const pg = pg_raw;                   // 不修正
   const pa = Math.round(pa_raw * factor_a);  // 乘以 factor_a
   const pp = Math.round(pp_raw * factor_p);  // 乘以 factor_p
   ```
6. **重新計算效率**:
   ```javascript
   const pag = pg > 0 ? ((pa - pg) * 100 / pg) : 0;
   const ppg = pg > 0 ? ((pp - pg) * 100 / pg) : 0;
   ```

**輸出數**: 3

- **Output 1**: 圖表數據 (最新一筆，用於 UI 即時顯示)
  ```javascript
  {
    payload: {
      deviceId: "6001",
      timestamp: "2024-11-13 14:30:00",
      unixTimestamp: 1699877400000,
      pg: 1200,
      pa: 850,  // 已修正
      pp: 650,  // 已修正
      pag: 15.5,
      ppg: 12.3
    }
  }
  ```

- **Output 2**: SQL 插入數據 (所有批量數據)
  ```javascript
  {
    query_type: "batch_insert_power_data",
    batch_data: [
      ["6001", "2024-11-13 14:30:00", 1200, 850, 650, 15.5, 12.3],
      ["6001", "2024-11-13 14:30:10", 1210, 860, 655, 15.8, 12.5]
    ],
    device_id: "6001",
    stats: {
      total: 2,
      processed: 2,
      errors: 0
    }
  }
  ```

- **Output 3**: UI 格式化數據 (推送到前端)
  ```javascript
  {
    payload: {
      type: "realtime",
      device_id: "6001",
      online: true,
      lastUpdate: "14:30:00",
      pg: 1200,
      pa: 850,
      pp: 650,
      pag: 15.5,
      ppg: 12.3,
      timestamp: "2024-11-13 14:30:00"
    }
  }
  ```

**Node-RED 程式碼長度**: 240 lines (Phase 1 已完成對等實作)

**Vue 3 對應實作**: `backend/src/services/mqtt/DataParser.ts`

#### Function 2: gps解析器 - `74034cbe63589d95`

**功能**: 解析 GPS 數據並儲存到資料庫

**輸入**: MQTT Topic `solar/6001/gps`

**Payload 格式**:
```
"25.033671,121.564427,100.5,8"
```

**解析結果**:
- Latitude: 25.033671
- Longitude: 121.564427
- Altitude: 100.5m
- Satellites: 8

**輸出數**: 1

**SQL 操作**: UPSERT
```sql
INSERT INTO gps_locations (device_id, latitude, longitude, altitude, satellites, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (device_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  altitude = EXCLUDED.altitude,
  satellites = EXCLUDED.satellites,
  updated_at = EXCLUDED.updated_at;
```

**Node-RED 程式碼長度**: 130 lines (Phase 1 已完成對等實作)

**Vue 3 對應實作**: `backend/src/services/mqtt/GpsParser.ts`

#### Function 3: 格式化圖表數據 - `b8c1b92e2877575f`

**功能**: 將解析後的數據格式化為 Dashboard 圖表格式

**輸出數**: 5 (分別對應 5 個圖表: PG, PA, PP, PAG, PPG)

**輸出格式** (Chart.js 格式):
```javascript
{
  series: ["Device 6001"],
  data: [[
    { x: 1699877400000, y: 1200 }  // Unix timestamp, value
  ]],
  labels: [""]
}
```

#### Function 4: 系統回覆器 - `c64de7ea6674c63a`

**功能**: 準備 ACK 訊息回傳給 IoT 設備

**輸出**: MQTT Topic `solar/{device_id}/ack`

**Payload**:
```json
{
  "status": "ok",
  "timestamp": "2024-11-13T14:30:00.000Z",
  "records_saved": 2
}
```

### 4.4 Vue 3 遷移建議

#### 前端 Vue 組件結構

```
DashboardView.vue
  ├─ DeviceSelector.vue      (設備選擇下拉選單)
  ├─ PowerCard.vue           (數據卡片: PG, PA, PP, PAG, PPG)
  ├─ PowerChart.vue          (功率圖表)
  ├─ GpsMap.vue              (GPS 地圖)
  ├─ DeviceStatus.vue        (線上狀態指示器)
  ├─ usePowerData.ts         (Composable: 功率數據)
  ├─ useWebSocket.ts         (Composable: 即時推送)
  └─ dashboardStore.ts       (Pinia Store: 儀表板狀態)
```

#### WebSocket 事件

| 事件名稱 | 數據 | 觸發時機 | 說明 |
|---------|-----|---------|-----|
| `power_data` | `{device_id, pg, pa, pp, pag, ppg, timestamp}` | 收到 MQTT 數據後 | 即時功率數據 |
| `gps_update` | `{device_id, lat, lng, altitude, satellites}` | 收到 GPS 數據後 | GPS 位置更新 |
| `device_status` | `{device_id, online, last_seen}` | 設備上線/離線 | 設備狀態變更 |

#### 圖表庫選擇

**推薦**: [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/)

**理由**:
- 與 Node-RED Dashboard 2.0 使用相同的圖表庫 (容易保持一致性)
- 支援即時更新 (動態添加數據點)
- 豐富的插件生態 (縮放、註釋、時間軸)

**配置範例** (保持 Node-RED 外觀):
```javascript
const chartOptions = {
  responsive: true,
  animation: false,  // 即時數據不需要動畫
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'minute',
        displayFormats: {
          minute: 'HH:mm'
        }
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Power (W)'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    zoom: {
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'x'
      },
      pan: {
        enabled: true,
        mode: 'x'
      }
    }
  }
};
```

---

## 🗄️ 5. 資料庫 Schema 分析

### 5.1 已實作的資料表 (Phase 1)

#### Table 1: power_data

```sql
CREATE TABLE power_data (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  pg INTEGER NOT NULL,        -- 發電功率 (W)
  pa INTEGER NOT NULL,        -- AC 功率 (W, 修正後)
  pp INTEGER NOT NULL,        -- 主電網功率 (W, 修正後)
  pag DECIMAL(5, 2),          -- PAG 效率 (%)
  ppg DECIMAL(5, 2),          -- PPG 效率 (%)
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_power_data_device_timestamp ON power_data(device_id, timestamp DESC);
CREATE INDEX idx_power_data_timestamp ON power_data(timestamp DESC);
```

#### Table 2: gps_locations

```sql
CREATE TABLE gps_locations (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  altitude DECIMAL(7, 2),
  satellites INTEGER,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_gps_device ON gps_locations(device_id);
```

#### Table 3: device_configs

```sql
CREATE TABLE device_configs (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  factor_a DECIMAL(5, 2) DEFAULT 1.0,
  factor_p DECIMAL(5, 2) DEFAULT 1.0,
  config_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 4: device_status

```sql
CREATE TABLE device_status (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  status_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 5: power_statistics

```sql
CREATE TABLE power_statistics (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_pg INTEGER DEFAULT 0,
  total_pa INTEGER DEFAULT 0,
  total_pp INTEGER DEFAULT 0,
  avg_pag DECIMAL(5, 2),
  avg_ppg DECIMAL(5, 2),
  data_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, date)
);
```

#### Table 6: device_logs

```sql
CREATE TABLE device_logs (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  log_type VARCHAR(50),
  message TEXT,
  log_data JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_logs_device_time ON device_logs(device_id, created_at DESC);
```

### 5.2 從 flows.json 識別的缺少資料表

#### Table 7: customers (登入認證系統需要)

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- 建議使用 bcrypt hash
  devices TEXT[],                  -- PostgreSQL 陣列: ["6001", "6002"]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_active ON customers(active);
```

**範例數據**:
```sql
INSERT INTO customers (customer_code, customer_name, password, devices) VALUES
('CUST001', '測試客戶1', 'password123', ARRAY['6001', '6002']),
('ADMIN', '管理員', 'admin123', ARRAY['6001', '6002', '6003']);
```

---

## 🔌 6. MQTT 架構

### 6.1 MQTT Broker 配置

| 屬性 | 值 |
|-----|---|
| **Broker Name** | Solar MQTT Broker |
| **Host** | mqtt (Docker Compose service name) |
| **Port** | 1883 (TCP), 9001 (WebSocket) |
| **Client ID** | nodered-solar-001 |
| **QoS** | 1 |

### 6.2 MQTT Topics

#### 訂閱 (Subscribe)

| Topic | QoS | 說明 | 處理流程 |
|-------|-----|-----|---------|
| `solar/+/data` | 1 | 功率數據 | 數據解析器 → SQL → UI |
| `solar/+/gps` | 1 | GPS 位置 | GPS解析器 → SQL → Map |

#### 發布 (Publish)

| Topic | QoS | 說明 | 觸發條件 |
|-------|-----|-----|---------|
| `solar/{device_id}/ack` | 1 | 確認收到數據 | 數據儲存成功後 |
| `solar/{device_id}/control` | 1 | 控制指令 | 用戶操作 (如設定 Factor) |
| `solar/{device_id}/config` | 1 | 配置同步 | 配置更新後 |
| `solar/{device_id}/status` | 1 | 狀態查詢 | 測試用途 |

### 6.3 Vue 3 遷移建議

#### MQTT WebSocket 客戶端

**推薦**: [MQTT.js](https://github.com/mqttjs/MQTT.js)

**連接範例**:
```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('wss://mqtt.solarsdgs.online:9001', {
  clientId: `vue-dashboard-${Math.random().toString(16).substr(2, 8)}`,
  username: 'vue_client',  // 可選
  password: 'secure_password',
  clean: true,
  reconnectPeriod: 1000
});

client.on('connect', () => {
  console.log('MQTT Connected');
  client.subscribe('solar/+/data', { qos: 1 });
  client.subscribe('solar/+/gps', { qos: 1 });
});

client.on('message', (topic, payload) => {
  const deviceId = topic.split('/')[1];
  const data = JSON.parse(payload.toString());

  if (topic.endsWith('/data')) {
    // 處理功率數據
    dashboardStore.updatePowerData(deviceId, data);
  } else if (topic.endsWith('/gps')) {
    // 處理 GPS 數據
    dashboardStore.updateGpsLocation(deviceId, data);
  }
});
```

**Composable 封裝**:
```typescript
// frontend/src/composables/useMqtt.ts

import { ref, onMounted, onUnmounted } from 'vue';
import mqtt, { MqttClient } from 'mqtt';

export function useMqtt() {
  const client = ref<MqttClient | null>(null);
  const connected = ref(false);

  function connect() {
    client.value = mqtt.connect('wss://mqtt.solarsdgs.online:9001', {
      clientId: `vue-${Date.now()}`,
      reconnectPeriod: 1000
    });

    client.value.on('connect', () => {
      connected.value = true;
    });

    client.value.on('close', () => {
      connected.value = false;
    });
  }

  function subscribe(topic: string, callback: (topic: string, payload: Buffer) => void) {
    if (!client.value) return;

    client.value.subscribe(topic, { qos: 1 });
    client.value.on('message', callback);
  }

  function publish(topic: string, message: string) {
    if (!client.value) return;
    client.value.publish(topic, message, { qos: 1 });
  }

  function disconnect() {
    if (client.value) {
      client.value.end();
    }
  }

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    client,
    connected,
    subscribe,
    publish,
    disconnect
  };
}
```

---

## 🔧 7. 設備配置同步系統

### 7.1 Factor 修正機制

**用途**: 修正 IoT 設備的 PA/PP 功率測量誤差

**配置儲存**:
- Node-RED: Flow Context (`factor_6001`, `factor_6002`, ...)
- Vue 3: PostgreSQL `device_configs` 表

**配置結構**:
```json
{
  "factor_a": 1.05,  // PA 修正係數 (預設 1.0)
  "factor_p": 0.98   // PP 修正係數 (預設 1.0)
}
```

**應用邏輯** (在數據解析器中):
```javascript
const pa = Math.round(pa_raw * factor_a);
const pp = Math.round(pp_raw * factor_p);
```

### 7.2 配置同步流程

```
[UI 配置表單]
    ↓ 修改 Factor
[配置同步器 Function] - 驗證數值
    ↓
[PostgreSQL] - 儲存到 device_configs
    ↓
[MQTT Publish] - 推送到設備 (solar/{device_id}/config)
    ↓
[IoT 設備] - 更新本地配置
```

### 7.3 關鍵 Function 節點

#### Function 1: 配置同步器 - `c51a3a1234503394`

**功能**: 驗證並儲存設備配置

**輸入**:
```javascript
{
  device_id: "6001",
  factor_a: 1.05,
  factor_p: 0.98
}
```

**驗證規則**:
- `factor_a` 範圍: 0.5 ~ 2.0
- `factor_p` 範圍: 0.5 ~ 2.0

**SQL**:
```sql
INSERT INTO device_configs (device_id, factor_a, factor_p, updated_at)
VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
ON CONFLICT (device_id) DO UPDATE SET
  factor_a = EXCLUDED.factor_a,
  factor_p = EXCLUDED.factor_p,
  updated_at = CURRENT_TIMESTAMP;
```

#### Function 2: check config - `9596483be8b41939`

**功能**: 檢查配置是否存在，不存在則創建預設配置

**SQL**:
```sql
INSERT INTO device_configs (device_id, factor_a, factor_p)
VALUES ($1, 1.0, 1.0)
ON CONFLICT (device_id) DO NOTHING;
```

#### Function 3: 系統同步器 - `7da3f2087ba1505c`

**功能**: 準備配置同步 MQTT 訊息

**MQTT Topic**: `solar/{device_id}/config`

**Payload**:
```json
{
  "factor_a": 1.05,
  "factor_p": 0.98,
  "timestamp": "2024-11-13T14:30:00.000Z"
}
```

### 7.4 Vue 3 遷移建議

#### API 端點

| 方法 | 端點 | 請求 | 響應 | 說明 |
|-----|------|-----|------|-----|
| GET | `/api/devices/:id/config` | - | `{factor_a, factor_p, updated_at}` | 取得設備配置 |
| PUT | `/api/devices/:id/config` | `{factor_a, factor_p}` | `{success, config}` | 更新配置並同步 |

#### 前端組件

```vue
<!-- DeviceConfig.vue -->
<template>
  <v-card>
    <v-card-title>設備配置</v-card-title>
    <v-card-text>
      <v-text-field
        v-model.number="config.factor_a"
        label="Factor A (PA 修正係數)"
        type="number"
        :min="0.5"
        :max="2.0"
        step="0.01"
      />
      <v-text-field
        v-model.number="config.factor_p"
        label="Factor P (PP 修正係數)"
        type="number"
        :min="0.5"
        :max="2.0"
        step="0.01"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="saveConfig">儲存並同步</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDeviceConfig } from '@/composables/useDeviceConfig';

const props = defineProps<{
  deviceId: string;
}>();

const { config, fetchConfig, updateConfig } = useDeviceConfig();

onMounted(() => {
  fetchConfig(props.deviceId);
});

async function saveConfig() {
  await updateConfig(props.deviceId, config.value);
  // 顯示成功訊息
}
</script>
```

---

## 🌐 8. PWA 功能

### 8.1 HTTP API 端點 (PWA 資源)

從 `flows.json` 識別的 HTTP 端點:

| 端點 | 說明 | 來源 Function |
|-----|------|--------------|
| `GET /api/icon-512.png` | PWA 圖標 (512x512) | Return Logo Base64 |
| `GET /api/icon-192.png` | PWA 圖標 (192x192) | Return Logo Base64 |
| `GET /api/icon-180.png` | PWA 圖標 (180x180, iOS) | Return Logo Base64 |
| `GET /api/favicon.ico` | 瀏覽器 Favicon | Return Logo Base64 |
| `GET /api/manifest.json` | PWA Manifest | Generate manifest.json |
| `GET /dashboard/pwa-64x64.png` | 小圖標 | - |
| `GET /dashboard/pwa-192x192.png` | 中圖標 | - |
| `GET /dashboard/pwa-512x512.png` | 大圖標 | - |

### 8.2 關鍵 Function 節點

#### Function 1: Return Logo Base64 - `func_return_icon`

**功能**: 回傳 SOLARSDGS Logo (Base64 編碼)

**重要**: Logo 是 11082 字符的 Base64 字串 (約 8KB)

**輸出**:
```javascript
msg.payload = Buffer.from(base64String, 'base64');
msg.headers = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000'
};
return msg;
```

#### Function 2: Generate manifest.json - `func_manifest`

**功能**: 生成 PWA Manifest

**輸出範例**:
```json
{
  "name": "SolarSDGs 監控系統",
  "short_name": "SolarSDGs",
  "description": "太陽能發電即時監控儀表板",
  "start_url": "/page1",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/api/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/api/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 8.3 Vue 3 遷移建議

#### manifest.json 放置位置

```
frontend/public/manifest.json
frontend/public/icons/icon-192.png
frontend/public/icons/icon-512.png
frontend/public/favicon.ico
```

#### Vite PWA 配置

**安裝**: `npm install -D vite-plugin-pwa`

**配置** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'SolarSDGs 監控系統',
        short_name: 'SolarSDGs',
        description: '太陽能發電即時監控儀表板',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/page1',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.solarsdgs\.online\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## 📋 9. 完整功能清單與遷移對照表

### 9.1 認證系統

| Node-RED Function | 對應 Node.js 實作 | 狀態 |
|------------------|------------------|-----|
| UI→SQL (登入) | `POST /api/auth/login` | ⏳ 待開發 |
| 驗證密碼 | `AuthService.verifyPassword()` | ⏳ 待開發 |
| 處理登入驗證 | `AuthService.processLogin()` | ⏳ 待開發 |
| 記錄登入 | `CustomerRepository.updateLoginRecord()` | ⏳ 待開發 |
| 登入完成處理 | Controller response | ⏳ 待開發 |

### 9.2 數據處理

| Node-RED Function | 對應 Node.js 實作 | 狀態 |
|------------------|------------------|-----|
| 數據解析器 (240 lines) | `DataParser.ts` | ✅ Phase 1 完成 |
| GPS 解析器 (130 lines) | `GpsParser.ts` | ✅ Phase 1 完成 |
| SQL 生成器 | `PowerDataRepository.ts` | ✅ Phase 1 完成 |
| 格式化圖表數據 | `UiFormatter.ts` | ⏳ 待開發 |
| 系統回覆器 | `MqttService.sendAck()` | ✅ Phase 1 完成 |

### 9.3 客戶管理

| Node-RED Function | 對應 Node.js 實作 | 狀態 |
|------------------|------------------|-----|
| list all customers | `GET /api/customers` | ⏳ 待開發 |
| UI→SQL (管理頁) | `CustomerService` CRUD | ⏳ 待開發 |
| 管理頁結果處理 | Controller response | ⏳ 待開發 |

### 9.4 設備配置

| Node-RED Function | 對應 Node.js 實作 | 狀態 |
|------------------|------------------|-----|
| 配置同步器 | `ConfigService.syncConfig()` | ⏳ 待開發 |
| check config | `ConfigService.ensureConfig()` | ⏳ 待開發 |
| 系統同步器 | `MqttService.publishConfig()` | ⏳ 待開發 |

### 9.5 PWA 功能

| Node-RED Function | 對應 Vue 3 實作 | 狀態 |
|------------------|-----------------|-----|
| Return Logo Base64 | `public/icons/*.png` | ⏳ 待開發 |
| Generate manifest.json | `public/manifest.json` | ⏳ 待開發 |
| HTTP 圖標端點 | Vite static assets | ⏳ 待開發 |

---

## 🔍 10. 詳細程式碼提取

完整的 Function 節點程式碼已提取到:

📄 **`flows_analysis_report.md`** (5977 lines)

包含所有 37 個 Function 節點的完整程式碼，分類如下:

1. **認證與授權** (4 個)
2. **數據解析器** (2 個)
3. **SQL 生成器** (9 個)
4. **UI 格式化** (3 個)
5. **配置同步** (6 個)
6. **其他功能** (13 個)

---

## 📝 11. Vue 3 遷移路線圖

### Phase 2.1: API 層 + 認證系統 (當前階段)

- [ ] 實作 `AuthService` (登入驗證)
- [ ] 實作 `CustomerService` (客戶 CRUD)
- [ ] 實作 `CustomerRepository`
- [ ] 創建 `/api/auth/*` 路由
- [ ] 創建 `/api/customers/*` 路由
- [ ] 添加 JWT Token 認證
- [ ] 實作 bcrypt 密碼加密

### Phase 2.2: WebSocket + 即時推送

- [ ] 實作 `WebSocketService`
- [ ] 實作 `UiFormatter` (格式化即時數據)
- [ ] 從 MQTT 推送到 WebSocket
- [ ] 測試即時數據流

### Phase 3: 前端開發

- [ ] **Login Page**
  - [ ] LoginForm.vue
  - [ ] useAuth.ts (Composable)
  - [ ] authStore.ts (Pinia)

- [ ] **Dashboard Page**
  - [ ] DeviceSelector.vue
  - [ ] PowerCard.vue (5 個卡片)
  - [ ] PowerChart.vue (Chart.js)
  - [ ] GpsMap.vue (Leaflet/Mapbox)
  - [ ] usePowerData.ts
  - [ ] useWebSocket.ts
  - [ ] dashboardStore.ts

- [ ] **Customer Manage Page**
  - [ ] CustomerList.vue (表格)
  - [ ] CustomerForm.vue (新增/編輯)
  - [ ] useCustomer.ts
  - [ ] customerStore.ts

### Phase 4: PWA + 部署

- [ ] 設置 Vite PWA 插件
- [ ] 生成 PWA 圖標 (從 Base64 Logo)
- [ ] 配置 Service Worker
- [ ] 配置 manifest.json
- [ ] Docker 部署配置
- [ ] Caddy HTTPS 配置

---

## 🎯 12. 關鍵差異與注意事項

### 12.1 Node-RED vs Node.js 差異

| 項目 | Node-RED | Node.js + Vue 3 | 影響 |
|-----|----------|----------------|-----|
| **狀態管理** | Flow Context | PostgreSQL + Pinia | 需要資料庫持久化 |
| **UI 組件** | Dashboard 2.0 Template | Vue Components | 需要完整重寫 UI |
| **即時推送** | Dashboard 內建 | WebSocket | 需要實作 WebSocket 服務 |
| **MQTT 連接** | 內建 MQTT 節點 | MQTT.js 客戶端 | 前端需要 MQTT WebSocket |
| **密碼儲存** | 明文 (⚠️) | bcrypt hash | 必須改進安全性 |

### 12.2 安全性改進建議

1. **密碼加密**
   - ❌ 目前: 明文儲存 (`password = 'password123'`)
   - ✅ 改用: `bcrypt.hash(password, 10)`

2. **Session 管理**
   - ❌ 目前: 無 Session 機制
   - ✅ 改用: JWT Token (httpOnly cookie)

3. **API 認證**
   - ❌ 目前: 無 API 認證
   - ✅ 改用: JWT Bearer Token

4. **HTTPS**
   - ✅ 已配置: Caddy 自動 HTTPS

### 12.3 效能優化建議

1. **資料庫查詢**
   - 使用 Connection Pool (已實作)
   - 添加適當的 Index (已實作)
   - 使用 UPSERT 避免重複插入

2. **前端優化**
   - 使用 Vue 3 Composition API (更好的效能)
   - 圖表使用 `animation: false` (即時數據不需動畫)
   - WebSocket 連接使用 Heartbeat (偵測斷線)

3. **MQTT 優化**
   - 使用 QoS 1 (確保訊息送達)
   - 批量數據一次傳送 (減少 MQTT overhead)
   - 添加 MQTT 訊息壓縮 (可選)

---

## 📊 13. 數據量估算

### 假設條件

- 設備數量: 10 台
- 數據頻率: 每 10 秒一次
- 每次數據: 1 筆功率數據 + 0.1 筆 GPS 數據 (每 100 秒更新一次 GPS)

### 每日數據量

- **power_data**: 10 設備 × 8,640 筆/天 = 86,400 筆/天
- **gps_locations**: 10 設備 × 10 次/天 = 100 筆/天 (UPSERT, 實際只有 10 筆)

### 每年數據量

- **power_data**: 31,536,000 筆/年 (約 3.2GB, 假設每筆 100 bytes)
- **gps_locations**: 10 筆 (UPSERT, 不會增長)

### 資料庫維護建議

1. **定期清理舊數據** (保留 6 個月)
   ```sql
   DELETE FROM power_data WHERE timestamp < NOW() - INTERVAL '6 months';
   ```

2. **使用分區表** (Partitioning, 針對 `power_data`)
   ```sql
   CREATE TABLE power_data_2024_11 PARTITION OF power_data
   FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
   ```

3. **定期 VACUUM**
   ```sql
   VACUUM ANALYZE power_data;
   ```

---

## 🔗 14. 相關文件

- **原始報告**: `C:\Users\wg444\solarsdgs-iot\flows_analysis_report.md` (5977 lines)
- **CLAUDE.md**: 專案記憶檔案 (開發規範)
- **Phase 1 報告**: `IMPLEMENTATION_PHASE1_COMPLETE.md`
- **測試結果**: `TEST_RESULTS_SUCCESS.md`

---

## ✅ 15. 結論

### 已識別的功能

- ✅ 3 個頁面 (Login, Dashboard, Admin)
- ✅ 37 個 Function 節點 (已提取完整程式碼)
- ✅ 2 個 MQTT Topic (data, gps)
- ✅ 5 個圖表 (PG, PA, PP, PAG, PPG)
- ✅ 6 個資料表 (Phase 1 已完成)
- ✅ 1 個缺少的資料表 (customers, 需新增)
- ✅ PWA 功能 (Manifest + Icons)
- ✅ Factor 修正機制

### 遷移準備就緒

**Phase 1 (已完成)**:
- ✅ MQTT 數據處理 (100% 對等)
- ✅ 資料庫操作 (100% 對等)
- ✅ 測試工具 (IoT 模擬器)

**Phase 2 (下一步)**:
- ⏳ API 層 (Routes + Controllers)
- ⏳ 認證系統 (Login + JWT)
- ⏳ WebSocket 服務 (即時推送)

**Phase 3 (前端)**:
- ⏳ Vue 3 組件 (參考 Node-RED Dashboard 外觀)
- ⏳ Chart.js 圖表
- ⏳ GPS 地圖

### 關鍵成功因素

1. ✅ **保持 100% 功能對等** (從 flows.json 提取所有邏輯)
2. ✅ **保留相同的 UI/UX** (複製 Node-RED Dashboard 2.0 外觀)
3. ✅ **提升安全性** (bcrypt 密碼、JWT Token)
4. ✅ **商用化架構** (分層架構、Docker 部署)
5. ✅ **完整測試** (單元測試、整合測試、E2E 測試)

---

**報告完成日期**: 2025-11-14
**報告作者**: Claude Code
**下一步行動**: 開始 Phase 2.1 - API 層與認證系統開發
