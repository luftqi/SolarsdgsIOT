# SolarSDGs IoT - 完整專案架構

> 🌞 專業太陽能功率監控系統 | Node.js + Vue.js 架構  
> **核心理念**: 從 Node-RED 遷移到現代化全端開發

---

## 📁 完整目錄結構

```
solarsdgs-iot/
├── .vscode/                          # VSCode 配置
│   ├── settings.json                 # 編輯器設定
│   ├── extensions.json               # 推薦擴充套件
│   ├── launch.json                   # 除錯設定
│   └── tasks.json                    # 任務設定
│
├── backend/                          # 後端 (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/                   # 配置檔案
│   │   │   ├── database.ts          # PostgreSQL 配置
│   │   │   ├── mqtt.ts              # MQTT 配置
│   │   │   ├── server.ts            # 伺服器配置
│   │   │   └── index.ts             # 統一匯出
│   │   │
│   │   ├── models/                   # 資料模型
│   │   │   ├── PowerData.ts         # 功率數據模型
│   │   │   ├── GpsLocation.ts       # GPS 位置模型
│   │   │   ├── Device.ts            # 設備模型
│   │   │   ├── Config.ts            # 配置模型
│   │   │   └── index.ts             # 統一匯出
│   │   │
│   │   ├── services/                 # 業務邏輯層
│   │   │   ├── mqtt/
│   │   │   │   ├── MqttService.ts   # MQTT 核心服務
│   │   │   │   ├── DataParser.ts    # 數據解析器 (替代 Node-RED Function)
│   │   │   │   ├── GpsParser.ts     # GPS 解析器
│   │   │   │   └── AckSender.ts     # ACK 發送器
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── DatabaseService.ts    # 資料庫核心服務
│   │   │   │   ├── PowerDataRepo.ts      # 功率數據儲存庫
│   │   │   │   ├── GpsLocationRepo.ts    # GPS 位置儲存庫
│   │   │   │   ├── DeviceRepo.ts         # 設備儲存庫
│   │   │   │   ├── ConfigRepo.ts         # 配置儲存庫
│   │   │   │   ├── ImageRepo.ts          # 圖像儲存庫 (新增)
│   │   │   │   ├── SqlGenerator.ts       # SQL 生成器 (替代 Node-RED SQL生成器)
│   │   │   │   └── CsvExporter.ts        # CSV 匯出器 (新增)
│   │   │   │
│   │   │   ├── device/
│   │   │   │   ├── DeviceManager.ts      # 設備管理器
│   │   │   │   ├── ConfigSync.ts         # 配置同步器 (替代 Node-RED 配置同步器)
│   │   │   │   └── ControlHandler.ts     # 控制處理器
│   │   │   │
│   │   │   ├── image/                    # 圖像服務 (新增)
│   │   │   │   ├── ImageService.ts       # 圖像處理服務
│   │   │   │   ├── ImageUploadHandler.ts # 圖像上傳處理器
│   │   │   │   ├── ThumbnailGenerator.ts # 縮圖生成器
│   │   │   │   └── ImageStorage.ts       # 圖像儲存管理
│   │   │   │
│   │   │   └── realtime/
│   │   │       ├── WebSocketService.ts   # WebSocket 服務
│   │   │       ├── RealtimeDataBridge.ts # 即時數據橋接
│   │   │       └── UiFormatter.ts        # UI 數據格式化 (替代 Node-RED 格式化)
│   │   │
│   │   ├── controllers/              # 控制器層 (API)
│   │   │   ├── DeviceController.ts   # 設備 API
│   │   │   ├── PowerDataController.ts # 功率數據 API
│   │   │   ├── GpsController.ts      # GPS API
│   │   │   ├── ConfigController.ts   # 配置 API
│   │   │   ├── ImageController.ts    # 圖像 API (新增)
│   │   │   ├── ExportController.ts   # 數據匯出 API (新增)
│   │   │   └── AuthController.ts     # 認證 API
│   │   │
│   │   ├── routes/                   # 路由定義
│   │   │   ├── api.ts               # API 路由
│   │   │   ├── devices.ts           # 設備路由
│   │   │   ├── data.ts              # 數據路由
│   │   │   └── index.ts             # 統一匯出
│   │   │
│   │   ├── middleware/               # 中介軟體
│   │   │   ├── errorHandler.ts     # 錯誤處理
│   │   │   ├── logger.ts           # 日誌記錄
│   │   │   ├── validator.ts        # 輸入驗證
│   │   │   └── auth.ts             # 身份驗證
│   │   │
│   │   ├── utils/                    # 工具函數
│   │   │   ├── dateFormatter.ts    # 日期格式化
│   │   │   ├── efficiency.ts       # 效率計算
│   │   │   ├── validators.ts       # 驗證函數
│   │   │   └── constants.ts        # 常數定義
│   │   │
│   │   ├── types/                    # TypeScript 類型定義
│   │   │   ├── mqtt.types.ts       # MQTT 相關類型
│   │   │   ├── device.types.ts     # 設備相關類型
│   │   │   ├── api.types.ts        # API 相關類型
│   │   │   └── index.ts            # 統一匯出
│   │   │
│   │   ├── app.ts                    # Express 應用配置
│   │   └── server.ts                 # 伺服器入口
│   │
│   ├── tests/                        # 測試檔案
│   │   ├── unit/                    # 單元測試
│   │   ├── integration/             # 整合測試
│   │   └── e2e/                     # 端對端測試
│   │
│   ├── scripts/                      # 腳本工具
│   │   ├── db-migrate.ts            # 資料庫遷移
│   │   ├── seed-data.ts             # 測試數據生成
│   │   └── deploy.sh                # 部署腳本
│   │
│   ├── .env.example                  # 環境變數範例
│   ├── .eslintrc.json               # ESLint 配置
│   ├── .prettierrc                  # Prettier 配置
│   ├── tsconfig.json                # TypeScript 配置
│   ├── package.json                 # 依賴管理
│   └── README.md                    # 後端說明文檔
│
├── frontend/                         # 前端 (Vue 3 + TypeScript + Vite)
│   ├── public/                      # 靜態資源
│   │   ├── favicon.ico
│   │   ├── manifest.json            # PWA Manifest
│   │   └── icons/                   # PWA 圖標
│   │       ├── icon-192.png
│   │       ├── icon-512.png
│   │       └── apple-touch-icon.png
│   │
│   ├── src/
│   │   ├── assets/                   # 靜態資產
│   │   │   ├── styles/
│   │   │   │   ├── main.css         # 主樣式
│   │   │   │   ├── variables.css    # CSS 變數
│   │   │   │   └── components.css   # 組件樣式
│   │   │   │
│   │   │   └── images/              # 圖片資源
│   │   │
│   │   ├── components/               # Vue 組件
│   │   │   ├── common/              # 通用組件
│   │   │   │   ├── AppHeader.vue
│   │   │   │   ├── AppFooter.vue
│   │   │   │   ├── LoadingSpinner.vue
│   │   │   │   └── ErrorMessage.vue
│   │   │   │
│   │   │   ├── dashboard/           # 儀表板組件
│   │   │   │   ├── PowerCard.vue    # 功率卡片 (PG/PA/PP)
│   │   │   │   ├── EfficiencyCard.vue # 效率卡片 (PAG/PPG)
│   │   │   │   ├── PowerChart.vue   # 功率圖表 (支援 zoom/annotation)
│   │   │   │   ├── EfficiencyChart.vue # 效率圖表
│   │   │   │   ├── TimeRangeSelector.vue # 時間範圍選擇器
│   │   │   │   ├── DeviceSelector.vue # 設備選擇器
│   │   │   │   └── DataExporter.vue # 數據匯出器 (CSV) (新增)
│   │   │   │
│   │   │   ├── map/                 # 地圖組件
│   │   │   │   ├── GpsMap.vue       # GPS 地圖 (Leaflet)
│   │   │   │   └── DeviceMarker.vue # 設備標記
│   │   │   │
│   │   │   ├── image/               # 圖像組件 (新增)
│   │   │   │   ├── ImageViewer.vue  # 圖像檢視器 (Viewerjs)
│   │   │   │   ├── ImageTimeline.vue # 圖像時間軸
│   │   │   │   ├── ImageGallery.vue # 圖像畫廊
│   │   │   │   └── ThermalRgbComparison.vue # 熱影像/RGB對比
│   │   │   │
│   │   │   ├── control/             # 控制組件
│   │   │   │   ├── ConfigPanel.vue  # 配置面板
│   │   │   │   ├── FactorControl.vue # Factor 控制
│   │   │   │   └── DeviceControl.vue # 設備控制 (重啟/OTA)
│   │   │   │
│   │   │   └── admin/               # 管理員組件
│   │   │       ├── DeviceList.vue   # 設備列表
│   │   │       ├── UserManagement.vue # 用戶管理
│   │   │       └── SystemStats.vue  # 系統統計
│   │   │
│   │   ├── views/                    # 頁面視圖
│   │   │   ├── LoginView.vue        # 登入頁面
│   │   │   ├── DashboardView.vue    # 儀表板頁面
│   │   │   ├── DeviceView.vue       # 設備詳情頁面
│   │   │   ├── ImageGalleryView.vue # 圖像瀏覽頁面 (新增)
│   │   │   ├── AdminView.vue        # 管理員頁面
│   │   │   └── NotFoundView.vue     # 404 頁面
│   │   │
│   │   ├── composables/              # Vue 組合式函數
│   │   │   ├── useWebSocket.ts      # WebSocket 連接
│   │   │   ├── useRealtime.ts       # 即時數據
│   │   │   ├── useChart.ts          # 圖表邏輯
│   │   │   ├── useDevice.ts         # 設備操作
│   │   │   ├── useImage.ts          # 圖像操作 (新增)
│   │   │   ├── useImageViewer.ts    # 圖像檢視器 (新增)
│   │   │   ├── useCsvExport.ts      # CSV 匯出 (新增)
│   │   │   └── useAuth.ts           # 認證邏輯
│   │   │
│   │   ├── stores/                   # Pinia 狀態管理
│   │   │   ├── auth.ts              # 認證狀態
│   │   │   ├── device.ts            # 設備狀態
│   │   │   ├── powerData.ts         # 功率數據狀態
│   │   │   ├── gps.ts               # GPS 狀態
│   │   │   ├── image.ts             # 圖像狀態 (新增)
│   │   │   └── ui.ts                # UI 狀態
│   │   │
│   │   ├── services/                 # API 服務
│   │   │   ├── api.ts               # API 基礎配置
│   │   │   ├── deviceApi.ts         # 設備 API
│   │   │   ├── powerDataApi.ts      # 功率數據 API
│   │   │   ├── gpsApi.ts            # GPS API
│   │   │   ├── imageApi.ts          # 圖像 API (新增)
│   │   │   ├── exportApi.ts         # 數據匯出 API (新增)
│   │   │   └── authApi.ts           # 認證 API
│   │   │
│   │   ├── router/                   # Vue Router
│   │   │   └── index.ts             # 路由配置
│   │   │
│   │   ├── utils/                    # 工具函數
│   │   │   ├── formatters.ts       # 格式化工具
│   │   │   ├── validators.ts       # 驗證工具
│   │   │   ├── constants.ts        # 常數定義
│   │   │   └── helpers.ts          # 輔助函數
│   │   │
│   │   ├── types/                    # TypeScript 類型
│   │   │   ├── device.types.ts
│   │   │   ├── power.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── App.vue                   # 根組件
│   │   ├── main.ts                   # 應用入口
│   │   └── env.d.ts                  # 環境類型聲明
│   │
│   ├── .env.example                  # 環境變數範例
│   ├── .eslintrc.json               # ESLint 配置
│   ├── .prettierrc                  # Prettier 配置
│   ├── vite.config.ts               # Vite 配置
│   ├── tsconfig.json                # TypeScript 配置
│   ├── package.json                 # 依賴管理
│   └── README.md                    # 前端說明文檔
│
├── firmware/                         # Pico W 韌體 (保留不變)
│   ├── main.py                      # 主程式 (MicroPython)
│   ├── gps_module.py                # GPS 模組
│   ├── config.json                  # 設備配置
│   └── README.md                    # 韌體說明
│
├── docker/                           # Docker 配置
│   ├── docker-compose.yml           # 完整服務編排
│   ├── docker-compose.dev.yml       # 開發環境
│   ├── docker-compose.prod.yml      # 生產環境
│   │
│   ├── backend/
│   │   └── Dockerfile               # 後端映像
│   │
│   ├── frontend/
│   │   └── Dockerfile               # 前端映像
│   │
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf               # Nginx 配置
│   │
│   ├── postgres/
│   │   └── init.sql                 # 資料庫初始化腳本
│   │
│   └── mqtt/
│       └── mosquitto.conf           # MQTT Broker 配置
│
├── docs/                             # 文檔目錄
│   ├── architecture/                # 架構文檔
│   │   ├── 01-overview.md          # 系統概覽
│   │   ├── 02-data-flow.md         # 數據流程
│   │   ├── 03-api-design.md        # API 設計
│   │   └── 04-database-schema.md   # 資料庫設計
│   │
│   ├── development/                 # 開發文檔
│   │   ├── 01-setup.md             # 環境設置
│   │   ├── 02-coding-standards.md  # 程式碼規範
│   │   ├── 03-git-workflow.md      # Git 工作流程
│   │   └── 04-testing.md           # 測試指南
│   │
│   ├── deployment/                  # 部署文檔
│   │   ├── 01-docker-setup.md      # Docker 設置
│   │   ├── 02-vps-deployment.md    # VPS 部署
│   │   └── 03-monitoring.md        # 監控設置
│   │
│   ├── phases/                      # 開發階段文檔
│   │   ├── phase-0-planning.md     # 階段 0：規劃
│   │   ├── phase-1-backend.md      # 階段 1：後端開發
│   │   ├── phase-2-frontend.md     # 階段 2：前端開發
│   │   ├── phase-3-integration.md  # 階段 3：整合測試
│   │   └── phase-4-deployment.md   # 階段 4：部署上線
│   │
│   ├── api/                         # API 文檔
│   │   ├── devices.md              # 設備 API
│   │   ├── power-data.md           # 功率數據 API
│   │   ├── gps.md                  # GPS API
│   │   └── auth.md                 # 認證 API
│   │
│   └── migration/                   # 遷移指南
│       ├── node-red-to-nodejs.md   # Node-RED 遷移指南
│       └── data-migration.md       # 數據遷移指南
│
├── scripts/                          # 通用腳本
│   ├── setup-dev.sh                 # 開發環境設置
│   ├── deploy-prod.sh               # 生產環境部署
│   ├── backup-db.sh                 # 資料庫備份
│   └── test-all.sh                  # 執行所有測試
│
├── .github/                          # GitHub 配置
│   └── workflows/
│       ├── ci.yml                   # CI 流程
│       ├── cd.yml                   # CD 流程
│       └── test.yml                 # 測試流程
│
├── .gitignore                        # Git 忽略檔案
├── .editorconfig                     # 編輯器配置
├── CLAUDE.md                         # Claude Code 記憶檔案 ⭐
├── README.md                         # 專案說明 ⭐
├── LICENSE                           # 授權檔案
└── package.json                      # Monorepo 根配置 (可選)
```

