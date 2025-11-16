# 多租戶系統測試指南

## ✅ 部署狀態

**日期**: 2025-11-16
**階段**: Phase 2.4 - 多租戶權限控制已完成

---

## 📊 多租戶架構概覽

### 架構特點

1. **JWT 認證**: 每個用戶登入後獲得包含設備列表的 JWT Token
2. **設備權限隔離**: 用戶只能看到和訪問被授權的設備
3. **API 層權限檢查**: 所有 API 都經過 `authMiddleware` + `checkDeviceAccess` 雙重驗證
4. **前端權限控制**: 設備列表頁面只顯示用戶有權訪問的設備

### 當前用戶配置

| 用戶代碼 | 用戶名稱 | 密碼 | 可訪問設備 |
|---------|---------|------|-----------|
| `admin` | Administrator | `admin123` | `6001` |
| `demo` | Demo User | `demo123` | `6001`, `6002` |

---

## 🧪 多租戶測試步驟

### 測試 1: Admin 用戶只能看到設備 6001

1. **登入**:
   - 訪問: https://solarsdgs.online
   - 輸入帳號: `admin`
   - 輸入密碼: `admin123`
   - 點擊「登入」

2. **驗證設備列表**:
   - 應該只看到 **1 台設備**: `6001`
   - ❌ 不應該看到設備 `6002`

3. **訪問 Dashboard**:
   - 點擊設備 `6001`
   - 應該能正常進入 Dashboard
   - 看到即時數據和趨勢圖

4. **嘗試越權訪問** (手動測試):
   - 嘗試在瀏覽器地址欄訪問: `https://solarsdgs.online/dashboard` (設備 6002)
   - 將 localStorage 的 `selectedDeviceId` 改為 `6002`
   - **預期結果**: API 應該返回 403 Forbidden

---

### 測試 2: Demo 用戶可以看到設備 6001 和 6002

1. **登出 Admin 帳號**:
   - 點擊右上角「登出」按鈕

2. **登入 Demo 帳號**:
   - 輸入帳號: `demo`
   - 輸入密碼: `demo123`
   - 點擊「登入」

3. **驗證設備列表**:
   - 應該看到 **2 台設備**: `6001`, `6002`
   - ✅ 兩台設備都可以點擊

4. **訪問設備 6001**:
   - 點擊設備 `6001`
   - 應該能正常進入 Dashboard
   - 看到即時數據和趨勢圖

5. **訪問設備 6002**:
   - 返回設備列表
   - 點擊設備 `6002`
   - 如果設備 6002 沒有數據,會顯示「暫無數據」或「離線」
   - 這是正常的,因為目前只有 6001 在發送數據

---

### 測試 3: API 層權限驗證

使用 `curl` 或 Postman 測試 API:

#### 3.1 獲取 Admin Token

```bash
curl -X POST https://api.solarsdgs.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"customerCode":"admin","password":"admin123"}'
```

**預期響應**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "customerId": 1,
      "customerCode": "admin",
      "customerName": "Administrator",
      "devices": ["6001"]
    }
  }
}
```

#### 3.2 Admin 訪問允許的設備 (6001)

```bash
TOKEN="<從上一步獲取的 token>"

curl -X GET https://api.solarsdgs.online/api/devices/6001 \
  -H "Authorization: Bearer $TOKEN"
```

**預期響應**: ✅ 200 OK (返回設備資訊)

#### 3.3 Admin 訪問未授權的設備 (6002)

```bash
curl -X GET https://api.solarsdgs.online/api/devices/6002 \
  -H "Authorization: Bearer $TOKEN"
```

**預期響應**: ❌ 403 Forbidden
```json
{
  "success": false,
  "message": "無權訪問設備 6002",
  "allowedDevices": ["6001"]
}
```

#### 3.4 獲取 Demo Token 並訪問 6002

```bash
# 登入 Demo 帳號
curl -X POST https://api.solarsdgs.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"customerCode":"demo","password":"demo123"}'

# 使用 Demo Token 訪問設備 6002
DEMO_TOKEN="<Demo 的 token>"

curl -X GET https://api.solarsdgs.online/api/devices/6002 \
  -H "Authorization: Bearer $DEMO_TOKEN"
