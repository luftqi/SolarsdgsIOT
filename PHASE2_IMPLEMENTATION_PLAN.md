# Phase 2 實作計劃 - 認證系統 + WebSocket

> **目標**: 100% 保留 Node-RED UI/UX 與程式碼邏輯
> **開始日期**: 2025-11-15
> **預估時間**: 2-3 天

---

## ✅ Phase 2.1: 認證系統 (已開始)

### 進度追蹤

- [x] 創建 `customers` 資料表
- [x] 安裝依賴: `jsonwebtoken`, `bcrypt`
- [ ] 創建 Customer 類型定義
- [ ] 創建 CustomerRepository
- [ ] 創建 AuthService (沿用 Node-RED 登入邏輯)
- [ ] 創建 AuthController
- [ ] 創建 `/api/auth/login` 端點
- [ ] 創建 JWT 認證中間件
- [ ] 測試登入 API

### Node-RED 登入邏輯對照

**Node-RED Function: "UI→SQL (登入)"**
```javascript
// 原始邏輯 (從 flows.json 提取)
msg.topic = "SELECT * FROM customers WHERE customer_code = $1 AND active = true";
msg.params = [msg.payload.username];
return msg;
```

**Node-RED Function: "驗證密碼"**
```javascript
// 原始邏輯
if (msg.payload.length > 0) {
    const user = msg.payload[0];
    if (user.password === msg.req.body.password) {  // ⚠️ 明文比對
        msg.user = user;
        msg.loginSuccess = true;
    } else {
        msg.loginSuccess = false;
    }
}
return msg;
```

**Node-RED Function: "記錄登入"**
```javascript
// 原始邏輯
msg.topic = "UPDATE customers SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1";
msg.params = [msg.user.id];
return msg;
```

**我們的實作 (100% 對等 + 安全改進)**:
```typescript
// AuthService.login()
// 1. SQL 查詢 (相同)
// 2. 密碼驗證 (改用 bcrypt.compare)
// 3. 更新登入記錄 (相同)
// 4. 生成 JWT Token (新增，但 Node-RED 等價於 Session)
// 5. 回傳用戶資料 + 設備清單 (相同)
```

---

## ⏳ Phase 2.2: WebSocket 即時推送

### 進度追蹤

- [x] 創建 WebSocket 類型定義
- [x] 創建 WebSocketService (基本架構)
- [ ] 整合 WebSocketService 到 server.ts
- [ ] 修改 MqttService 觸發 WebSocket 推送
- [ ] 創建 UiFormatter (從 Node-RED 提取)
- [ ] 測試即時數據推送

### Node-RED 即時推送邏輯對照

**Node-RED Function: "格式化UI數據"**
```javascript
// 原始邏輯 (從 flows.json 提取)
msg.payload = {
    device_id: msg.payload.device_id,
    timestamp: msg.payload.timestamp,
    pg: msg.payload.pg,
    pa: msg.payload.pa,
    pp: msg.payload.pp,
    pag: msg.payload.pga_efficiency,
    ppg: msg.payload.pgp_efficiency
};
return msg;
```

**我們的實作 (100% 對等)**:
```typescript
// UiFormatter.format()
// WebSocketService.broadcastPowerDataUpdate()
// → 推送到所有訂閱該設備的客戶端
```

---

## 📋 實作順序建議

由於您強調要 **100% 沿用 Node-RED 的 UI/UX 與程式碼**，我建議採用以下順序：

### 選項 A: 分階段測試 (推薦)

```
1. 完成 Phase 2.1 (認證 API)
   ├─ 創建所有後端服務
   ├─ 測試 /api/auth/login API
   └─ 確認完全對等 Node-RED 邏輯

2. 完成 Phase 2.2 (WebSocket)
   ├─ 整合 WebSocket 服務
   ├─ MQTT → WebSocket 橋接
   └─ 測試即時推送

3. 部署到 VPS
   ├─ Docker 重新構建
   ├─ 測試所有 API
   └─ 提交到 GitHub
```

**優點**: 每個階段都能測試，降低風險
**時間**: 2-3 天

### 選項 B: 一次完成所有後端 (快但風險高)

```
1. 一次創建所有服務
2. 一次部署測試
3. 出錯時難以定位問題
```

**優點**: 快速
**缺點**: 風險高，除錯困難

---

## ⚠️ 重要注意事項

### 1. 密碼安全性

Node-RED 使用明文密碼，我們需要改用 bcrypt：

```typescript
// 創建用戶時
const hashedPassword = await bcrypt.hash('admin123', 10);

// 登入驗證時
const isValid = await bcrypt.compare(inputPassword, user.password);
```

**但為了保持對等性**，我們會：
1. 先用明文密碼測試（確保邏輯對等）
2. 再升級到 bcrypt（提示用戶需要重設密碼）

### 2. UI/UX 100% 一致性

所有 Vue 3 組件都會參考 Node-RED Dashboard 2.0 的：
- 顏色配置 (primary: #0094CE)
- 布局 (Grid layout)
- 按鈕樣式
- 表單樣式
- 圖表配置

### 3. 程式碼沿用

所有 Function 節點的邏輯都會 1:1 轉換到 TypeScript：
- SQL 查詢語句完全相同
- 數據處理邏輯完全相同
- 回傳格式完全相同

---

## 🚀 下一步行動

**您希望我：**

### 選項 1: 繼續完成 Phase 2.1 所有後端服務 (推薦)

我會創建：
1. Customer 類型定義 (5 分鐘)
2. CustomerRepository (10 分鐘)
3. AuthService (15 分鐘)
4. AuthController (10 分鐘)
5. 登入 API 路由 (5 分鐘)
6. JWT 中間件 (10 分鐘)
7. 測試 API (10 分鐘)

**總時間**: 約 65 分鐘

### 選項 2: 暫停，等我先確認這個計劃

您可以先閱讀此文件，確認：
- 實作順序是否符合您的需求
- 是否有遺漏的 Node-RED 功能
- 是否需要調整優先級

### 選項 3: 直接跳到前端，先做 UI (不推薦)

雖然可以先做 Vue 3 UI，但沒有後端 API 無法測試。

---

**請告訴我您的選擇，我會立即執行！** 🚀
