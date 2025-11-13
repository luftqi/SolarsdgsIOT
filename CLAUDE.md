# SolarSDGs IoT - Claude Code 專案記憶檔案

> 🤖 給 Claude Code 使用的開發指引與規範  
> **使命**: 協助從 Node-RED 遷移到 Node.js + Vue.js | 保持程式碼品質 | 避免常見錯誤

---

## 🚨 最高優先級規則 (CRITICAL)

### ⛔ 禁止自動回滾 (NEVER ROLLBACK)

**重要性**: ⭐⭐⭐⭐⭐

Claude Code 在遇到任何錯誤或問題時:

1. **❌ 絕對禁止**: 自動回滾到舊版本
2. **❌ 絕對禁止**: 未經確認就刪除或修改程式碼
3. **❌ 絕對禁止**: 自動執行 `git reset` 或 `git checkout` 等還原指令
4. **✅ 必須做**: 報告錯誤並停止操作
5. **✅ 必須做**: 提供 3-5 個可能的修復方案
6. **✅ 必須做**: 等待用戶明確選擇後再繼續

### ⛔ 禁止未經同意創建腳本或文件 (NEVER CREATE WITHOUT PERMISSION)

**重要性**: ⭐⭐⭐⭐⭐

Claude Code 在創建新文件或腳本時:

1. **❌ 絕對禁止**: 未經用戶明確同意就創建新的腳本文件
2. **❌ 絕對禁止**: 自動生成多個「輔助工具」或「部署腳本」
3. **❌ 絕對禁止**: 創建用戶沒有要求的「便利工具」
4. **✅ 必須做**: 先詢問用戶是否需要創建該文件
5. **✅ 必須做**: 說明為什麼需要這個文件
6. **✅ 必須做**: 等待用戶明確同意後才創建

**正確流程**:
```
需要新文件 → 說明原因 → 詢問用戶 → 等待同意 → 創建文件
```

**用戶偏好**:
- 用戶希望自己 100% 控制所有文件的創建
- 如需安裝依賴，直接連接 VPS 執行命令，不要創建腳本
- 盡量使用現有工具和直接執行，而非創建新腳本

**錯誤處理流程**:
```
遇到錯誤 → 停止 → 分析原因 → 提供方案 → 等待確認 → 執行修復
```

**示範**:
```
❌ 錯誤:
"編譯失敗,讓我回滾到上個版本..."

✅ 正確:
"編譯失敗。錯誤: Cannot find module 'xxx'

可能的修復方案:
1. 安裝缺少的依賴: npm install xxx
2. 檢查 import 路徑是否正確
3. 清理 node_modules 並重新安裝

請選擇修復方案?"
```

---

## 🏗️ 核心架構原則

### 1. **分層架構必須嚴格遵守**

```
Controller (路由層)
    ↓ 呼叫
Service (業務邏輯層)
    ↓ 呼叫
Repository (資料訪問層)
    ↓ 呼叫
Database (PostgreSQL)
```

**規則**:
- ✅ Controller 只處理: HTTP 請求/響應、參數驗證、呼叫 Service
- ✅ Service 處理: 業務邏輯、數據轉換、協調多個 Repository
- ✅ Repository 處理: SQL 查詢、資料庫操作
- ❌ 禁止跨層呼叫 (例如: Controller 直接呼叫 Repository)
- ❌ 禁止在 Controller 中寫業務邏輯
- ❌ 禁止在 Repository 中寫業務邏輯

### 2. **從 Node-RED 到 Node.js 的對應關係**

