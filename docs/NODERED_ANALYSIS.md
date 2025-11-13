# Node-RED Flow 分析報告

> 📊 從 flows.json 提取的現有系統架構分析

---

## 📦 統計摘要

### 節點總覽
- **總節點數**: 121
- **Function 節點**: 37 (核心業務邏輯)
- **PostgreSQL 節點**: 15 (資料庫操作)
- **MQTT In**: 2 (數據接收)
- **MQTT Out**: 6 (數據發送)
- **UI Charts**: 5 (圖表組件)
- **UI Templates**: 6 (UI 模板)
- **HTTP 端點**: 8 (REST API)

### 配置節點
- **PostgreSQL Config**: 1
  - Host: postgres
  - Database: solar_db
  - User: admin
  - Port: 5432

- **MQTT Broker**: 1
  - Name: Solar MQTT Broker
  - Host: mqtt
  - Port: 1883
  - Client ID: nodered-solar-001

- **UI Base**: 1
  - Name: Solar Monitoring System
  - Path: /dashboard

---

## 🔑 核心 Function 節點

### 1. **數據解析器** (303 lines) ⭐⭐⭐
- **功能**: 解析 MQTT 接收的功率數據
- **輸入**: MQTT topic `solar/data/{device_id}`
- **處理邏輯**:
  - 解析 JSON payload
  - 提取 PG, PA, PP 功率值
  - 計算 PAG, PPG 效率
  - 數據驗證與清洗
- **輸出**: 格式化的功率數據對象
- **對應**: `backend/src/services/mqtt/DataParser.ts`

### 2. **SQL生成器** (476 lines x4) ⭐⭐⭐
- **功能**: 生成各種 SQL 查詢語句
- **處理邏輯**:
  - INSERT: 新增功率數據
  - SELECT: 查詢歷史數據
  - UPDATE: 更新設備狀態
  - DELETE: 刪除舊數據
- **特性**:
  - 動態時間範圍查詢
  - 批次插入優化
  - SQL 注入防護
- **對應**: `backend/src/services/database/SqlGenerator.ts`

### 3. **GPS解析器** (130 lines) ⭐⭐
- **功能**: 解析 GPS 位置數據
- **輸入**: MQTT topic `solar/gps/{device_id}`
- **處理邏輯**:
  - 解析經緯度
  - 驗證 GPS 有效性
  - 計算衛星數量
- **輸出**: GPS 位置對象
- **對應**: `backend/src/services/mqtt/GpsParser.ts`

### 4. **UI->MQTT轉換** (240 lines) ⭐⭐
- **功能**: 將 UI 操作轉換為 MQTT 命令
- **處理邏輯**:
  - 設備控制命令
  - 配置參數更新
  - ACK 響應處理
- **對應**: `backend/src/controllers/DeviceController.ts`

### 5. **MQTT->UI轉換** (148 lines) ⭐⭐
- **功能**: 將 MQTT 數據轉換為 UI 格式
- **處理邏輯**:
  - WebSocket 推送格式化
  - 即時數據更新
  - 狀態同步
- **對應**: `backend/src/services/realtime/UiFormatter.ts`

### 6. **配置同步器** (70 lines) ⭐
- **功能**: 同步設備配置
- **處理邏輯**:
  - Factor_A/Factor_P 更新
  - 設備參數同步
  - 配置驗證
- **對應**: `backend/src/services/device/ConfigSync.ts`

### 7. **格式化圖表數據** (224 lines) ⭐⭐
- **功能**: 格式化 Chart.js 數據
- **處理邏輯**:
  - 時間序列數據處理
  - 多設備數據合併
  - 圖表配置生成
- **對應**: `frontend/src/composables/useChart.ts`

### 8. **結果處理器** (178 lines) ⭐
- **功能**: 處理 PostgreSQL 查詢結果
- **處理邏輯**:
  - 數據轉換
  - 錯誤處理
  - 響應格式化

---

## 🎨 UI 組件

### Dashboard 頁面結構
1. **功率監控卡片**
   - PG (發電功率)
   - PA (負載 A 功率)
   - PP (負載 P 功率)

2. **效率指標卡片**
   - PAG 效率
   - PPG 效率

3. **歷史數據圖表**
   - 功率趨勢圖
   - 效率趨勢圖
   - 時間範圍選擇器

4. **GPS 地圖** (worldmap)
   - 設備位置顯示
   - 即時位置更新

5. **設備控制面板**
   - 配置參數調整
   - 設備重啟控制

---

## 🔄 數據流程

### 1. MQTT → PostgreSQL 流程
```
MQTT In (solar/data/{device_id})
    ↓
數據解析器 (DataParser)
    ↓
SQL生成器 (INSERT)
    ↓
PostgreSQL 節點
    ↓
結果處理器
```

### 2. PostgreSQL → UI 流程
```
HTTP In (查詢請求)
    ↓
SQL生成器 (SELECT)
    ↓
PostgreSQL 節點
    ↓
格式化圖表數據
    ↓
HTTP Response (JSON)
```

### 3. UI → MQTT 控制流程
```
HTTP In (控制請求)
    ↓
UI->MQTT轉換
    ↓
MQTT Out (solar/control/{device_id})
```

### 4. 即時數據推送流程
```
MQTT In
    ↓
MQTT->UI轉換
    ↓
WebSocket 推送
    ↓
Dashboard UI
```

---

## 📡 MQTT Topics

