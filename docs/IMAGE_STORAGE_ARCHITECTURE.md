# SolarSDGs IoT - 圖像儲存架構設計

> 📸 Pi Zero 2W 定期拍照上傳與顯示系統設計
> RGB 照片 + 熱影像圖 每 10 分鐘一組

---

## 🎯 功能需求

### 拍照裝置
- **硬體**: Raspberry Pi Zero 2W
- **拍攝頻率**: 每 10 分鐘
- **圖片類型**:
  - RGB 照片 (Camera Module)
  - 熱影像圖 (Thermal Camera)

### 功能要求
1. ✅ Pi Zero 2W 自動拍照並上傳
2. ✅ 伺服器接收並儲存圖片
3. ✅ 資料庫記錄圖片資訊
4. ✅ Web App 顯示最新照片
5. ✅ 瀏覽歷史照片
6. ✅ 下載 CSV 資料（包含圖片連結）

---

## 🏗️ 架構設計

### 方案 A: 檔案系統 + 資料庫路徑 (推薦)

```
┌─────────────────┐
│  Pi Zero 2W     │
│  ├─ RGB Camera  │
│  └─ Thermal Cam │
└────────┬────────┘
         │ HTTP POST (multipart/form-data)
         │ /api/images/upload
         ▼
┌─────────────────────────────┐
│  Backend API (Node.js)      │
│  ├─ multer (接收上傳)        │
│  ├─ sharp (圖片處理)         │
│  └─ 儲存到 /uploads/images/  │
└────────┬────────────────────┘
         │ INSERT INTO images
         ▼
┌─────────────────────────────┐
│  PostgreSQL Database        │
│  ┌─────────────────────────┐│
│  │ images 表                ││
│  │ - id                     ││
│  │ - device_id              ││
│  │ - rgb_image_path         ││
│  │ - thermal_image_path     ││
│  │ - timestamp              ││
│  │ - file_size              ││
│  │ - metadata (JSON)        ││
│  └─────────────────────────┘│
└────────┬────────────────────┘
         │ SELECT images
         ▼
┌─────────────────────────────┐
│  Frontend (Vue 3)           │
│  ├─ 顯示最新圖片              │
│  ├─ 圖片查看器 (v-viewer)     │
│  └─ 時間軸瀏覽                │
└─────────────────────────────┘
```

### 方案 B: 雲端儲存 (S3/MinIO) - 未來擴展

適用於大量圖片或多地點部署場景。

---

## 📦 需要安裝的套件

### 後端套件 (必須)

```bash
cd backend

# 檔案上傳
npm install multer@^1.4.5-lts.1

# 圖片處理 (壓縮、轉檔、縮圖)
npm install sharp@^0.33.5

# UUID 生成 (檔案名稱)
npm install uuid@^9.0.1

# TypeScript 類型
npm install -D @types/multer@^1.4.12 @types/uuid@^9.0.8
```

### 前端套件 (必須)

```bash
cd frontend

# 圖片查看器 (支援縮放、旋轉、幻燈片)
npm install viewerjs@^1.11.6
npm install v-viewer@^3.0.11

# 圖片懶加載 (效能優化)
npm install vue3-lazy@^1.0.0-alpha.1
```

### VPS 系統套件 (已安裝中)

```bash
# 圖片處理庫 (Sharp 依賴)
✅ libvips-dev libvips-tools
```

---

## 🗄️ 資料庫架構

### 1. 新增 `images` 表

```sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,

    -- 圖片路徑
    rgb_image_path VARCHAR(255) NOT NULL,
    thermal_image_path VARCHAR(255) NOT NULL,

    -- 縮圖路徑 (可選，用於列表顯示)
    rgb_thumbnail_path VARCHAR(255),
    thermal_thumbnail_path VARCHAR(255),

    -- 檔案資訊
    rgb_file_size INTEGER,              -- bytes
    thermal_file_size INTEGER,          -- bytes
    rgb_original_name VARCHAR(255),
    thermal_original_name VARCHAR(255),

    -- 時間戳記
    captured_at TIMESTAMP NOT NULL,     -- 拍攝時間
    uploaded_at TIMESTAMP DEFAULT NOW(), -- 上傳時間

    -- 額外資訊 (JSON)
    metadata JSONB,                      -- 溫度、濕度、光線等

    -- 索引
    CONSTRAINT fk_device FOREIGN KEY (device_id)
        REFERENCES devices(device_id) ON DELETE CASCADE
);

-- 建立索引
CREATE INDEX idx_images_device_id ON images(device_id);
CREATE INDEX idx_images_captured_at ON images(captured_at DESC);
CREATE INDEX idx_images_device_time ON images(device_id, captured_at DESC);
```

### 2. 更新 `devices` 表 (如果需要)

```sql
-- 添加最新圖片 ID
ALTER TABLE devices ADD COLUMN latest_rgb_image_id INTEGER;
ALTER TABLE devices ADD COLUMN latest_thermal_image_id INTEGER;
```

---

## 🔧 後端實作

### 1. 檔案上傳配置

`backend/src/config/upload.config.ts`:
```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 儲存配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const deviceId = req.body.device_id || 'unknown';
    const timestamp = Date.now();
    const type = file.fieldname; // 'rgb' or 'thermal'
    const ext = path.extname(file.originalname);

    // 格式: 6001_rgb_1699876543210_uuid.jpg
    const filename = `${deviceId}_${type}_${timestamp}_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 檔案過濾
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('只允許上傳 JPG/PNG 格式圖片'));
  }
};

// Multer 配置
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

### 2. 圖片處理服務

`backend/src/services/image/ImageProcessingService.ts`:
```typescript
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class ImageProcessingService {

  /**
   * 生成縮圖
   */
  async generateThumbnail(
    imagePath: string,
    width: number = 300,
    height: number = 300
  ): Promise<string> {
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const thumbnailPath = path.join(dir, `${basename}_thumb${ext}`);

    await sharp(imagePath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  /**
   * 壓縮圖片
   */
  async compressImage(
    imagePath: string,
    quality: number = 85
  ): Promise<void> {
    const tempPath = `${imagePath}.tmp`;

    await sharp(imagePath)
      .jpeg({ quality })
      .toFile(tempPath);

    await fs.rename(tempPath, imagePath);
  }

  /**
   * 取得圖片資訊
   */
  async getImageInfo(imagePath: string) {
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: stats.size,
      space: metadata.space
    };
  }
}
```

### 3. 圖片儲存庫

