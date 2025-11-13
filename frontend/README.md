# SolarSDGs IoT - Frontend

> Vue 3 + TypeScript + Vite 前端應用

## 技術棧

- **框架**: Vue 3.4+ (Composition API)
- **建構工具**: Vite 6.4+
- **語言**: TypeScript 5.3+
- **狀態管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **圖表**: Chart.js 4.4+ / Vue-ChartJS 5.3+
  - chartjs-plugin-zoom: 圖表縮放與平移
  - chartjs-plugin-annotation: 註釋標記
  - chartjs-adapter-dayjs-4: 時間軸支援
- **地圖**: Leaflet 1.9+
- **圖像檢視**: Viewerjs 1.11+ / v-viewer 3.0+
- **數據處理**:
  - PapaParse 5.5+: CSV 解析
  - file-saver 2.0+: 檔案下載
- **HTTP 客戶端**: Axios 1.6+
- **WebSocket**: Socket.io-client 4.6+

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

應用會在 http://localhost:5173 啟動

### 4. 建構生產版本

```bash
npm run build
npm run preview
```

## 專案結構

```
frontend/
├── public/              # 靜態資源
│   ├── favicon.ico
│   └── icons/          # PWA 圖標
├── src/
│   ├── assets/         # 靜態資產
│   │   ├── styles/     # CSS 檔案
│   │   └── images/     # 圖片資源
│   ├── components/     # Vue 組件
│   │   ├── common/     # 通用組件
│   │   ├── dashboard/  # 儀表板組件 (含 DataExporter)
│   │   ├── map/        # 地圖組件
│   │   ├── image/      # 圖像組件 (新增)
│   │   ├── control/    # 控制組件
│   │   └── admin/      # 管理組件
│   ├── views/          # 頁面視圖
│   ├── composables/    # Composition API
│   │   ├── useChart.ts         # 圖表邏輯
│   │   ├── useImage.ts         # 圖像操作 (新增)
│   │   ├── useImageViewer.ts   # 圖像檢視器 (新增)
│   │   └── useCsvExport.ts     # CSV 匯出 (新增)
│   ├── stores/         # Pinia 狀態管理
│   │   └── image.ts    # 圖像狀態 (新增)
│   ├── services/       # API 服務
│   │   ├── imageApi.ts   # 圖像 API (新增)
│   │   └── exportApi.ts  # 匯出 API (新增)
│   ├── router/         # Vue Router
│   ├── utils/          # 工具函數
│   ├── types/          # TypeScript 類型
│   ├── App.vue         # 根組件
│   └── main.ts         # 應用入口
└── tests/              # 測試檔案
```

## 可用命令

```bash
# 開發
npm run dev              # 啟動開發伺服器 (with HMR)

# 建構
npm run build            # 編譯並打包
npm run preview          # 預覽生產建構

# 測試
npm run test             # 執行測試
npm run test:unit        # 單元測試
npm run test:e2e         # E2E 測試

# 程式碼品質
npm run lint             # 檢查程式碼
npm run lint:fix         # 自動修復
npm run format           # 格式化程式碼
```

## 主要功能模組

### 1. 儀表板 (Dashboard)
- 即時功率數據顯示 (PG, PA, PP)
- 效率指標顯示 (PAG, PPG)
- 歷史數據圖表 (支援縮放、平移、註釋)
- 設備選擇器
- 時間範圍選擇器
- **CSV 數據匯出** (新增)

### 2. 地圖視圖 (Map)
- GPS 位置追蹤
- 設備標記
- Leaflet 互動式地圖

### 3. 圖像瀏覽 (Images) - 新增
- RGB 與熱影像圖顯示
- 圖像時間軸瀏覽
- 圖像檢視器 (縮放、全螢幕、旋轉)
- RGB / 熱影像對比檢視
- 圖像畫廊

### 4. 控制面板 (Control)
- 設備配置管理
- Factor 參數調整
- 設備控制 (重啟/OTA)

### 5. 管理後台 (Admin)
- 設備管理
- 用戶管理
- 系統統計

## 開發規範

請遵循專案根目錄的 [CLAUDE.md](../CLAUDE.md) 和 [CODING_STANDARDS.md](../CODING_STANDARDS.md)

### 重點規則

1. **Composition API**: 使用 `<script setup>` 語法
2. **TypeScript**: 所有組件必須有類型定義
3. **命名規範**:
   - 組件: PascalCase (PowerCard.vue)
   - Composable: use-xxx.ts
   - 變數/函數: camelCase
4. **Props 與 Emits**: 明確定義類型
5. **狀態管理**: 複雜狀態使用 Pinia

## 組件範例

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  value: number;
  label: string;
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'W'
});

const displayValue = computed(() => props.value.toFixed(2));
</script>

<template>
  <div class="power-card">
    <div class="power-card__label">{{ label }}</div>
    <div class="power-card__value">{{ displayValue }} {{ unit }}</div>
  </div>
</template>

<style scoped>
.power-card {
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
```

## 授權

MIT License

