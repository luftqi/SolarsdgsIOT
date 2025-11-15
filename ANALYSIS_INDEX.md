# Node-RED flows.json 分析報告索引

> **完成日期**: 2025-11-14
> **分析工具**: Claude Code (Sonnet 4.5) + Python
> **專案位置**: `C:\Users\wg444\solarsdgs-iot`

---

## 📂 生成的文件清單

| 檔案名稱 | 大小 | 行數 | 用途 | 優先閱讀 |
|---------|------|------|-----|---------|
| **ANALYSIS_SUMMARY.txt** | 6.8KB | - | 執行摘要 (純文字) | ⭐⭐⭐⭐⭐ 必讀 |
| **NODERED_ANALYSIS_COMPLETE.md** | 36KB | - | 完整分析報告 + 遷移建議 | ⭐⭐⭐⭐⭐ 必讀 |
| **QUICK_REFERENCE_MIGRATION.md** | 21KB | - | 快速參考手冊 (複製即用) | ⭐⭐⭐⭐ 強烈推薦 |
| **flows_analysis_report.md** | 195KB | 5977 | 原始技術報告 (所有 Function 程式碼) | ⭐⭐⭐ 參考用 |
| **analyze_flows.py** | 7.3KB | 204 | Python 分析腳本 (可重複執行) | ⭐⭐ 工具 |

---

## 🚀 快速開始指南

### 第 1 步：閱讀摘要 (5 分鐘)

```bash
cat ANALYSIS_SUMMARY.txt
```

**內容**:
- 關鍵發現 (節點數量、功能模組)
- 遷移狀態 (Phase 1-4)
- 下一步行動

### 第 2 步：閱讀完整報告 (30 分鐘)

```bash
# 使用 Markdown 閱讀器
code NODERED_ANALYSIS_COMPLETE.md
# 或
cat NODERED_ANALYSIS_COMPLETE.md
```

**重點章節**:
1. **第 1-2 章**: UI 架構分析 (頁面、組件、群組)
2. **第 3 章**: 登入認證系統 (4 個 Function 完整分析)
3. **第 4 章**: 客戶管理系統 (CRUD 操作)
4. **第 5 章**: Solar 監控儀表板 (即時數據流)
5. **第 6 章**: 資料庫 Schema (7 個資料表)
6. **第 7 章**: MQTT 架構
7. **第 8-10 章**: 配置同步、PWA、遷移對照表
8. **第 11 章**: Vue 3 遷移路線圖

### 第 3 步：使用快速參考 (邊開發邊查)

```bash
code QUICK_REFERENCE_MIGRATION.md
```

**適用場景**:
- ✅ 需要快速實作登入 API (5 分鐘複製範本)
- ✅ 需要實作 WebSocket 即時推送 (10 分鐘範本)
- ✅ 需要實作 Chart.js 圖表 (5 分鐘範本)
- ✅ 需要實作 GPS 地圖 (5 分鐘範本)
- ✅ 需要查看套件安裝清單

### 第 4 步：查看原始 Function 程式碼 (需要時)

```bash
# 搜尋特定 Function
grep -A 50 "數據解析器" flows_analysis_report.md
grep -A 50 "GPS解析器" flows_analysis_report.md
grep -A 50 "驗證密碼" flows_analysis_report.md
```

**適用場景**:
- ✅ 需要查看 Node-RED 原始邏輯
- ✅ 需要 100% 對等實作某個 Function
- ✅ 需要理解複雜的數據處理邏輯

---

## 📊 關鍵發現速覽

### 應用架構

```
專案統計:
├─ 總節點數量: 121
├─ Function 節點: 37 (已提取完整程式碼)
├─ 頁面數量: 3
│  ├─ /login (登入頁面)
│  ├─ /admin (客戶管理)
│  └─ /page1 (主監控儀表板)
├─ UI 組件: 13
│  ├─ ui-template: 6 (HTML/CSS/JS)
│  ├─ ui-chart: 5 (Line Charts)
│  ├─ ui-iframe: 1 (GPS Map)
│  └─ worldmap: 1
├─ MQTT Topics: 2
│  ├─ solar/+/data (功率數據)
│  └─ solar/+/gps (GPS 位置)
└─ HTTP 端點: 8 (PWA 資源)
```