`backend/src/services/database/ImageRepository.ts`:
```typescript
import { Pool } from 'pg';

export interface ImageRecord {
  id?: number;
  device_id: string;
  rgb_image_path: string;
  thermal_image_path: string;
  rgb_thumbnail_path?: string;
  thermal_thumbnail_path?: string;
  rgb_file_size?: number;
  thermal_file_size?: number;
  rgb_original_name?: string;
  thermal_original_name?: string;
  captured_at: Date;
  uploaded_at?: Date;
  metadata?: any;
}

export class ImageRepository {
  constructor(private pool: Pool) {}

  /**
   * 儲存圖片記錄
   */
  async insert(image: ImageRecord): Promise<ImageRecord> {
    const query = `
      INSERT INTO images (
        device_id, rgb_image_path, thermal_image_path,
        rgb_thumbnail_path, thermal_thumbnail_path,
        rgb_file_size, thermal_file_size,
        rgb_original_name, thermal_original_name,
        captured_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      image.device_id,
      image.rgb_image_path,
      image.thermal_image_path,
      image.rgb_thumbnail_path,
      image.thermal_thumbnail_path,
      image.rgb_file_size,
      image.thermal_file_size,
      image.rgb_original_name,
      image.thermal_original_name,
      image.captured_at,
      JSON.stringify(image.metadata || {})
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * 取得設備的最新圖片
   */
  async getLatestByDevice(deviceId: string): Promise<ImageRecord | null> {
    const query = `
      SELECT * FROM images
      WHERE device_id = $1
      ORDER BY captured_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  /**
   * 取得設備的圖片歷史
   */
  async getByDeviceAndTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 100
  ): Promise<ImageRecord[]> {
    const query = `
      SELECT * FROM images
      WHERE device_id = $1
        AND captured_at BETWEEN $2 AND $3
      ORDER BY captured_at DESC
      LIMIT $4
    `;

    const result = await this.pool.query(query, [
      deviceId,
      startTime,
      endTime,
      limit
    ]);

    return result.rows;
  }
}
```

### 4. 圖片上傳 API

`backend/src/routes/image.routes.ts`:
```typescript
import { Router } from 'express';
import { upload } from '../config/upload.config';
import { ImageService } from '../services/image/ImageService';

const router = Router();
const imageService = new ImageService();

/**
 * POST /api/images/upload
 * Pi Zero 2W 上傳圖片
 */
router.post(
  '/upload',
  upload.fields([
    { name: 'rgb', maxCount: 1 },
    { name: 'thermal', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { device_id, captured_at, metadata } = req.body;

      if (!files.rgb || !files.thermal) {
        return res.status(400).json({
          error: '需要同時上傳 RGB 和熱影像圖'
        });
      }

      const result = await imageService.saveImages({
        deviceId: device_id,
        rgbFile: files.rgb[0],
        thermalFile: files.thermal[0],
        capturedAt: new Date(captured_at),
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('圖片上傳失敗:', error);
      res.status(500).json({
        error: '圖片上傳失敗',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/images/latest/:deviceId
 * 取得設備最新圖片
 */
router.get('/latest/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const image = await imageService.getLatestImage(deviceId);

    if (!image) {
      return res.status(404).json({ error: '找不到圖片' });
    }

    res.json({ data: image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/images/history/:deviceId
 * 取得設備圖片歷史
 */
router.get('/history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, limit } = req.query;

    const images = await imageService.getImageHistory(
      deviceId,
      new Date(start as string),
      new Date(end as string),
      parseInt(limit as string) || 100
    );

    res.json({ data: images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🎨 前端實作

### 1. 圖片顯示組件

`frontend/src/components/device/ImageViewer.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useViewer } from '@/composables/useViewer';

interface Props {
  deviceId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshInterval: 60000 // 1 minute
});

interface ImageData {
  id: number;
  rgb_image_path: string;
  thermal_image_path: string;
  captured_at: string;
  metadata?: any;
}

const latestImage = ref<ImageData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 圖片 URL
const rgbImageUrl = computed(() =>
  latestImage.value
    ? `/uploads/images/${latestImage.value.rgb_image_path}`
    : null
);

const thermalImageUrl = computed(() =>
  latestImage.value
    ? `/uploads/images/${latestImage.value.thermal_image_path}`
    : null
);

// 使用圖片查看器
const { viewImages } = useViewer();