| Node-RED 節點 | Node.js 實現 | 檔案路徑 |
|--------------|-------------|---------|
| MQTT In | `MqttService.subscribe()` | `backend/src/services/mqtt/MqttService.ts` |
| 數據解析器 Function | `DataParser.parse()` | `backend/src/services/mqtt/DataParser.ts` |
| GPS 解析器 Function | `GpsParser.parse()` | `backend/src/services/mqtt/GpsParser.ts` |
| SQL生成器 Function | `SqlGenerator.generate()` | `backend/src/services/database/SqlGenerator.ts` |
| PostgreSQL 節點 | `PowerDataRepository` | `backend/src/services/database/PowerDataRepo.ts` |
| 配置同步器 Function | `ConfigSync.sync()` | `backend/src/services/device/ConfigSync.ts` |
| 格式化UI數據 Function | `UiFormatter.format()` | `backend/src/services/realtime/UiFormatter.ts` |
| MQTT Out | `MqttService.publish()` | `backend/src/services/mqtt/MqttService.ts` |
| Dashboard Template | Vue Components | `frontend/src/components/` |
| **圖像上傳處理** (新增) | `ImageService.upload()` | `backend/src/services/image/ImageService.ts` |
| **CSV 匯出** (新增) | `CsvExporter.export()` | `backend/src/services/database/CsvExporter.ts` |

**重要**: 每個 Node-RED Function 節點都應該轉換成對應的 TypeScript class 或 function

### 3. **新增功能架構 (2025-11-13)**

#### 圖像監控系統
- **Pi Zero 2W 自動拍攝**: 每 10 分鐘拍攝 RGB + 熱影像圖
- **圖像上傳**: HTTP POST multipart/form-data
- **圖像處理**: Sharp (壓縮、縮圖生成、格式轉換)
- **儲存架構**: 檔案系統 + PostgreSQL 元數據
- **前端檢視**: Viewerjs (縮放、全螢幕、時間軸)

#### 數據匯出系統
- **匯出格式**: 僅支援 CSV (不支援 Excel/PDF)
- **匯出內容**: 功率數據、GPS 數據、設備狀態
- **前端處理**: PapaParse (CSV 解析) + file-saver (下載)

#### 圖表增強功能
- **縮放與平移**: chartjs-plugin-zoom
- **註釋標記**: chartjs-plugin-annotation
- **時間軸**: chartjs-adapter-dayjs-4

---

## 🔧 開發規範速查表

### TypeScript 規範

```typescript
// ✅ 正確: 明確的類型定義
interface PowerData {
  device_id: string;
  timestamp: Date;
  pg: number;
  pa: number;
  pp: number;
  pag?: number;
  ppg?: number;
}

// ✅ 正確: async/await
async function fetchData(): Promise<PowerData[]> {
  const result = await repository.findAll();
  return result;
}

// ❌ 錯誤: 使用 any
function process(data: any) { }  // ❌

// ❌ 錯誤: 使用 callback
function getData(cb: Function) { }  // ❌
```

### 命名規範

```typescript
// ✅ 檔案命名
MqttService.ts          // PascalCase (類別)
powerData.types.ts      // camelCase (類型定義)
use-websocket.ts        // kebab-case (composable)

// ✅ 變數命名
const deviceId = '6001';           // camelCase (變數)
const API_URL = 'https://...';     // UPPER_SNAKE_CASE (常數)
class PowerDataService { }         // PascalCase (類別)
function calculateEfficiency() { } // camelCase (函數)

// ❌ 錯誤命名
const device_id = '6001';     // ❌ 不用 snake_case
const apiUrl = 'https://...'; // ❌ 常數應該大寫
class powerDataService { }    // ❌ 類別應該 PascalCase
```

### 錯誤處理規範

```typescript
// ✅ 正確: 統一的錯誤類別
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// ✅ 正確: try-catch
try {
  const result = await service.create(data);
  return result;
} catch (error) {
  if (error instanceof AppError) {
    throw error;
  }
  throw new AppError(500, 'Internal server error');
}

// ❌ 錯誤: 拋出字串
throw 'Error occurred';  // ❌

// ❌ 錯誤: 不處理錯誤
const result = await service.create(data);  // ❌ 沒有 try-catch
```

---

## 📝 程式碼撰寫範本

### 後端 Service 範本

