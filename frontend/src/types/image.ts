/**
 * Image Types - Frontend
 * 前端圖像系統類型定義
 */

/**
 * 設備圖像數據
 */
export interface DeviceImage {
  id: number;
  deviceId: string;

  // RGB 圖像
  rgbImagePath: string;
  rgbThumbnailPath?: string;
  rgbFileSize?: number;

  // 熱影像
  thermalImagePath: string;
  thermalThumbnailPath?: string;
  thermalFileSize?: number;

  // 拍攝時間
  capturedAt: string; // ISO 8601 timestamp
  createdAt: string;
}

/**
 * 圖像列表響應
 */
export interface ImageListResponse {
  success: boolean;
  data: {
    count: number;
    images: DeviceImage[];
  };
}

/**
 * 最新圖像響應
 */
export interface LatestImageResponse {
  success: boolean;
  data: DeviceImage | null;
}

/**
 * 圖像上傳響應
 */
export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: DeviceImage;
}

/**
 * 圖像查詢參數
 */
export interface ImageQueryParams {
  deviceId: string;
  from?: string; // ISO 8601 timestamp
  to?: string;   // ISO 8601 timestamp
  limit?: number;
  offset?: number;
}