---

## 🎯 架構設計原則

### 1. **從 Node-RED 到 Node.js 的對應關係**

| Node-RED 節點 | Node.js 實現 | 位置 |
|--------------|-------------|-----|
| MQTT In | MqttService.subscribe() | backend/src/services/mqtt/MqttService.ts |
| 數據解析器 Function | DataParser.parse() | backend/src/services/mqtt/DataParser.ts |
| GPS 解析器 Function | GpsParser.parse() | backend/src/services/mqtt/GpsParser.ts |
| SQL 生成器 Function | SqlGenerator.generate() | backend/src/services/database/SqlGenerator.ts |
| PostgreSQL | DatabaseService + Repositories | backend/src/services/database/ |
| 配置同步器 Function | ConfigSync.sync() | backend/src/services/device/ConfigSync.ts |
| 格式化UI數據 Function | UiFormatter.format() | backend/src/services/realtime/UiFormatter.ts |
| MQTT Out | MqttService.publish() | backend/src/services/mqtt/MqttService.ts |
| Dashboard Template | Vue Components | frontend/src/components/ |
| WebSocket | WebSocketService | backend/src/services/realtime/WebSocketService.ts |

### 2. **技術棧選擇**

#### 後端
- **語言**: TypeScript 4.9+
- **框架**: Express.js 4.18+ (或 Fastify 4.0+ 高效能版本)
- **資料庫**: PostgreSQL 16 + node-pg
- **MQTT**: MQTT.js 5.0+
- **即時通訊**: Socket.io 4.6+
- **驗證**: JWT (jsonwebtoken)
- **日誌**: Winston 3.8+
- **測試**: Jest + Supertest

