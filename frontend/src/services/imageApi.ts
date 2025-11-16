/**
 * Image API Service - Frontend
 * 圖像 API 呼叫服務
 */

import axios from 'axios';
import type {
  DeviceImage,
  ImageListResponse,
  LatestImageResponse,
  ImageQueryParams,
} from '@/types/image';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 圖像 API 服務
 */
export const imageApi = {
  /**
   * 獲取最新圖像
   */
  async getLatestImage(deviceId: string): Promise<DeviceImage | null> {
    try {
      const response = await axios.get<LatestImageResponse>(
        `${API_BASE_URL}/api/images/${deviceId}/latest`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get latest image:', error);
      throw error;
    }
  },

  /**
   * 獲取圖像列表
   */
  async getImageList(params: ImageQueryParams): Promise<{
    count: number;
    images: DeviceImage[];
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response = await axios.get<ImageListResponse>(
        `${API_BASE_URL}/api/images/${params.deviceId}/list?${queryParams.toString()}`
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to get image list:', error);
      throw error;
    }
  },

  /**
   * 獲取圖像完整 URL
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    // 移除開頭的 / 如果存在
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}/${cleanPath}`;
  },

  /**
   * 獲取縮圖 URL
   */
  getThumbnailUrl(thumbnailPath?: string): string {
    if (!thumbnailPath) return '';
    const cleanPath = thumbnailPath.startsWith('/') ? thumbnailPath.slice(1) : thumbnailPath;
    return `${API_BASE_URL}/${cleanPath}`;
  },
};