### Function 節點分類

```
37 個 Function 節點:
├─ 認證與授權: 4 個
│  ├─ UI→SQL (登入)
│  ├─ 驗證密碼
│  ├─ 處理登入驗證
│  └─ 記錄登入
├─ 數據解析器: 2 個
│  ├─ 數據解析器 (240 lines, Phase 1 完成)
│  └─ GPS解析器 (130 lines, Phase 1 完成)
├─ SQL 生成器: 9 個
├─ UI 格式化: 3 個
├─ 配置同步: 6 個
├─ PWA 功能: 2 個
└─ 其他功能: 11 個
```

### 資料庫需求

```
PostgreSQL Schema:
├─ power_data (功率數據) ✅ Phase 1 完成
├─ gps_locations (GPS 位置) ✅ Phase 1 完成
├─ device_configs (設備配置) ✅ Phase 1 完成
├─ device_status (設備狀態) ✅ Phase 1 完成
├─ power_statistics (統計數據) ✅ Phase 1 完成
├─ device_logs (設備日誌) ✅ Phase 1 完成
└─ customers (客戶資料) ⏳ 待新增 (Phase 2.1)
```

---

## 🗺️ Vue 3 遷移路線圖

### Phase 1: 後端核心 ✅ **已完成** (2025-11-13)

```
✅ MqttService (MQTT 連接管理)
✅ DataParser (數據解析器, 240 lines, 100% 對等)
✅ GpsParser (GPS 解析器, 130 lines, 100% 對等)
✅ DatabaseService (Connection Pool)
✅ PowerDataRepository (UPSERT, 230 lines)
✅ GpsLocationRepository (110 lines)
✅ IoT 模擬器 (500+ lines, 完整測試工具)
✅ 6 個資料表 Schema + Indexes
✅ 測試: 50+ power data, 4 GPS records, 100% 成功率
```

### Phase 2.1: API 層 + 認證系統 ⏳ **當前階段**

```
⏳ AuthService (登入驗證 + JWT Token)
⏳ CustomerService (客戶 CRUD)
⏳ CustomerRepository
⏳ customers 資料表創建
⏳ /api/auth/login 端點
⏳ /api/auth/logout 端點
⏳ /api/customers/* CRUD 端點
⏳ JWT 認證中間件
⏳ bcrypt 密碼加密 (取代明文)
⏳ 錯誤處理中間件
```

**預估時間**: 2-3 天
**參考文件**: `QUICK_REFERENCE_MIGRATION.md` 第 1 章

### Phase 2.2: WebSocket + 即時推送 ⏳ **下一步**

```
⏳ WebSocketService (Socket.io)
⏳ UiFormatter (即時數據格式化)
⏳ MQTT → WebSocket 橋接
⏳ power_data 事件推送
⏳ gps_update 事件推送
⏳ device_status 事件推送
⏳ 設備訂閱機制 (subscribe_device)
⏳ Heartbeat 偵測斷線
```

**預估時間**: 1-2 天
**參考文件**: `QUICK_REFERENCE_MIGRATION.md` 第 2 章

### Phase 3: 前端開發 ⏳ **待開發**

#### Phase 3.1: Login 頁面

```
⏳ LoginView.vue
⏳ LoginForm.vue (表單組件)
⏳ useAuth.ts (Composable: 登入邏輯)
⏳ authStore.ts (Pinia Store: 認證狀態)
⏳ JWT Token 儲存與攔截器
```

**預估時間**: 1 天
**參考文件**: `QUICK_REFERENCE_MIGRATION.md` 第 1 章

#### Phase 3.2: Dashboard 頁面

```
⏳ DashboardView.vue
⏳ DeviceSelector.vue (設備選擇下拉選單)
⏳ PowerCard.vue (5 個數據卡片)
⏳ PowerChart.vue (Chart.js 圖表)
⏳ GpsMap.vue (Leaflet 地圖)
⏳ DeviceStatus.vue (線上狀態指示器)
⏳ usePowerData.ts (Composable: 功率數據)
⏳ useWebSocket.ts (Composable: 即時推送)
⏳ dashboardStore.ts (Pinia Store: 儀表板狀態)
```

