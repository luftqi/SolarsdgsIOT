/**
 * Images Composable - Frontend
 * 圖像數據管理 Composable
 */

import { ref, computed } from 'vue';
import { imageApi } from '@/services/imageApi';
import type { DeviceImage, ImageQueryParams } from '@/types/image';

export function useImages() {
  // State
  const latestImage = ref<DeviceImage | null>(null);
  const images = ref<DeviceImage[]>([]);
  const totalCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasLatestImage = computed(() => latestImage.value !== null);
  const hasImages = computed(() => images.value.length > 0);

  /**
   * 獲取最新圖像的 URL
   */
  const latestRgbUrl = computed(() => {
    if (!latestImage.value) return '';
    return imageApi.getImageUrl(latestImage.value.rgbImagePath);
  });

  const latestThermalUrl = computed(() => {
    if (!latestImage.value) return '';
    return imageApi.getImageUrl(latestImage.value.thermalImagePath);
  });

  const latestRgbThumbnailUrl = computed(() => {
    if (!latestImage.value?.rgbThumbnailPath) return '';
    return imageApi.getThumbnailUrl(latestImage.value.rgbThumbnailPath);
  });

  const latestThermalThumbnailUrl = computed(() => {
    if (!latestImage.value?.thermalThumbnailPath) return '';
    return imageApi.getThumbnailUrl(latestImage.value.thermalThumbnailPath);
  });

  /**
   * 獲取最新圖像
   */
  async function fetchLatestImage(deviceId: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await imageApi.getLatestImage(deviceId);
      latestImage.value = result;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch latest image';
      console.error('Error fetching latest image:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 獲取圖像列表
   */
  async function fetchImages(params: ImageQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const result = await imageApi.getImageList(params);
      images.value = result.images;
      totalCount.value = result.count;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch images';
      console.error('Error fetching images:', err);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 獲取圖像 URL
   */
  function getImageUrl(imagePath: string): string {
    return imageApi.getImageUrl(imagePath);
  }

  /**
   * 獲取縮圖 URL
   */
  function getThumbnailUrl(thumbnailPath?: string): string {
    return imageApi.getThumbnailUrl(thumbnailPath);
  }

  /**
   * 清空數據
   */
  function clearImages(): void {
    latestImage.value = null;
    images.value = [];
    totalCount.value = 0;
    error.value = null;
  }

  return {
    // State
    latestImage,
    images,
    totalCount,
    loading,
    error,

    // Computed
    hasLatestImage,
    hasImages,
    latestRgbUrl,
    latestThermalUrl,
    latestRgbThumbnailUrl,
    latestThermalThumbnailUrl,

    // Methods
    fetchLatestImage,
    fetchImages,
    getImageUrl,
    getThumbnailUrl,
    clearImages,
  };
}
