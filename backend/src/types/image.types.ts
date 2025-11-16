/**
 * Image Types - Phase 3.1
 * 圖像系統相關的 TypeScript 類型定義
 */

/**
 * 設備圖像數據 (資料庫模型)
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
  capturedAt: Date;
  createdAt: Date;
}

/**
 * 圖像上傳請求 (multipart/form-data)
 */
export interface ImageUploadRequest {
  deviceId: string;
  capturedAt: string; // ISO 8601 timestamp
  rgbImage: Express.Multer.File;
  thermalImage: Express.Multer.File;
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