**預估時間**: 3-4 天
**參考文件**: `QUICK_REFERENCE_MIGRATION.md` 第 2-4 章

#### Phase 3.3: Customer Manage 頁面

```
⏳ CustomerManageView.vue
⏳ CustomerList.vue (Vuetify DataTable)
⏳ CustomerForm.vue (新增/編輯表單)
⏳ CustomerDevices.vue (設備管理)
⏳ useCustomer.ts (Composable: 客戶 CRUD)
⏳ customerStore.ts (Pinia Store: 客戶狀態)
```

**預估時間**: 2 天
**參考文件**: `QUICK_REFERENCE_MIGRATION.md` 第 5 章

### Phase 4: PWA + 部署 ⏳ **最後階段**

```
⏳ Vite PWA 插件配置
⏳ manifest.json 生成
⏳ Service Worker 配置
⏳ PWA 圖標提取 (從 Base64 Logo)
⏳ Docker 前端容器配置
⏳ Caddy HTTPS 配置
⏳ 完整部署測試
```

**預估時間**: 1-2 天
**參考文件**: `NODERED_ANALYSIS_COMPLETE.md` 第 8 章

---

## 🎯 立即可執行的任務

### 任務 1: 創建 customers 資料表 (10 分鐘)

```bash
# 連接 VPS PostgreSQL
ssh root@72.61.117.219
docker compose -f docker/docker-compose.yml exec postgres psql -U admin -d solar_db

# 執行 SQL
```

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  devices TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);

CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_active ON customers(active);

-- 插入測試數據 (密碼待改用 bcrypt)
INSERT INTO customers (customer_code, customer_name, password, devices) VALUES
('CUST001', '測試客戶1', 'password123', ARRAY['6001', '6002']),
('ADMIN', '管理員', 'admin123', ARRAY['6001', '6002', '6003']);
```

### 任務 2: 安裝後端依賴 (5 分鐘)

```bash
cd backend

# 認證與加密
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt

# WebSocket
npm install socket.io
npm install -D @types/socket.io

# 已安裝 (Phase 1)
# npm install express pg mqtt dotenv winston
# npm install -D @types/express @types/pg @types/mqtt typescript ts-node @types/node
```

### 任務 3: 安裝前端依賴 (5 分鐘)

```bash
cd frontend

# 如果尚未創建前端專案
npm create vite@latest . -- --template vue-ts

# 核心依賴
npm install vuetify@next @mdi/font
npm install vue-router@4 pinia
npm install axios socket.io-client mqtt
npm install chart.js vue-chartjs
npm install leaflet
npm install -D @types/leaflet vite-plugin-pwa
```

### 任務 4: 複製範本開始開發 (1 分鐘)

```bash
# 開啟快速參考手冊
code QUICK_REFERENCE_MIGRATION.md

# 複製第 1 章的 AuthService 範本
# 複製第 2 章的 WebSocketService 範本
# 複製第 3 章的 PowerChart 範本
# ...等等
```

---

## 📚 相關文件參考

### 內部文件

| 文件 | 路徑 | 說明 |
|-----|------|-----|
| **專案記憶檔案** | `CLAUDE.md` | Claude Code 開發規範 |
| **Phase 1 報告** | `IMPLEMENTATION_PHASE1_COMPLETE.md` | 後端核心完成報告 |
| **測試結果** | `TEST_RESULTS_SUCCESS.md` | IoT 模擬器測試記錄 |
| **程式碼規範** | `CODING_STANDARDS.md` | TypeScript + Vue 3 規範 |

### 外部資源

| 資源 | URL | 說明 |
|-----|-----|-----|
| **Vue 3** | https://vuejs.org/guide/ | Vue 3 官方文檔 |
| **Vuetify 3** | https://vuetifyjs.com/ | UI 框架 |
| **Chart.js** | https://www.chartjs.org/ | 圖表庫 |
| **Leaflet** | https://leafletjs.com/ | 地圖庫 |
| **Socket.io** | https://socket.io/docs/ | WebSocket 庫 |
| **MQTT.js** | https://github.com/mqttjs/MQTT.js | MQTT 客戶端 |

---

## ⚠️ 重要注意事項

### 1. 安全性 Critical Issues

```
⚠️ CRITICAL: 密碼目前是明文儲存
   - Node-RED: password = 'password123' (明文)
   - 遷移時: 必須改用 bcrypt.hash(password, 10)