#### 前端
- **框架**: Vue 3.4+ (Composition API)
- **建構工具**: Vite 5.0+
- **語言**: TypeScript 4.9+
- **狀態管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **UI 框架**: Element Plus 2.4+ (可選)
- **圖表**: Chart.js 4.4+ / ECharts 5.4+
- **地圖**: Leaflet 1.9+
- **HTTP 客戶端**: Axios 1.6+
- **WebSocket**: Socket.io-client 4.6+

#### DevOps
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx / Caddy
- **CI/CD**: GitHub Actions
- **監控**: Prometheus + Grafana (未來)

### 3. **資料夾命名規範**

```
✅ 正確命名：
- kebab-case: backend/src/services/mqtt-service/
- camelCase:  backend/src/services/mqttService/
- PascalCase: backend/src/services/MqttService/ (類別/組件)

❌ 錯誤命名：
- snake_case: backend/src/services/mqtt_service/ (不推薦)
- 混合大小寫: backend/src/Services/mqttService/ (不一致)
```

### 4. **檔案命名規範**

```typescript
// TypeScript/JavaScript 檔案 - PascalCase (類別) 或 camelCase (函數)
MqttService.ts          // ✅ 類別
mqttService.ts          // ✅ 函數/工具
useWebSocket.ts         // ✅ Vue Composable

// Vue 組件 - PascalCase
PowerCard.vue           // ✅
DeviceList.vue          // ✅

// 配置檔案 - kebab-case
vite.config.ts          // ✅
docker-compose.yml      // ✅
```

