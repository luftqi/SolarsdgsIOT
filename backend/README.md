# SolarSDGs IoT - Backend

> Node.js + TypeScript + Express 後端服務

## 技術棧

- **語言**: TypeScript 5.3+
- **框架**: Express.js 4.18+
- **資料庫**: PostgreSQL 16 + node-pg
- **MQTT**: MQTT.js 5.0+
- **即時通訊**: Socket.io 4.6+
- **驗證**: JWT
- **日誌**: Winston
- **測試**: Jest + Supertest

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 檔案，填入實際配置
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 建構生產版本

```bash
npm run build
npm start
```

## 專案結構

```
backend/
├── src/
│   ├── config/          # 配置檔案
│   ├── models/          # 資料模型
│   ├── services/        # 業務邏輯層
│   │   ├── mqtt/        # MQTT 服務
│   │   ├── database/    # 資料庫服務
│   │   ├── device/      # 設備服務
│   │   └── realtime/    # 即時數據服務
│   ├── controllers/     # 控制器層
│   ├── routes/          # 路由定義
│   ├── middleware/      # 中介軟體
│   ├── utils/           # 工具函數
│   ├── types/           # TypeScript 類型
│   ├── app.ts           # Express 應用配置
│   └── server.ts        # 伺服器入口
├── tests/               # 測試檔案
└── scripts/             # 腳本工具
```

## 可用命令

```bash
# 開發
npm run dev              # 啟動開發伺服器 (with hot reload)

# 建構
npm run build            # 編譯 TypeScript

# 測試
npm run test             # 執行所有測試
npm run test:unit        # 單元測試
npm run test:integration # 整合測試
npm run test:e2e         # 端對端測試
npm run test:coverage    # 測試覆蓋率

# 程式碼品質
npm run lint             # 檢查程式碼
npm run lint:fix         # 自動修復
npm run format           # 格式化程式碼

# 資料庫
npm run db:migrate       # 執行資料庫遷移
npm run db:seed          # 填充測試數據
```

## API 端點

### 設備相關
- `GET /api/devices` - 獲取所有設備
- `GET /api/devices/:id` - 獲取單一設備
- `POST /api/devices` - 創建設備
- `PUT /api/devices/:id` - 更新設備
- `DELETE /api/devices/:id` - 刪除設備

### 功率數據
- `GET /api/power-data` - 獲取功率數據
- `GET /api/power-data/:deviceId` - 獲取特定設備數據
- `POST /api/power-data` - 創建功率數據

### GPS 位置
- `GET /api/gps/:deviceId` - 獲取 GPS 位置
- `POST /api/gps` - 更新 GPS 位置

### 認證
- `POST /api/auth/login` - 登入
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 獲取當前用戶

## 開發規範

請遵循專案根目錄的 [CLAUDE.md](../CLAUDE.md) 和 [CODING_STANDARDS.md](../CODING_STANDARDS.md)

### 重點規則

1. **分層架構**: Controller → Service → Repository
2. **TypeScript**: 所有代碼必須有明確類型，禁止使用 `any`
3. **錯誤處理**: 所有 async 函數必須有 try-catch
4. **命名規範**:
   - Class/Interface: PascalCase
   - 變數/函數: camelCase
   - 常數: UPPER_SNAKE_CASE
5. **日誌**: 使用 Winston，禁止 console.log

## 授權

MIT License