⚠️ CRITICAL: 無 Session 管理
   - Node-RED: 無 Token 機制
   - 遷移時: 必須實作 JWT Token

⚠️ CRITICAL: 無 API 認證
   - Node-RED: Dashboard 內建認證
   - 遷移時: 必須實作 JWT 中間件
```

### 2. Factor 修正機制

```
⚠️ 重要: Factor 修正必須保留
   - 用途: 修正 PA/PP 功率測量誤差
   - 儲存: Flow Context → PostgreSQL device_configs
   - 應用: 數據解析器中 (Phase 1 已實作)
   - UI: 需要提供配置介面 (Phase 3)
```

### 3. MQTT Topic 格式不可變更

```
⚠️ 重要: IoT 設備已部署，Topic 格式固定
   - solar/+/data
   - solar/+/gps
   - Payload 格式也不可變更
```

### 4. UI/UX 100% 一致性

```
⚠️ 重要: 必須保持 Node-RED Dashboard 2.0 外觀
   - 參考: flows.json 中的 ui-template
   - 顏色: PG (綠), PA (藍), PP (橙), PAG (紫), PPG (紅)
   - 布局: 參考原始 Dashboard 截圖
```

---

## 🆘 遇到問題？

### 問題 1: 找不到某個 Function 的程式碼

**解決方案**:
```bash
# 搜尋 Function 名稱
grep -n "Function 名稱" flows_analysis_report.md
```

### 問題 2: 不確定如何實作某個功能

**解決方案**:
1. 查看 `QUICK_REFERENCE_MIGRATION.md` 是否有範本
2. 參考 Phase 1 實作風格 (`backend/src/services/`)
3. 查看 `NODERED_ANALYSIS_COMPLETE.md` 的對應章節

### 問題 3: 需要理解 Node-RED 原始邏輯

**解決方案**:
1. 開啟 `flows_analysis_report.md`
2. 搜尋對應的 Function 節點
3. 完整的 JavaScript 程式碼都已提取

### 問題 4: 不確定遷移優先順序

**解決方案**:
1. 查看本文件的「Vue 3 遷移路線圖」章節
2. 遵循 Phase 1 → 2.1 → 2.2 → 3 → 4 順序
3. 參考「立即可執行的任務」章節

---

## 📊 進度追蹤

### 當前進度

```
Phase 1: ████████████████████ 100% (已完成)
Phase 2.1: ░░░░░░░░░░░░░░░░░░░░   0% (當前階段)
Phase 2.2: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0%

總進度: 20%
```

### 預估完成時間

- **Phase 2.1** (API + 認證): 2-3 天
- **Phase 2.2** (WebSocket): 1-2 天
- **Phase 3** (前端): 6-7 天
- **Phase 4** (PWA + 部署): 1-2 天
- **總計**: 10-14 天 (工作日)

---

## ✅ 下一步行動

### 本週任務 (優先順序 1)

1. ✅ 閱讀完整分析報告 (30 分鐘)
2. ⏳ 創建 customers 資料表 (10 分鐘)
3. ⏳ 安裝後端依賴 (5 分鐘)
4. ⏳ 實作 AuthService (2 小時)
5. ⏳ 實作 CustomerService (2 小時)
6. ⏳ 創建 API 路由 (1 小時)
7. ⏳ 測試登入 API (1 小時)

### 下週任務 (優先順序 2)

1. ⏳ 實作 WebSocketService
2. ⏳ 實作 UiFormatter
3. ⏳ 測試即時數據推送

### 兩週後 (優先順序 3)

1. ⏳ 開始前端開發
2. ⏳ 實作 Login 頁面
3. ⏳ 實作 Dashboard 頁面

---

## 📞 聯絡資訊

- **專案位置**: `C:\Users\wg444\solarsdgs-iot`
- **VPS**: 72.61.117.219 (srv1122961.hstgr.cloud)
- **域名**: solarsdgs.online
- **開發者**: wg444
- **分析工具**: Claude Code (Sonnet 4.5)
- **完成時間**: 2025-11-14 23:30

---

**祝開發順利！如有任何問題，請參考相關文件或詢問 Claude Code。**