---

## 🚀 快速開始

### 環境需求
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Docker >= 24.0.0
PostgreSQL >= 16.0
```

### 1. 克隆專案
```bash
git clone https://github.com/your-org/solarsdgs-iot.git
cd solarsdgs-iot
```

### 2. 安裝依賴
```bash
# 後端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 3. 配置環境變數
```bash
# 後端
cp backend/.env.example backend/.env
# 編輯 backend/.env，填入實際配置

# 前端
cp frontend/.env.example frontend/.env
# 編輯 frontend/.env，填入實際配置
```

### 4. 啟動開發環境
```bash
# 方法 1: 使用 Docker (推薦)
docker-compose -f docker/docker-compose.dev.yml up

# 方法 2: 手動啟動各服務
# Terminal 1 - PostgreSQL + MQTT
docker-compose up postgres mqtt

# Terminal 2 - 後端
cd backend
npm run dev

# Terminal 3 - 前端
cd frontend
npm run dev
```

### 5. 訪問應用
- 前端開發伺服器: http://localhost:5173
- 後端 API: http://localhost:3000
- API 文檔: http://localhost:3000/api-docs

---

## 📚 詳細文檔

請參考 `docs/` 目錄中的詳細文檔：

- [系統架構概覽](docs/architecture/01-overview.md)
- [環境設置指南](docs/development/01-setup.md)
- [程式碼規範](docs/development/02-coding-standards.md)
- [API 文檔](docs/api/)
- [開發階段規劃](docs/phases/)