```

**預期響應**: ✅ 200 OK (Demo 用戶可以訪問 6002)

---

## 🔒 權限架構技術細節

### 1. JWT Token 結構

```typescript
interface JwtPayload {
  customerId: number;       // 用戶 ID
  customerCode: string;     // 用戶代碼 (登入用)
  customerName: string;     // 用戶名稱 (顯示用)
  devices: string[];        // 可訪問的設備列表
  iat: number;              // Token 簽發時間
  exp: number;              // Token 過期時間 (7天後)
}
```

### 2. 中間件鏈

所有受保護的 API 路由都經過雙重驗證:

```typescript
router.get(
  '/api/devices/:deviceId',
  authMiddleware,           // 1. 驗證 JWT Token
  checkDeviceAccess,        // 2. 驗證設備權限
  controller.getById
);
```

**驗證流程**:

1. **authMiddleware**:
   - 檢查 `Authorization: Bearer <token>` header
   - 驗證 JWT 簽名和過期時間
   - 解析 Token,將用戶資訊附加到 `req.user`

2. **checkDeviceAccess**:
   - 從 URL 參數獲取 `deviceId`
   - 檢查 `req.user.devices` 是否包含該設備
   - 如果不包含,返回 403 Forbidden

### 3. 資料庫設計

```sql
-- customers 表格
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  devices TEXT[],                    -- 設備列表 (PostgreSQL array)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 範例數據
INSERT INTO customers (customer_code, customer_name, password, devices)
VALUES
  ('admin', 'Administrator', '$2b$10$...', ARRAY['6001']),
  ('demo', 'Demo User', '$2b$10$...', ARRAY['6001', '6002']);
```

---

## 🎯 預期測試結果

### ✅ 成功場景

- [x] Admin 登入後只看到設備 6001
- [x] Demo 登入後看到設備 6001 和 6002
- [x] Admin 可以訪問設備 6001 的所有 API
- [x] Demo 可以訪問設備 6001 和 6002 的所有 API
- [x] Dashboard 顯示正確的設備資訊和即時數據
- [x] 設備列表頁面只顯示用戶有權訪問的設備

### ❌ 失敗場景 (應該被阻止)

- [x] Admin 嘗試訪問設備 6002 → 403 Forbidden
- [x] 無效的 Token → 401 Unauthorized
- [x] 過期的 Token → 401 Token Expired
- [x] 沒有提供 Token → 401 No Token Provided

---

## 📝 新增用戶範例

如果需要新增其他用戶,可以使用以下 SQL:

```sql
-- 新增一個只能訪問設備 6002 的用戶
INSERT INTO customers (customer_code, customer_name, password, devices)
VALUES (
  'user1',
  'User One',
  '$2b$10$abcdefghijklmnopqrstuvwxyz...',  -- bcrypt 加密後的密碼
  ARRAY['6002']  -- 只能訪問設備 6002
);
```

**密碼加密工具** (在 Node.js 環境中):

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

hashPassword('your_password_here');
```

---

## 🚀 下一步改進建議

### 1. **用戶管理 UI**
- 創建管理員界面,可以新增/編輯/刪除用戶
- 可視化設備權限分配

### 2. **角色權限系統**
- 目前是簡單的設備列表權限
- 可以擴展為「角色」系統 (Admin, Viewer, Operator 等)
- 每個角色有不同的操作權限 (只讀 vs 可控制設備)

### 3. **審計日誌**
- 記錄所有 API 訪問
- 記錄權限拒絕事件
- 用於安全審計和故障排除

### 4. **設備分組**
- 將設備按「專案」或「地點」分組
- 用戶可以訪問整個分組,而非單個設備

---

## 📊 部署清單

- [x] Backend JWT 認證中間件已部署
- [x] Backend 設備權限檢查中間件已部署
- [x] 所有 API 路由已添加權限檢查
- [x] Frontend 登入頁面已實作
- [x] Frontend 設備列表權限過濾已實作
- [x] Frontend Dashboard 權限驗證已實作
- [x] 資料庫已配置 2 個測試用戶 (admin, demo)
- [x] 趨勢圖 LineController 問題已修復
- [x] Dashboard 布局已調整 (設備資訊移至頂部)

---

**測試完成後,請回報測試結果!** 🎉