### 訂閱 (Subscribe)
1. `solar/data/{device_id}` - 功率數據
2. `solar/gps/{device_id}` - GPS 位置

### 發布 (Publish)
1. `solar/control/{device_id}` - 設備控制
2. `solar/config/{device_id}` - 配置更新
3. `solar/ack/{device_id}` - ACK 響應

---

## 🗄️ PostgreSQL 資料表

從 flows.json 推斷的資料表結構:

### 1. solar_power_data (功率數據表)
```sql
CREATE TABLE solar_power_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50),
    timestamp TIMESTAMP,
    pg INTEGER,         -- 發電功率
    pa INTEGER,         -- 負載 A 功率
    pp INTEGER,         -- 負載 P 功率
    pag DECIMAL(5,2),   -- 負載 A 效率
    ppg DECIMAL(5,2)    -- 負載 P 效率
);
```

### 2. gps_locations (GPS 位置表)
```sql
CREATE TABLE gps_locations (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50),
    timestamp TIMESTAMP,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    altitude DECIMAL(8,2),
    satellites INTEGER
);
```

### 3. device_config (設備配置表)
```sql
CREATE TABLE device_config (
    device_id VARCHAR(50) PRIMARY KEY,
    factor_a DECIMAL(5,2),
    factor_p DECIMAL(5,2),
    pizero2_on INTEGER,
    pizero2_off INTEGER,
    updated_at TIMESTAMP
);
```

---

## 🎯 遷移優先順序

### Phase 1: 核心數據流 (第 1-2 週)
1. ✅ **MQTT 服務** - 替代 MQTT In/Out 節點
   - `MqttService.ts` (訂閱/發布)
   - `DataParser.ts` (數據解析器 - 303 lines)
   - `GpsParser.ts` (GPS 解析器 - 130 lines)

2. ✅ **資料庫服務** - 替代 PostgreSQL 節點
   - `DatabaseService.ts` (連接管理)
   - `SqlGenerator.ts` (SQL 生成器 - 476 lines)
   - `PowerDataRepo.ts` (功率數據 CRUD)
   - `GpsLocationRepo.ts` (GPS CRUD)

### Phase 2: API 層 (第 3 週)
3. ✅ **HTTP 端點** - 替代 HTTP In/Response 節點
   - `PowerDataController.ts` (查詢功率數據)
   - `DeviceController.ts` (設備控制)
   - `GpsController.ts` (GPS 查詢)

### Phase 3: 即時推送 (第 4 週)
4. ✅ **WebSocket 服務** - 替代 Dashboard 節點
   - `WebSocketService.ts` (即時推送)
   - `UiFormatter.ts` (MQTT->UI轉換 - 148 lines)
   - `RealtimeDataBridge.ts` (數據橋接)

### Phase 4: 前端 UI (第 5-8 週)
5. ✅ **Vue 組件** - 替代 UI Template 節點
   - `PowerCard.vue` (功率卡片)
   - `PowerChart.vue` (圖表 - 224 lines 邏輯)
   - `GpsMap.vue` (地圖)
   - `DeviceControl.vue` (控制面板)

---

## 📋 關鍵程式碼轉換對照表

| Node-RED Function | Lines | 對應 TypeScript 檔案 | 優先級 |
|------------------|-------|---------------------|--------|
| 數據解析器 | 303 | `mqtt/DataParser.ts` | 🔴 高 |
| SQL生成器 | 476 | `database/SqlGenerator.ts` | 🔴 高 |
| GPS解析器 | 130 | `mqtt/GpsParser.ts` | 🟡 中 |
| UI->MQTT轉換 | 240 | `controllers/DeviceController.ts` | 🟡 中 |
| MQTT->UI轉換 | 148 | `realtime/UiFormatter.ts` | 🟡 中 |
| 格式化圖表數據 | 224 | `composables/useChart.ts` | 🟢 低 |
| 配置同步器 | 70 | `device/ConfigSync.ts` | 🟢 低 |
| 結果處理器 | 178 | `middleware/responseHandler.ts` | 🟢 低 |

---

## 🚀 下一步建議

### 立即開始 (Week 1)
1. **建立專案結構**
   ```bash
   mkdir -p backend/src/services/{mqtt,database,device,realtime}
   mkdir -p backend/uploads/images/{rgb,thermal,thumbnails}
   ```

2. **提取核心 Function 程式碼**
   - 從 flows.json 提取「數據解析器」邏輯
   - 轉換為 `DataParser.ts`
   - 編寫單元測試

3. **建立資料庫連接**
   - 實作 `DatabaseService.ts`
   - 連接到 PostgreSQL
   - 測試連接

4. **實作第一個 API**
   - POST `/api/power-data` (接收功率數據)
   - 測試 MQTT → API → PostgreSQL 流程

### 工具準備
- [ ] 安裝 PostgreSQL 客戶端
- [ ] 配置 MQTT Broker 連接
- [ ] 準備測試數據

---

## 📊 進度追蹤

### 已完成 ✅
- ✅ flows.json 分析
- ✅ 節點統計與分類
- ✅ 關鍵 Function 識別
- ✅ 遷移優先順序規劃

### 進行中 ⏳
- ⏳ 提取 Function 程式碼
- ⏳ TypeScript 重寫

### 待完成 📝
- 📝 所有 Function 轉換
- 📝 UI 組件遷移
- 📝 整合測試

---

**分析日期**: 2025-11-13
**Flows 版本**: flows.json (2650 lines, 121 nodes)
**下一步**: 提取並轉換第一個 Function 節點