---

## 🔧 開發工具

### VSCode 推薦擴充套件
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Vue.volar",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ]
}
```

### 程式碼格式化
```bash
# 格式化所有程式碼
npm run format

# 檢查程式碼風格
npm run lint

# 自動修復
npm run lint:fix
```

---

## 🧪 測試

```bash
# 後端測試
cd backend
npm run test              # 執行所有測試
npm run test:unit         # 單元測試
npm run test:integration  # 整合測試
npm run test:e2e          # 端對端測試
npm run test:coverage     # 測試覆蓋率

# 前端測試
cd frontend
npm run test              # 執行所有測試
npm run test:unit         # 單元測試
npm run test:e2e          # 端對端測試
```

---

## 📦 建構與部署

```bash
# 建構生產版本
npm run build

# 使用 Docker 部署
docker-compose -f docker/docker-compose.prod.yml up -d

# 手動部署到 VPS
./scripts/deploy-prod.sh
```

---

## 🤝 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

詳細請參考 [開發文檔](docs/development/03-git-workflow.md)

---

## 📝 專案狀態

- ✅ **Phase 0**: 專案規劃與架構設計
- ⏳ **Phase 1**: 後端核心開發
- ⏳ **Phase 2**: 前端 UI 開發
- ⏳ **Phase 3**: 整合測試
- ⏳ **Phase 4**: 部署上線

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 👥 團隊

- **專案負責人**: [您的名字]
- **技術棧**: Node.js + TypeScript + Vue 3 + PostgreSQL + MQTT

---

## 🔗 相關連結

- [專案 GitHub](https://github.com/your-org/solarsdgs-iot)
- [API 文檔](https://api.solarsdgs.com/docs)
- [技術部落格](https://blog.solarsdgs.com)

---

**Last Updated**: 2025-11-12  
**Version**: 1.0.0  
**Maintainer**: SolarSDGs Development Team

