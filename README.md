# SolarSDGs IoT - Solar Power Monitoring System

> 🌞 Professional IoT Solar Monitoring Platform
> Real-time Power Monitoring · GPS Tracking · Multi-tenant Architecture · 4G NB-IoT

**太陽能功率監控系統** | 從 Node-RED 遷移到 Node.js + Vue.js
即時功率監控 · GPS 定位追蹤 · 多租戶架構 · 4G NB-IoT 通訊

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Vue Version](https://img.shields.io/badge/vue-3.4%2B-brightgreen)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Phase%201-✅%20Complete-success)](./IMPLEMENTATION_PHASE1_COMPLETE.md)

## 🚀 Quick Start (Docker 部署)

```bash
# 1. Clone 專案
git clone <repository-url>
cd solarsdgs-iot

# 2. 配置環境變數
cd docker
cp .env.example .env
# 編輯 .env 設置資料庫密碼等

# 3. 啟動所有服務 (Caddy + PostgreSQL + MQTT + Backend + Frontend)
docker compose up -d

# 4. 檢查服務狀態
docker compose ps
docker compose logs -f

# 5. 訪問應用
# - Frontend: https://solarsdgs.online
# - API: https://api.solarsdgs.online
# - MQTT WebSocket: wss://mqtt.solarsdgs.online
```

**需求**: Docker 24+ | Docker Compose 2.20+ | DNS 已設定指向 VPS IP

📖 **完整部署指南**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

## 🎉 Phase 1 部署完成！(2025-11-13)

**✅ 完整 Docker Compose 部署成功在 VPS (72.61.117.219)**

### 已完成功能
- ✅ **Docker 容器化部署** - 5 個服務 (Caddy, PostgreSQL, MQTT, Backend, Frontend) 全部運行
- ✅ **MQTT 數據流** - IoT 模擬器 → MQTT Broker → Backend → PostgreSQL 完整連通
- ✅ **資料庫驗證** - 91+ 筆功率數據持續寫入，無錯誤
- ✅ **SSH 無密碼登入** - 金鑰認證配置完成
- ✅ **HTTPS 自動憑證** - Caddy 自動 Let's Encrypt
- ✅ **DNS 配置** - solarsdgs.online + api + mqtt 子域名
- ✅ **長時間運行** - 7+ 小時穩定運行，健康檢查 100% 通過

### 關鍵技術突破
- ✅ **MQTT Topic 配置** - 修復 Topic 不匹配問題，數據成功流動
- ✅ **Docker 多階段構建** - TypeScript 編譯優化
- ✅ **環境變數載入** - 正確順序確保配置生效

📄 **完整報告**: [Phase 1 部署成功報告](./docs/PHASE1_DEPLOYMENT_SUCCESS.md)
📚 **學習手冊**: [CLAUDE.md - 新增 MQTT & Docker 經驗教訓](./CLAUDE.md)

---

## 📖 專案簡介

SolarSDGs IoT 是一個完整的太陽能發電監控系統，專為商業化多租戶應用設計。系統從原有的 Node-RED 架構遷移到現代化的 Node.js + Vue.js 全端技術棧，提供：

- ⚡ **即時功率監控**: 每 60 秒更新發電功率、負載功率及效率數據
- 📍 **GPS 定位追蹤**: 即時追蹤設備位置，支援地圖可視化
- 🏢 **多租戶架構**: 完整的資料隔離與權限管理
- 📊 **歷史數據分析**: 時間序列圖表，支援多種時間範圍（1小時~1年）
- 🔄 **即時推送**: WebSocket 即時數據推送，延遲 < 3 秒
- 📱 **響應式設計**: 支援桌面、平板、手機等多種設備
- 🔐 **安全可靠**: HTTPS 加密、JWT 認證、資料庫防注入

---

## 🎯 核心功能

### 功率監控
- **三路獨立監測**: PG (發電)、PA (負載A)、PP (負載P)
- **效率計算**: 自動計算 PAG 和 PPG 效率指標
- **批次處理**: 支援離線緩存與批次上傳
- **數據驗證**: 自動過濾異常數據
- **數據匯出**: 支援 CSV 格式匯出歷史數據

### 設備管理
- **遠端控制**: 支援遠端重啟、OTA 更新（規劃中）
- **配置同步**: 動態調整 Factor_A/Factor_P 校正參數
- **狀態監控**: 即時顯示設備在線狀態
- **多設備支援**: 可管理 100+ 台設備

### 圖像監控 (新功能)
- **自動拍攝**: Pi Zero 2W 每 10 分鐘自動拍攝 RGB 與熱影像圖
- **圖像上傳**: HTTP 多部分上傳，自動生成縮圖
- **圖像儲存**: 檔案系統儲存 + 資料庫元數據管理
- **圖像瀏覽**: 支援時間軸瀏覽、縮放、全螢幕檢視
- **圖像處理**: 使用 Sharp 進行壓縮與縮圖生成

### 數據可視化
- **即時儀表板**: 卡片式顯示當前功率與效率
- **歷史圖表**: 使用 Chart.js 繪製折線圖與柱狀圖
- **圖表增強**: 支援縮放、平移、註釋、時間軸控制
- **GPS 地圖**: 使用 Leaflet 顯示設備位置
- **時間範圍**: Live / 1h / 6h / 1d / 1w / 1mo / 3mo / 6mo / 1y

---

## 🏗️ 系統架構 (Docker Compose)

```
[用戶瀏覽器] --HTTPS--> [Caddy Reverse Proxy] (自動 SSL)
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    solarsdgs.online   api.solarsdgs.online   mqtt.solarsdgs.online
            │                 │                 │
            ▼                 ▼                 ▼
    [Frontend Container] [Backend Container] [MQTT Container]
       (Vue 3 PWA)     (Node.js + Express)  (Mosquitto)
       (Nginx serve)   (WebSocket)          (TCP 1883 + WS 9001)
                              │
                              ▼
                      [PostgreSQL Container]
                       (PostgreSQL 16)

所有服務通過 Docker Compose 編排，一鍵啟動
```

### 技術棧

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                      │
│  • Dashboard Components  • Real-time Charts              │
│  • GPS Map (Leaflet)     • Device Management            │
└─────────────────────────────────────────────────────────┘
              ↕ HTTP/REST API + WebSocket
┌─────────────────────────────────────────────────────────┐
│                 Backend (Node.js + Express)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   MQTT       │  │   Database   │  │  WebSocket   │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
              ↕ MQTT Protocol (QoS 1)
┌─────────────────────────────────────────────────────────┐
│                MQTT Broker (Mosquitto)                   │
└─────────────────────────────────────────────────────────┘
              ↕ 4G NB-IoT
┌─────────────────────────────────────────────────────────┐
│              Edge Devices (Pico W + SIM7080G)           │
│  • INA226 Sensors (x3)  • GPS Module  • 1NCE SIM       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 快速開始

### 環境需求

```bash
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 16.0
Docker >= 24.0.0 (可選)
```

### 1. 克隆專案

```bash
git clone https://github.com/solarsdgs/iot-platform.git
cd iot-platform
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
# 複製環境變數範例
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 編輯 backend/.env，填入以下資訊：
# - PostgreSQL 連線資訊
# - MQTT Broker 位址
# - JWT Secret Key
```

### 4. 初始化資料庫

```bash
cd backend

# 執行資料庫遷移腳本
npm run db:migrate

# (可選) 載入測試資料
npm run db:seed
```

### 5. 啟動開發伺服器

**方法一：使用 Docker (推薦)**

```bash
# 啟動所有服務（PostgreSQL + MQTT + Backend + Frontend）
docker-compose -f docker/docker-compose.dev.yml up
```

**方法二：手動啟動**

```bash
# Terminal 1 - 啟動資料庫與 MQTT Broker
docker-compose up postgres mqtt

# Terminal 2 - 啟動後端
cd backend
npm run dev

# Terminal 3 - 啟動前端
cd frontend
npm run dev
```

### 6. 訪問應用

- **前端**: http://localhost:5173
- **後端 API**: http://localhost:3000
- **API 文檔**: http://localhost:3000/api-docs (Swagger)

---

## 📁 專案結構

```
solarsdgs-iot/
├── backend/              # Node.js + TypeScript 後端
│   ├── src/
│   │   ├── config/       # 配置檔案
│   │   ├── models/       # 資料模型
│   │   ├── services/     # 業務邏輯層
│   │   ├── controllers/  # API 控制器
│   │   ├── routes/       # 路由定義
│   │   ├── middleware/   # 中介軟體
│   │   └── utils/        # 工具函數
│   ├── tests/            # 測試檔案
│   └── package.json
│
├── frontend/             # Vue 3 + TypeScript 前端
│   ├── src/
│   │   ├── components/   # Vue 組件
│   │   ├── views/        # 頁面視圖
│   │   ├── stores/       # Pinia 狀態管理
│   │   ├── composables/  # 組合式函數
│   │   └── services/     # API 服務
│   ├── public/           # 靜態資源
│   └── package.json
│
├── firmware/             # Pico W 韌體 (MicroPython)
├── docker/               # Docker 配置
├── docs/                 # 文檔
├── scripts/              # 腳本工具
├── CLAUDE.md            # Claude Code 記憶檔案
├── CODING_STANDARDS.md  # 程式碼規範
└── README.md            # 本檔案
```

詳細的目錄結構請參考 [SOLARSDGS_IOT_PROJECT_STRUCTURE.md](./SOLARSDGS_IOT_PROJECT_STRUCTURE.md)

---

## 🛠️ 技術棧

### 後端
- **語言**: TypeScript 5.0+
- **框架**: Express.js 4.18+
- **資料庫**: PostgreSQL 16 + node-pg
- **MQTT**: MQTT.js 5.0+
- **即時通訊**: Socket.io 4.6+
- **認證**: JWT (jsonwebtoken)
- **日誌**: Winston 3.8+
- **測試**: Jest + Supertest
- **API 文檔**: Swagger/OpenAPI
- **圖像處理**: Sharp 0.33+ (調整大小、壓縮、格式轉換)
- **檔案上傳**: Multer 1.4+ (多部分表單數據處理)
- **CSV 生成**: csv-writer 1.6+
- **UUID 生成**: uuid 9.0+

### 前端
- **框架**: Vue 3.4+ (Composition API)
- **建構工具**: Vite 6.4+
- **語言**: TypeScript 5.0+
- **狀態管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP 客戶端**: Axios 1.6+
- **圖表**: Chart.js 4.4+ with plugins (zoom, annotation, time adapter)
- **地圖**: Leaflet 1.9+
- **圖像檢視器**: Viewerjs 1.11+ / v-viewer 3.0+
- **CSV 處理**: PapaParse 5.5+
- **檔案下載**: file-saver 2.0+
- **UI 框架**: Element Plus 2.4+ (可選)

### DevOps
- **容器化**: Docker + Docker Compose
- **反向代理**: Caddy 2.7+
- **CI/CD**: GitHub Actions
- **代碼品質**: ESLint + Prettier
- **版本控制**: Git

---

## 📊 資料庫設計

### 核心資料表

```sql
-- 設備資料表
CREATE TABLE devices (
  device_id VARCHAR(50) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 功率數據表
CREATE TABLE solar_power_data (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(device_id),
  timestamp TIMESTAMP NOT NULL,
  pg INTEGER NOT NULL,           -- 發電功率
  pa INTEGER NOT NULL,           -- 負載 A 功率
  pp INTEGER NOT NULL,           -- 負載 P 功率
  pag_efficiency DECIMAL(5,2),  -- 負載 A 效率
  ppg_efficiency DECIMAL(5,2),  -- 負載 P 效率
  UNIQUE(device_id, timestamp)
);

-- GPS 位置表
CREATE TABLE gps_locations (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(device_id),
  timestamp TIMESTAMP NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  altitude DECIMAL(8,2),
  satellites INTEGER
);

-- 設備配置表
CREATE TABLE device_config (
  device_id VARCHAR(50) PRIMARY KEY REFERENCES devices(device_id),
  factor_a DECIMAL(5,2) DEFAULT 1.0,
  factor_p DECIMAL(5,2) DEFAULT 1.0,
  pizero2_on INTEGER DEFAULT 5,
  pizero2_off INTEGER DEFAULT 55,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 圖像資料表 (新增)
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) REFERENCES devices(device_id),
  rgb_image_path VARCHAR(255) NOT NULL,
  thermal_image_path VARCHAR(255) NOT NULL,
  rgb_thumbnail_path VARCHAR(255),
  thermal_thumbnail_path VARCHAR(255),
  rgb_file_size INTEGER,
  thermal_file_size INTEGER,
  captured_at TIMESTAMP NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

完整的資料庫設計請參考 [docs/architecture/04-database-schema.md](docs/architecture/04-database-schema.md)

---

## 🧪 測試

```bash
# 後端測試
cd backend

npm run test              # 執行所有測試
npm run test:unit         # 單元測試
npm run test:integration  # 整合測試
npm run test:e2e          # 端對端測試
npm run test:coverage     # 測試覆蓋率報告

# 前端測試
cd frontend

npm run test              # 執行所有測試
npm run test:unit         # 單元測試 (Vitest)
npm run test:e2e          # 端對端測試 (Playwright)
```

---

## 📦 建構與部署

### 開發環境

```bash
# 使用 Docker Compose
docker-compose -f docker/docker-compose.dev.yml up
```

### 生產環境

```bash
# 1. 建構前端
cd frontend
npm run build

# 2. 建構後端
cd ../backend
npm run build

# 3. 使用 Docker 部署
cd ..
docker-compose -f docker/docker-compose.prod.yml up -d

# 4. 或使用腳本一鍵部署
./scripts/deploy-prod.sh
```

### VPS 部署

詳細的 VPS 部署指南請參考 [docs/deployment/02-vps-deployment.md](docs/deployment/02-vps-deployment.md)

---

## 📚 Documentation

**Language**: [English](#) | [繁體中文](.github/README_ZH.md)

### 🌟 Essential Documents (Must Read)

1. **[Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)** ⭐
   Complete production environment setup with VPS + Docker + Caddy architecture (1000+ lines)

2. **[VPS Quick Reference](docs/VPS_QUICK_REFERENCE.md)** ⚡
   Quick reference card with all key information and common commands

3. **[Claude Code Guide](CLAUDE.md)** 🤖
   Development guidelines and best practices for using Claude Code

4. **[Documentation Update Log](DOCUMENTATION_UPDATE.md)** 📋
   Complete record of all documentation updates and changes

### Development Docs

- **[Coding Standards](CODING_STANDARDS.md)** - Detailed coding conventions and best practices
- **[File Navigation](FILE_NAVIGATION.md)** - Project structure and file organization guide
- **[Deployment Steps](DEPLOYMENT_STEPS.md)** - Complete deployment workflow
- **[Project Summary](PROJECT_SUMMARY.md)** - High-level project overview and goals
- **[Setup Complete](SETUP_COMPLETE.md)** - Post-setup verification checklist

### Deployment Docs

- **[Quick Start Guide](docs/deployment/QUICK_START.md)** - Fast deployment to Hostinger VPS
- **[MCP Setup](docs/MCP_SETUP.md)** - Hostinger API integration guide
- **[MCP Installation](MCP_INSTALLATION.md)** - MCP installation instructions

### Architecture Overview

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vue 3 + TypeScript + Vite
- **Database**: PostgreSQL 16
- **Message Queue**: Eclipse Mosquitto MQTT
- **Reverse Proxy**: Caddy (Auto HTTPS with Let's Encrypt)
- **Deployment**: Docker Compose with multi-service orchestration

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
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 程式碼格式化

```bash
# 格式化所有程式碼
npm run format

# 檢查程式碼風格
npm run lint

# 自動修復問題
npm run lint:fix
```

---

## 🐛 已知問題

### 開發中功能
- ✅ **圖像監控功能** - 已完成套件安裝與架構設計
- ✅ **CSV 數據匯出** - 已完成套件安裝
- ✅ **圖表增強功能** - 已安裝 zoom, annotation, time adapter 套件
- ⏳ OTA 遠端更新功能（規劃中）
- ⏳ MQTT TLS 加密（規劃中）
- ⏳ 多語言支援（規劃中）
- ⏳ 移動 App（規劃中）

### 效能優化
- ⚠️ GPS 定位成功率 85%（目標 >90%）
- ⚠️ 設備在線率 98.5%（目標 >99%）

---

## 🤝 貢獻指南

我們歡迎所有形式的貢獻！

### 如何貢獻

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 遵循 [程式碼規範](CODING_STANDARDS.md)
4. 撰寫測試並確保測試通過
5. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
6. 推送到分支 (`git push origin feature/AmazingFeature`)
7. 開啟 Pull Request

### 提交訊息規範

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**類型 (type)**:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響代碼運行）
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建構過程或輔助工具的變動

**範例**:
```bash
feat(backend): 新增批次插入功率數據 API

- 實作 PowerDataService.batchCreate() 方法
- 優化 SQL 語句以支援批次插入
- 新增相關單元測試

Closes #123
```

---

## 📊 專案狀態

### 開發進度

| 階段 | 狀態 | 完成度 | 說明 |
|------|------|---------|------|
| Phase 0 | ✅ | 100% | 專案規劃與架構設計 |
| Phase 1 | ⏳ | 0% | 後端核心開發 |
| Phase 2 | ⏳ | 0% | 前端 UI 開發 |
| Phase 3 | ⏳ | 0% | 整合測試 |
| Phase 4 | ⏳ | 0% | 部署上線 |

### 效能指標

| 指標 | 目標 | 現狀 | 狀態 |
|------|------|------|------|
| API 響應時間 | < 200ms | - | ⏳ |
| 數據延遲 | < 5s | 2-3s | ✅ |
| 資料庫寫入 | < 100ms | 50-80ms | ✅ |
| Dashboard 載入 | < 2s | 1.5s | ✅ |
| 設備在線率 | > 99% | 98.5% | ⚠️ |
| GPS 定位成功率 | > 90% | 85% | ⚠️ |

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 👥 團隊

- **專案負責人**: Gray Wei
- **Email**: [您的 Email]
- **GitHub**: [@solarsdgs](https://github.com/solarsdgs)

---

## 🙏 致謝

- 感謝 [Node-RED](https://nodered.org/) 提供的靈感
- 感謝 [Vue.js](https://vuejs.org/) 和 [Express.js](https://expressjs.com/) 社群
- 感謝所有貢獻者和支持者

---

## 📞 聯絡方式

- **GitHub Issues**: [提交問題](https://github.com/solarsdgs/iot-platform/issues)
- **Email**: support@solarsdgs.com
- **技術部落格**: https://blog.solarsdgs.com

---

**最後更新**: 2025-11-12  
**版本**: 1.0.0  
**維護者**: SolarSDGs Development Team

---

## 🔗 相關連結

- [專案架構詳細說明](./SOLARSDGS_IOT_PROJECT_STRUCTURE.md)
- [Claude Code 記憶檔案](./CLAUDE.md)
- [程式碼規範](./CODING_STANDARDS.md)
- [API 文檔](https://api.solarsdgs.com/docs)
- [原始 Node-RED 架構](./docs/migration/node-red-to-nodejs.md)
