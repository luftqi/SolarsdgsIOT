# SolarSDGs IoT - 所需套件清單

> 📦 從 Node-RED 遷移所需的完整套件列表
> 確保圖表、地圖、圖像處理、資料匯出功能完整

---

## 🎯 功能需求對照表

| Node-RED 功能 | 新系統實現 | 所需套件 |
|--------------|-----------|---------|
| **圖表顯示** | Chart.js + Vue | ✅ 已安裝 |
| **地圖顯示** | Leaflet | ✅ 已安裝 |
| **即時更新** | Socket.IO | ✅ 已安裝 |
| **資料匯出** | 多格式匯出 | ⚠️ 需要安裝 |
| **圖像處理** | Sharp + 前端 | ⚠️ 需要安裝 |
| **PDF 生成** | jsPDF | ⚠️ 需要安裝 |

---

## ✅ 已安裝的前端套件

### 核心框架
```json
{
  "vue": "^3.4.3",
  "vue-router": "^4.2.5",
  "pinia": "^2.1.7"
}
```

### 資料視覺化
```json
{
  "chart.js": "^4.4.1",              // 圖表庫
  "vue-chartjs": "^5.3.0",           // Vue Chart 組件
  "leaflet": "^1.9.4"                // 地圖庫
}
```

### 網路通訊
```json
{
  "axios": "^1.6.5",                 // HTTP 請求
  "socket.io-client": "^4.6.2"       // WebSocket 即時通訊
}
```

### 工具庫
```json
{
  "@vueuse/core": "^10.7.1",         // Vue 組合式 API 工具
  "dayjs": "^1.11.10"                // 時間處理
}
```

---

## 📦 需要安裝的前端套件

### 1. 增強圖表功能

```bash
cd frontend
npm install chartjs-plugin-zoom@^2.0.1 \
            chartjs-plugin-annotation@^3.0.1 \
            chartjs-adapter-dayjs-4@^1.0.4
```

**功能**:
- 圖表縮放與平移
- 添加標註線和區域
- 時間軸格式化

### 2. 增強地圖功能

```bash
npm install @vue-leaflet/vue-leaflet@^0.10.1
```

**功能**:
- Vue 3 優化的 Leaflet 組件
- 更好的 TypeScript 支持

### 3. 資料匯出功能 ⭐ 重要

```bash
npm install file-saver@^2.0.5 \
            papaparse@^5.4.1 \
            xlsx@^0.18.5 \
            jspdf@^2.5.2 \
            jspdf-autotable@^3.8.2
```

**功能**:
- `file-saver`: 瀏覽器端檔案下載
- `papaparse`: CSV 解析與生成
- `xlsx`: Excel 檔案生成 (.xlsx)
- `jspdf`: PDF 生成
- `jspdf-autotable`: PDF 表格插件

**對應的 TypeScript 類型**:
```bash
npm install -D @types/file-saver@^2.0.7 \
               @types/papaparse@^5.3.14
```

### 4. 圖像處理與顯示

```bash
npm install compressorjs@^1.2.1 \
            v-viewer@^3.0.11
```

**功能**:
- `compressorjs`: 圖片壓縮
- `v-viewer`: 圖片查看器 (支援縮放、旋轉)

### 5. 資料表格與視覺化增強

```bash
npm install vue3-easy-data-table@^1.5.47 \
            @vueuse/motion@^2.1.0
```

**功能**:
- 高效能資料表格
- 平滑動畫效果

---

## 📦 需要安裝的後端套件

### 1. 檔案處理 ⭐ 重要

```bash
cd backend
npm install multer@^1.4.5-lts.1 \
            sharp@^0.33.5 \
            archiver@^7.0.1 \
            csv-writer@^1.6.0 \
            exceljs@^4.4.0
```

**TypeScript 類型**:
```bash
npm install -D @types/multer@^1.4.12
```

**功能**:
- `multer`: 檔案上傳中介軟體
- `sharp`: 高效能圖片處理 (裁切、縮放、轉檔)
- `archiver`: ZIP 壓縮 (批量下載)
- `csv-writer`: 伺服器端 CSV 生成
- `exceljs`: 伺服器端 Excel 生成

### 2. 資料匯出 API

```bash
npm install json2csv@^6.0.0 \
            fast-csv@^5.0.1
```

**功能**:
- JSON 轉 CSV
- 高效能 CSV 串流處理

### 3. 排程任務 (可選)

```bash
npm install node-cron@^3.0.3
```

**TypeScript 類型**:
```bash
npm install -D @types/node-cron@^3.0.11
```

**功能**:
- 定時匯出報表
- 定時清理舊資料

---

## 🖥️ VPS 系統套件

### 已安裝 ✅

```bash
# 圖像處理庫
libvips-dev libvips-tools

# 字體支持 (PDF/圖片生成需要)
fonts-liberation fonts-noto-cjk fonts-wqy-zenhei
```

### 需要確認安裝