async function fetchLatestImage() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/images/latest/${props.deviceId}`);
    const data = await response.json();

    if (data.data) {
      latestImage.value = data.data;
    }
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function viewFullscreen(type: 'rgb' | 'thermal') {
  if (!latestImage.value) return;

  const images = type === 'rgb'
    ? [rgbImageUrl.value]
    : [thermalImageUrl.value];

  viewImages(images, 0);
}

onMounted(() => {
  fetchLatestImage();

  if (props.autoRefresh) {
    setInterval(fetchLatestImage, props.refreshInterval);
  }
});
</script>

<template>
  <div class="image-viewer">
    <div v-if="loading" class="loading">載入中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="latestImage" class="images-container">
      <!-- RGB 照片 -->
      <div class="image-card">
        <h3>RGB 照片</h3>
        <img
          :src="rgbImageUrl"
          alt="RGB 照片"
          @click="viewFullscreen('rgb')"
          class="clickable"
        />
        <div class="image-info">
          拍攝時間: {{ new Date(latestImage.captured_at).toLocaleString('zh-TW') }}
        </div>
      </div>

      <!-- 熱影像圖 -->
      <div class="image-card">
        <h3>熱影像圖</h3>
        <img
          :src="thermalImageUrl"
          alt="熱影像圖"
          @click="viewFullscreen('thermal')"
          class="clickable"
        />
        <div class="image-info">
          <span v-if="latestImage.metadata?.temperature">
            溫度: {{ latestImage.metadata.temperature }}°C
          </span>
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      暫無圖片資料
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  padding: 20px;
}

.images-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.image-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.image-card h3 {
  margin-top: 0;
  color: #333;
}

.image-card img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-card img:hover {
  transform: scale(1.02);
}

.image-info {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.clickable {
  cursor: pointer;
}
</style>
```

### 2. 圖片歷史時間軸

`frontend/src/components/device/ImageTimeline.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  deviceId: string;
  startDate: Date;
  endDate: Date;
}

const props = defineProps<Props>();

const images = ref<any[]>([]);
const loading = ref(false);

async function loadImages() {
  loading.value = true;

  try {
    const params = new URLSearchParams({
      start: props.startDate.toISOString(),
      end: props.endDate.toISOString(),
      limit: '50'
    });

    const response = await fetch(
      `/api/images/history/${props.deviceId}?${params}`
    );
    const data = await response.json();
    images.value = data.data || [];
  } catch (error) {
    console.error('載入圖片失敗:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadImages();
});
</script>

<template>
  <div class="image-timeline">
    <h3>圖片歷史記錄</h3>

    <div v-if="loading">載入中...</div>

    <div v-else class="timeline">
      <div
        v-for="image in images"
        :key="image.id"
        class="timeline-item"
      >
        <div class="timestamp">
          {{ new Date(image.captured_at).toLocaleString('zh-TW') }}
        </div>
        <div class="thumbnails">
          <img
            :src="`/uploads/images/${image.rgb_thumbnail_path || image.rgb_image_path}`"
            alt="RGB"
            class="thumbnail"
          />
          <img
            :src="`/uploads/images/${image.thermal_thumbnail_path || image.thermal_image_path}`"
            alt="Thermal"
            class="thumbnail"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-item {
  display: flex;
  gap: 15px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.timestamp {
  min-width: 180px;
  color: #666;
  font-size: 14px;
}

.thumbnails {
  display: flex;
  gap: 10px;
}

.thumbnail {
  width: 100px;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.thumbnail:hover {
  transform: scale(1.1);
}
</style>
```

---

## 📱 Pi Zero 2W 上傳腳本