```typescript
// backend/src/services/[domain]/[Name]Service.ts

import { Injectable } from '@nestjs/common';  // 如果使用 NestJS
import { AppError } from '@/utils/errors';
import { Logger } from '@/utils/logger';

export class PowerDataService {
  private readonly logger = new Logger(PowerDataService.name);

  constructor(
    private readonly powerDataRepo: PowerDataRepository,
    private readonly mqttService: MqttService
  ) {}

  /**
   * 創建功率數據
   * @param data 功率數據
   * @returns 創建的數據
   * @throws AppError 如果驗證失敗或儲存失敗
   */
  async createPowerData(data: CreatePowerDataDto): Promise<PowerData> {
    // 1. 驗證
    this.validatePowerData(data);
    
    // 2. 業務邏輯
    const efficiency = this.calculateEfficiency(data);
    
    // 3. 儲存
    const saved = await this.powerDataRepo.insert({
      ...data,
      ...efficiency
    });
    
    // 4. 後續操作
    await this.mqttService.sendAck(data.device_id, saved.id);
    
    this.logger.info(`Created power data for device ${data.device_id}`);
    return saved;
  }

  private validatePowerData(data: CreatePowerDataDto): void {
    if (data.pg < 0 || data.pg > 10000) {
      throw new AppError(400, 'PG must be between 0 and 10000');
    }
    // ... 其他驗證
  }

  private calculateEfficiency(data: CreatePowerDataDto) {
    const pag = data.pg > 0 ? ((data.pa - data.pg) / data.pg) * 100 : 0;
    const ppg = data.pg > 0 ? ((data.pp - data.pg) / data.pg) * 100 : 0;
    return { pag, ppg };
  }
}
```

### 前端 Composable 範本

```typescript
// frontend/src/composables/usePowerData.ts

import { ref, computed } from 'vue';
import { powerDataApi } from '@/services/powerDataApi';
import type { PowerData } from '@/types/power.types';

export function usePowerData() {
  // State
  const data = ref<PowerData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const latestData = computed(() => {
    return data.value.length > 0 
      ? data.value[data.value.length - 1] 
      : null;
  });

  const avgPower = computed(() => {
    if (data.value.length === 0) return 0;
    const sum = data.value.reduce((acc, item) => acc + item.pg, 0);
    return sum / data.value.length;
  });

  // Methods
  async function fetchData(deviceId: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await powerDataApi.getByDevice(deviceId);
      data.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data';
      console.error('Error fetching power data:', err);
    } finally {
      loading.value = false;
    }
  }

  function clearData() {
    data.value = [];
    error.value = null;
  }

  return {
    // State
    data,
    loading,
    error,
    
    // Computed
    latestData,
    avgPower,
    
    // Methods
    fetchData,
    clearData
  };
}
```

### Vue 組件範本

```vue
<!-- frontend/src/components/dashboard/PowerCard.vue -->

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'W',
  color: '#3498db'
});

const emit = defineEmits<{
  (e: 'click'): void
}>();

const displayValue = computed(() => {
  return props.value.toFixed(2);
});

const cardStyle = computed(() => ({
  borderColor: props.color
}));
</script>

<template>
  <div class="power-card" :style="cardStyle" @click="emit('click')">
    <div class="power-card__label">{{ label }}</div>
    <div class="power-card__value">
      {{ displayValue }}
      <span class="power-card__unit">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped>
.power-card {
  padding: 20px;
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.power-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.power-card__label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.power-card__value {
  font-size: 32px;
  font-weight: bold;
}

.power-card__unit {
  font-size: 16px;
  font-weight: normal;
  margin-left: 4px;
}
</style>
```

---

## 📝 新增功能程式碼範本 (2025-11-13)

### 圖像上傳服務範本