```bash
ssh root@72.61.117.219

# 檢查是否安裝
dpkg -l | grep -E "(libvips|fonts-liberation)"

# 如果缺少,安裝:
sudo apt update
sudo apt install -y libvips-dev libvips-tools \
                    fonts-liberation fonts-noto-cjk \
                    fonts-wqy-zenhei imagemagick
```

---

## 📊 功能實現檢查清單

### 圖表功能
- [x] 基礎折線圖
- [ ] 圖表縮放與平移
- [ ] 多 Y 軸支持
- [ ] 即時更新圖表
- [ ] 圖表匯出為圖片
- [ ] 自訂時間範圍

### 地圖功能
- [x] 基礎地圖顯示
- [ ] 設備位置標記
- [ ] 地圖圖層切換
- [ ] 路線追蹤
- [ ] 區域熱力圖
- [ ] 地圖匯出

### 資料匯出
- [ ] CSV 格式匯出
- [ ] Excel 格式匯出
- [ ] PDF 報表生成
- [ ] 批量下載 (ZIP)
- [ ] 自訂時間範圍
- [ ] 選擇匯出欄位

### 圖像處理
- [ ] 圖片上傳
- [ ] 圖片壓縮
- [ ] 圖片裁切
- [ ] 縮圖生成
- [ ] 圖片格式轉換
- [ ] 圖片查看器

---

## 🚀 安裝指令快速參考

### 前端完整安裝

```bash
cd C:\Users\wg444\solarsdgs-iot\frontend

# 圖表增強
npm install chartjs-plugin-zoom chartjs-plugin-annotation chartjs-adapter-dayjs-4

# 地圖增強
npm install @vue-leaflet/vue-leaflet

# 資料匯出
npm install file-saver papaparse xlsx jspdf jspdf-autotable

# 圖像處理
npm install compressorjs v-viewer

# 資料表格
npm install vue3-easy-data-table @vueuse/motion

# TypeScript 類型
npm install -D @types/file-saver @types/papaparse
```

### 後端完整安裝

```bash
cd C:\Users\wg444\solarsdgs-iot\backend

# 檔案處理
npm install multer sharp archiver csv-writer exceljs

# 資料匯出
npm install json2csv fast-csv

# 排程任務
npm install node-cron

# TypeScript 類型
npm install -D @types/multer @types/node-cron
```

### VPS 系統套件

```bash
ssh root@72.61.117.219
sudo apt update
sudo apt install -y libvips-dev libvips-tools \
                    fonts-liberation fonts-noto-cjk \
                    fonts-wqy-zenhei imagemagick ghostscript
```

---

## 📝 安裝後配置

### 1. 更新 package.json

前端 `frontend/package.json`:
```json
{
  "dependencies": {
    // ... 現有套件 ...
    "chartjs-plugin-zoom": "^2.0.1",
    "chartjs-plugin-annotation": "^3.0.1",
    "chartjs-adapter-dayjs-4": "^1.0.4",
    "@vue-leaflet/vue-leaflet": "^0.10.1",
    "file-saver": "^2.0.5",
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.2",
    "compressorjs": "^1.2.1",
    "v-viewer": "^3.0.11",
    "vue3-easy-data-table": "^1.5.47",
    "@vueuse/motion": "^2.1.0"
  }
}
```

後端 `backend/package.json`:
```json
{
  "dependencies": {
    // ... 現有套件 ...
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.5",
    "archiver": "^7.0.1",
    "csv-writer": "^1.6.0",
    "exceljs": "^4.4.0",
    "json2csv": "^6.0.0",
    "fast-csv": "^5.0.1",
    "node-cron": "^3.0.3"
  }
}
```

### 2. 配置 TypeScript

`frontend/src/types/exports.d.ts`:
```typescript
declare module 'jspdf-autotable';
declare module 'v-viewer';
```

### 3. 註冊 Vue 插件

`frontend/src/main.ts`:
```typescript
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'

app.use(VueViewer)
```

---

## 🎯 優先級建議

### 高優先級 (立即安裝)
1. ✅ 資料匯出套件 (CSV, Excel, PDF)
2. ✅ 圖表增強套件 (縮放、標註)
3. ✅ 檔案上傳與處理 (multer, sharp)

### 中優先級 (第二階段)
4. ⭕ 圖像處理套件
5. ⭕ 地圖增強功能
6. ⭕ 資料表格組件

### 低優先級 (可選)
7. 🔵 排程任務
8. 🔵 動畫效果
9. 🔵 高級視覺化

---

## 📞 需要協助？

如果安裝過程中遇到問題:

1. **套件衝突**: 檢查 `package.json` 版本相容性
2. **編譯錯誤**: 確認 VPS 已安裝系統依賴
3. **TypeScript 錯誤**: 安裝對應的 `@types/*` 套件
4. **運行錯誤**: 檢查環境變數配置

---

**文檔版本**: 1.0.0
**最後更新**: 2025-11-12
**維護者**: SolarSDGs Development Team