`scripts/pi_upload_images.py`:
```python
#!/usr/bin/env python3
"""
Pi Zero 2W - 定期拍照並上傳到伺服器
每 10 分鐘執行一次
"""

import requests
import time
from datetime import datetime
from picamera import PiCamera
import json

# 配置
SERVER_URL = "http://72.61.117.219:3000/api/images/upload"
DEVICE_ID = "6001"
RGB_IMAGE_PATH = "/tmp/rgb_image.jpg"
THERMAL_IMAGE_PATH = "/tmp/thermal_image.jpg"

def capture_rgb_image():
    """拍攝 RGB 照片"""
    camera = PiCamera()
    camera.resolution = (1920, 1080)
    camera.start_preview()
    time.sleep(2)  # 相機預熱
    camera.capture(RGB_IMAGE_PATH)
    camera.close()

def capture_thermal_image():
    """
    拍攝熱影像圖
    需要根據實際使用的熱影像相機型號調整
    """
    # TODO: 實作熱影像相機拍攝
    # 這裡是示例代碼
    pass

def upload_images():
    """上傳圖片到伺服器"""
    try:
        # 準備檔案
        files = {
            'rgb': open(RGB_IMAGE_PATH, 'rb'),
            'thermal': open(THERMAL_IMAGE_PATH, 'rb')
        }

        # 準備資料
        data = {
            'device_id': DEVICE_ID,
            'captured_at': datetime.now().isoformat(),
            'metadata': json.dumps({
                'temperature': 25.5,  # 從感測器讀取
                'humidity': 65.2,
                'light_level': 500
            })
        }

        # 上傳
        response = requests.post(
            SERVER_URL,
            files=files,
            data=data,
            timeout=30
        )

        response.raise_for_status()
        print(f"✅ 上傳成功: {response.json()}")

    except Exception as e:
        print(f"❌ 上傳失敗: {str(e)}")
    finally:
        # 關閉檔案
        for f in files.values():
            f.close()

def main():
    print(f"📸 開始拍照... {datetime.now()}")

    # 拍攝圖片
    capture_rgb_image()
    capture_thermal_image()

    # 上傳
    upload_images()

    print("✅ 完成")

if __name__ == "__main__":
    main()
```

### Cron 設定 (Pi Zero 2W)

```bash
# 編輯 crontab
crontab -e

# 添加：每 10 分鐘執行一次
*/10 * * * * /usr/bin/python3 /home/pi/upload_images.py >> /var/log/image_upload.log 2>&1
```

---

## 📊 CSV 匯出 (包含圖片連結)

### 後端 API

`backend/src/services/export/CsvExportService.ts`:
```typescript
import { createObjectCsvWriter } from 'csv-writer';

export class CsvExportService {

  async exportPowerDataWithImages(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<string> {
    // 查詢功率資料 + 圖片
    const data = await this.fetchDataWithImages(deviceId, startTime, endTime);

    const csvWriter = createObjectCsvWriter({
      path: `/tmp/export_${deviceId}_${Date.now()}.csv`,
      header: [
        { id: 'timestamp', title: '時間' },
        { id: 'pg', title: 'PG (W)' },
        { id: 'pa', title: 'PA (W)' },
        { id: 'pp', title: 'PP (W)' },
        { id: 'rgb_image_url', title: 'RGB 照片連結' },
        { id: 'thermal_image_url', title: '熱影像連結' }
      ]
    });

    const records = data.map(row => ({
      timestamp: row.timestamp,
      pg: row.pg,
      pa: row.pa,
      pp: row.pp,
      rgb_image_url: row.rgb_image_path
        ? `http://72.61.117.219:3000/uploads/images/${row.rgb_image_path}`
        : '',
      thermal_image_url: row.thermal_image_path
        ? `http://72.61.117.219:3000/uploads/images/${row.thermal_image_path}`
        : ''
    }));

    await csvWriter.writeRecords(records);
    return csvWriter.path;
  }
}
```

---

## 📝 安裝檢查清單

### 1. 後端套件
```bash
cd backend
npm install multer sharp uuid csv-writer
npm install -D @types/multer @types/uuid
```

### 2. 前端套件
```bash
cd frontend
npm install viewerjs v-viewer
```

### 3. 資料庫遷移
```bash
# 執行 SQL 建立 images 表
psql -U solarsdgs -d solarsdgs_iot -f migrations/create_images_table.sql
```

### 4. VPS 目錄
```bash
ssh root@72.61.117.219
mkdir -p /root/docker-services/app/backend/uploads/images
chmod 755 /root/docker-services/app/backend/uploads/images
```

### 5. Pi Zero 2W 設定
```bash
# 在 Pi 上安裝依賴
pip3 install requests picamera

# 複製上傳腳本
# 設定 cron 任務
```

---

**文檔版本**: 2.0.0
**最後更新**: 2025-11-12
**維護者**: SolarSDGs Development Team