```typescript
// backend/src/services/image/ImageService.ts

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '@/utils/errors';
import { Logger } from '@/utils/logger';
import type { ImageRepo } from '@/services/database/ImageRepo';

interface UploadedImage {
  deviceId: string;
  rgbImage: Express.Multer.File;
  thermalImage: Express.Multer.File;
  capturedAt: Date;
}

export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly uploadDir = path.join(__dirname, '../../../uploads/images');

  constructor(private readonly imageRepo: ImageRepo) {}

  /**
   * 處理圖像上傳（RGB + 熱影像）
   */
  async uploadImages(data: UploadedImage) {
    try {
      // 1. 生成唯一 ID
      const imageId = uuidv4();

      // 2. 儲存原始圖像
      const rgbPath = await this.saveImage(data.rgbImage, imageId, 'rgb');
      const thermalPath = await this.saveImage(data.thermalImage, imageId, 'thermal');

      // 3. 生成縮圖
      const rgbThumbPath = await this.generateThumbnail(rgbPath, imageId, 'rgb');
      const thermalThumbPath = await this.generateThumbnail(thermalPath, imageId, 'thermal');

      // 4. 儲存元數據到資料庫
      const saved = await this.imageRepo.insert({
        deviceId: data.deviceId,
        rgbImagePath: rgbPath,
        thermalImagePath: thermalPath,
        rgbThumbnailPath: rgbThumbPath,
        thermalThumbnailPath: thermalThumbPath,
        rgbFileSize: data.rgbImage.size,
        thermalFileSize: data.thermalImage.size,
        capturedAt: data.capturedAt
      });

      this.logger.info(`Images uploaded for device ${data.deviceId}`);
      return saved;

    } catch (error) {
      this.logger.error('Failed to upload images:', error);
      throw new AppError(500, 'Failed to upload images');
    }
  }

  /**
   * 儲存圖像檔案
   */
  private async saveImage(
    file: Express.Multer.File,
    imageId: string,
    type: 'rgb' | 'thermal'
  ): Promise<string> {
    const dir = path.join(this.uploadDir, type);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${imageId}.jpg`;
    const filepath = path.join(dir, filename);

    // 使用 Sharp 壓縮並儲存
    await sharp(file.buffer)
      .jpeg({ quality: 85 })
      .toFile(filepath);

    return `/uploads/images/${type}/${filename}`;
  }

  /**
   * 生成縮圖
   */
  private async generateThumbnail(
    imagePath: string,
    imageId: string,
    type: 'rgb' | 'thermal'
  ): Promise<string> {
    const dir = path.join(this.uploadDir, 'thumbnails', type);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${imageId}_thumb.jpg`;
    const filepath = path.join(dir, filename);

    const fullPath = path.join(__dirname, '../../..', imagePath);

    await sharp(fullPath)
      .resize(320, 240, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(filepath);

    return `/uploads/images/thumbnails/${type}/${filename}`;
  }
}
```

### CSV 匯出服務範本

```typescript
// backend/src/services/database/CsvExporter.ts

import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { AppError } from '@/utils/errors';
import { Logger } from '@/utils/logger';
import type { PowerDataRepo } from './PowerDataRepo';

export class CsvExporter {
  private readonly logger = new Logger(CsvExporter.name);
  private readonly exportDir = path.join(__dirname, '../../../exports');

  constructor(private readonly powerDataRepo: PowerDataRepo) {}

  /**
   * 匯出功率數據為 CSV
   */
  async exportPowerData(
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    try {
      // 1. 查詢數據
      const data = await this.powerDataRepo.findByDateRange(
        deviceId,
        startDate,
        endDate
      );

      if (data.length === 0) {
        throw new AppError(404, 'No data found for the specified date range');
      }

      // 2. 建立 CSV Writer
      const filename = `power_data_${deviceId}_${Date.now()}.csv`;
      const filepath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'deviceId', title: 'Device ID' },
          { id: 'pg', title: 'PG (W)' },
          { id: 'pa', title: 'PA (W)' },
          { id: 'pp', title: 'PP (W)' },
          { id: 'pag', title: 'PAG Efficiency (%)' },
          { id: 'ppg', title: 'PPG Efficiency (%)' }
        ]
      });

      // 3. 寫入數據
      await csvWriter.writeRecords(data);

      this.logger.info(`CSV exported: ${filename}`);
      return filepath;

    } catch (error) {
      this.logger.error('Failed to export CSV:', error);
      throw new AppError(500, 'Failed to export CSV');
    }
  }
}
```

### 前端圖像檢視器 Composable

```typescript
// frontend/src/composables/useImageViewer.ts

import { ref } from 'vue';
import { api as viewerApi } from 'v-viewer';
import type { ImageData } from '@/types/image.types';

export function useImageViewer() {
  const images = ref<ImageData[]>([]);
  const currentIndex = ref(0);

  /**
   * 開啟圖像檢視器
   */
  function showImage(imageList: ImageData[], index: number = 0) {
    images.value = imageList;
    currentIndex.value = index;

    const imageUrls = imageList.map(img => ({
      url: img.rgbImagePath,
      title: `${img.deviceId} - ${new Date(img.capturedAt).toLocaleString()}`
    }));

    viewerApi({
      images: imageUrls.map(img => img.url),
      options: {
        initialViewIndex: index,
        toolbar: true,
        navbar: true,
        title: true,
        keyboard: true,
        zoomRatio: 0.2
      }
    });
  }

  /**
   * 比較 RGB 與熱影像
   */
  function compareImages(image: ImageData) {
    const imageUrls = [
      { url: image.rgbImagePath, title: 'RGB Image' },
      { url: image.thermalImagePath, title: 'Thermal Image' }
    ];

    viewerApi({
      images: imageUrls.map(img => img.url),
      options: {
        toolbar: true,
        navbar: true,
        title: true
      }
    });
  }

  return {
    images,
    currentIndex,
    showImage,
    compareImages
  };
}
```

### 前端 CSV 匯出 Composable

```typescript
// frontend/src/composables/useCsvExport.ts

import { ref } from 'vue';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { PowerData } from '@/types/power.types';

export function useCsvExport() {
  const exporting = ref(false);
  const error = ref<string | null>(null);

  /**
   * 匯出功率數據為 CSV
   */
  function exportPowerData(data: PowerData[], filename: string = 'power_data.csv') {
    exporting.value = true;
    error.value = null;

    try {
      // 1. 準備數據
      const exportData = data.map(item => ({
        'Timestamp': new Date(item.timestamp).toLocaleString(),
        'Device ID': item.deviceId,
        'PG (W)': item.pg,
        'PA (W)': item.pa,
        'PP (W)': item.pp,
        'PAG Efficiency (%)': item.pagEfficiency?.toFixed(2) || 'N/A',
        'PPG Efficiency (%)': item.ppgEfficiency?.toFixed(2) || 'N/A'
      }));

      // 2. 轉換為 CSV
      const csv = Papa.unparse(exportData);

      // 3. 下載檔案
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, filename);

      console.log(`CSV exported: ${filename}`);

    } catch (err: any) {
      error.value = err.message || 'Failed to export CSV';
      console.error('CSV export error:', err);
    } finally {
      exporting.value = false;
    }
  }

  return {
    exporting,
    error,
    exportPowerData
  };
}
```

---

## ⚠️ 常見錯誤與解決方案

### 錯誤 1: 在 Controller 寫業務邏輯

```typescript
// ❌ 錯誤
class PowerDataController {
  async create(req, res) {
    const { pg, pa, pp } = req.body;
    
    // ❌ 業務邏輯不應該在這裡
    const pag = ((pa - pg) / pg) * 100;
    const ppg = ((pp - pg) / pg) * 100;
    
    await db.query('INSERT INTO ...');
    res.json({ success: true });
  }
}

// ✅ 正確
class PowerDataController {
  async create(req, res) {
    // ✅ 只負責呼叫 Service
    const result = await this.powerDataService.createPowerData(req.body);
    res.json(result);
  }
}
```

### 錯誤 2: 忘記錯誤處理

```typescript
// ❌ 錯誤
async function getData() {
  const result = await api.fetch();  // ❌ 沒有錯誤處理
  return result;
}

// ✅ 正確
async function getData() {
  try {
    const result = await api.fetch();
    return result;
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    throw new AppError(500, 'Failed to fetch data');
  }
}
```

### 錯誤 3: 使用 any 類型

```typescript
// ❌ 錯誤
function process(data: any) {  // ❌ 
  return data.value;
}

// ✅ 正確
interface InputData {
  value: number;
}

function process(data: InputData) {  // ✅
  return data.value;
}
```

### 錯誤 4: Vue 組件邏輯過於複雜

```vue
<!-- ❌ 錯誤: 在組件中寫太多邏輯 -->
<script setup>
const data = ref([]);

// ❌ 複雜的邏輯應該在 composable 中
async function fetchData() {
  const response = await fetch('...');
  const json = await response.json();
  data.value = json.map(item => ({
    ...item,
    efficiency: calculateEfficiency(item)
  }));
}
</script>

<!-- ✅ 正確: 使用 composable -->
<script setup>
import { usePowerData } from '@/composables/usePowerData';

const { data, loading, fetchData } = usePowerData();

onMounted(() => {
  fetchData('6001');
});
</script>
```

---

## 📋 檢查清單 (Checklist)

### 每次提交前檢查

- [ ] 所有 TypeScript 類型都有明確定義，沒有使用 `any`
- [ ] 所有 async 函數都有錯誤處理 (try-catch)
- [ ] 遵守分層架構，沒有跨層呼叫
- [ ] 變數和函數命名符合規範
- [ ] 有適當的註釋和 JSDoc
- [ ] 通過 ESLint 檢查 (`npm run lint`)
- [ ] 通過所有測試 (`npm run test`)
- [ ] 沒有 console.log (應該使用 Logger)

### 創建新功能前檢查

- [ ] 閱讀相關的 Node-RED Function 節點程式碼
- [ ] 確定應該在哪一層實作 (Controller/Service/Repository)
- [ ] 檢查是否有類似的現有程式碼可以參考
- [ ] 規劃需要的 TypeScript 類型定義
- [ ] 考慮錯誤處理情況

### 重構程式碼前檢查

- [ ] 確保有足夠的測試覆蓋
- [ ] 確認重構不會影響現有功能
- [ ] 確認其他開發者同意重構方案
- [ ] 分成小步驟進行，每步都可以編譯和測試

---

## 🎯 開發優先順序

### Phase 1: 後端核心開發 ✅ **已完成**

1. **MQTT 服務** ✅ **已完成**
   - ✅ `MqttService.ts` - MQTT 連接管理
   - ✅ `DataParser.ts` - 數據解析器 (240 lines, 100% Node-RED parity)
   - ✅ `GpsParser.ts` - GPS 解析器 (130 lines)

2. **資料庫服務** ✅ **已完成**
   - ✅ `DatabaseService.ts` - 資料庫連接 (120 lines)
   - ✅ `PowerDataRepo.ts` - 功率數據儲存庫 (230 lines, UPSERT logic)
   - ✅ `GpsLocationRepo.ts` - GPS 位置儲存庫 (110 lines)
   - ✅ 資料庫 Schema (6 tables, 完整 indexes)

3. **測試工具** ✅ **已完成**
   - ✅ `iot-simulator.ts` - IoT 設備模擬器 (500+ lines)
   - ✅ 完整測試: 50+ power data records, 4 GPS records
   - ✅ 100% 測試通過率

**Phase 1 成果**: [詳細報告](./IMPLEMENTATION_PHASE1_COMPLETE.md) | [測試結果](./TEST_RESULTS_SUCCESS.md)

---

### Phase 2: API 層 + WebSocket (進行中)

1. **API 層**
   - [ ] Routes + Controllers
   - [ ] API 文檔 (Swagger)

2. **即時推送服務**
   - [ ] `WebSocketService.ts` - WebSocket 連接
   - [ ] `UiFormatter.ts` - UI 數據格式化

### Phase 3: 前端開發

1. **核心組件**
   - [ ] PowerCard, EfficiencyCard
   - [ ] PowerChart, EfficiencyChart

2. **頁面視圖**
   - [ ] DashboardView
   - [ ] DeviceView

3. **狀態管理**
   - [ ] Pinia Stores

### Phase 4: 整合與測試

1. **整合測試**
2. **端對端測試**
3. **效能測試**

### Phase 5: 部署上線

1. **Docker 配置**
2. **CI/CD 設置**
3. **監控與日誌**

---

## 🔍 除錯指南

### 後端除錯

```typescript
// ✅ 使用 Logger 而非 console.log
import { Logger } from '@/utils/logger';

const logger = new Logger('PowerDataService');

logger.info('Processing power data', { deviceId: '6001' });
logger.error('Failed to save data', { error: err.message });
logger.debug('Data parsed:', { parsedData });
```

### 前端除錯

```typescript
// ✅ 使用 Vue DevTools
// 安裝: https://devtools.vuejs.org/

// ✅ 使用 computed 的 .value 檢查
console.log('Computed value:', myComputed.value);

// ✅ 使用 watch 追蹤變化
watch(() => data.value, (newVal, oldVal) => {
  console.log('Data changed:', { newVal, oldVal });
});
```

---

## 🆘 遇到問題時

### 步驟 1: 檢查現有資源

1. 查看 `CODING_STANDARDS.md` - 程式碼規範
2. 查看 `docs/` - 相關文檔
3. 查看專案中類似的程式碼

### 步驟 2: 分析問題

1. 錯誤訊息是什麼?
2. 在哪一層出現問題? (Controller/Service/Repository)
3. 是新功能還是修改現有功能?

### 步驟 3: 提供解決方案

1. 提供 3-5 個可能的修復方案
2. 說明每個方案的優缺點
3. 推薦最佳方案

### 步驟 4: 等待用戶確認

**永遠不要**自動修復或回滾，**必須**等待用戶選擇

---

## 📚 重要參考資料

### 內部文檔
- `README.md` - 專案說明
- `CODING_STANDARDS.md` - 詳細程式碼規範
- `docs/migration/node-red-to-nodejs.md` - 遷移指南

### 外部資源
- [TypeScript 官方文檔](https://www.typescriptlang.org/docs/)
- [Vue 3 官方文檔](https://vuejs.org/guide/)
- [Express.js 文檔](https://expressjs.com/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [PEP 8 (Python)](https://peps.python.org/pep-0008/)

---

## 🎓 給未來 Claude 實例的提醒

**當你接手這個專案時，請務必:**

1. ✅ 先閱讀本檔案 (CLAUDE.md)
2. ✅ 閱讀 README.md 了解專案概況
3. ✅ 閱讀 CODING_STANDARDS.md 了解詳細規範
4. ✅ 查看 `docs/migration/` 了解從 Node-RED 的遷移邏輯
5. ✅ **記住**: 永遠不要自動回滾或修改程式碼
6. ✅ **記住**: 遵守分層架構，不要跨層呼叫
7. ✅ **記住**: 所有的 Node-RED Function 都要轉成 TypeScript class/function

**這個專案的成功取決於:**
- 清晰的架構分層
- 一致的程式碼風格
- 完整的錯誤處理
- 充分的測試覆蓋

**祝開發順利! 🚀**

---

**記憶檔案版本**: 1.1.0
**最後更新**: 2025-11-13
**適用階段**: Phase 1 完成 → Phase 2 開發中
**維護者**: SolarSDGs Development Team

---

## 📊 Phase 1 完成統計

**程式碼量**:
- TypeScript Core: 710 lines (DataParser 240 + GpsParser 130 + Repositories 340)
- Architecture: 920 lines (Services + Database + Server)
- IoT Simulator: 500+ lines
- **總計**: ~2,130 lines

**功能完成度**:
- ✅ MQTT 數據接收與解析: 100%
- ✅ 資料庫操作 (UPSERT, queries): 100%
- ✅ Factor 修正系統: 100%
- ✅ GPS 數據處理: 100%
- ✅ Node-RED 功能對等: 100%

**測試結果**:
- ✅ 50+ 功率數據記錄
- ✅ 4 GPS 位置記錄
- ✅ 延遲 < 15ms
- ✅ 成功率 100%

