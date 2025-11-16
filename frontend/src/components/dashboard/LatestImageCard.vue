<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useImages } from '@/composables/useImages';

interface Props {
  deviceId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // 秒
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshInterval: 60, // 預設 60 秒刷新一次
});

const {
  latestImage,
  loading,
  error,
  hasLatestImage,
  latestRgbThumbnailUrl,
  latestThermalThumbnailUrl,
  fetchLatestImage,
} = useImages();

// 格式化時間
const formattedCapturedAt = computed(() => {
  if (!latestImage.value) return '-';
  const date = new Date(latestImage.value.capturedAt);
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// 檔案大小格式化
function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 載入圖像
async function loadImage(): Promise<void> {
  if (!props.deviceId) return;
  console.log('[LatestImageCard] 載入圖像 - Device ID:', props.deviceId);
  await fetchLatestImage(props.deviceId);
  console.log('[LatestImageCard] 圖像載入結果:', {
    hasImage: hasLatestImage.value,
    rgbUrl: latestRgbThumbnailUrl.value,
    thermalUrl: latestThermalThumbnailUrl.value,
    error: error.value
  });
}

// 開啟完整圖像
function openFullImage(type: 'rgb' | 'thermal'): void {
  if (!latestImage.value) return;
  const url = type === 'rgb'
    ? latestRgbThumbnailUrl.value.replace('_thumb.jpg', '.jpg').replace('/thumbnails', '')
    : latestThermalThumbnailUrl.value.replace('_thumb.jpg', '.jpg').replace('/thumbnails', '');
  window.open(url, '_blank');
}

// 初始載入
onMounted(() => {
  loadImage();

  // 自動刷新
  if (props.autoRefresh && props.refreshInterval > 0) {
    setInterval(loadImage, props.refreshInterval * 1000);
  }
});

// 監聽 deviceId 變化
watch(() => props.deviceId, () => {
  loadImage();
});
</script>

<template>
  <div class="latest-image-card">
    <div class="card-header">
      <h3>📷 最新圖像</h3>
      <button @click="loadImage" :disabled="loading" class="refresh-btn">
        {{ loading ? '載入中...' : '刷新' }}
      </button>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <!-- 載入中 -->
    <div v-else-if="loading && !hasLatestImage" class="loading">
      <div class="spinner"></div>
      <p>載入圖像中...</p>
    </div>

    <!-- 無圖像 -->
    <div v-else-if="!hasLatestImage" class="no-image">
      <p>📭 尚無圖像數據</p>
      <p class="hint">設備每 10 分鐘自動上傳一次圖像</p>
    </div>

    <!-- 圖像顯示 -->
    <div v-else class="image-container">
      <!-- 拍攝時間 -->
      <div class="captured-time">
        <span class="label">拍攝時間:</span>
        <span class="value">{{ formattedCapturedAt }}</span>
      </div>

      <!-- 圖像網格 -->
      <div class="image-grid">
        <!-- RGB 圖像 -->
        <div class="image-item">
          <div class="image-label">🖼️ RGB 圖像</div>
          <div class="image-wrapper" @click="openFullImage('rgb')">
            <img
              v-if="latestRgbThumbnailUrl"
              :src="latestRgbThumbnailUrl"
              alt="RGB 圖像"
              class="thumbnail"
            />
            <div v-else class="image-placeholder">無縮圖</div>
            <div class="image-overlay">
              <span>🔍 點擊放大</span>
            </div>
          </div>
          <div class="image-info">
            <span>檔案大小: {{ formatFileSize(latestImage?.rgbFileSize) }}</span>
          </div>
        </div>

        <!-- 熱影像 -->
        <div class="image-item">
          <div class="image-label">🌡️ 熱影像</div>
          <div class="image-wrapper" @click="openFullImage('thermal')">
            <img
              v-if="latestThermalThumbnailUrl"
              :src="latestThermalThumbnailUrl"
              alt="熱影像"
              class="thumbnail"
            />
            <div v-else class="image-placeholder">無縮圖</div>
            <div class="image-overlay">
              <span>🔍 點擊放大</span>
            </div>
          </div>
          <div class="image-info">
            <span>檔案大小: {{ formatFileSize(latestImage?.thermalFileSize) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.latest-image-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.refresh-btn {
  padding: 6px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #45a049;
}

.refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-image {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-image p {
  margin: 8px 0;
}

.no-image .hint {
  font-size: 14px;
  color: #bbb;
}

.image-container {
  margin-top: 16px;
}

.captured-time {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

.captured-time .label {
  font-weight: 600;
  color: #666;
}

.captured-time .value {
  color: #333;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-label {
  font-weight: 600;
  font-size: 14px;
  color: #555;
  text-align: center;
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f0f0f0;
  transition: transform 0.3s;
}

.image-wrapper:hover {
  transform: scale(1.02);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  background: #f5f5f5;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 14px;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-info {
  text-align: center;
  font-size: 12px;
  color: #888;
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: 1fr;
  }
}
</style>
