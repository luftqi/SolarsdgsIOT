/**
 * Image Service - Phase 3.1
 * 圖像處理服務 (壓縮、縮圖、儲存)
 */

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../../utils/logger';
import { ImageRepository } from '../database/ImageRepository';
import type { DeviceImage } from '../../types/image.types';

export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly imageRepo: ImageRepository;
  private readonly uploadDir: string;

  constructor() {
    this.imageRepo = new ImageRepository();
    // Docker 容器內的路徑
    this.uploadDir = process.env.IMAGE_UPLOAD_DIR || '/app/uploads/images';
  }

  /**
   * 處理圖像上傳 (RGB + 熱影像)
   */
  async uploadImages(
    deviceId: string,
    rgbImageBuffer: Buffer,
    thermalImageBuffer: Buffer,
    capturedAt: Date
  ): Promise<DeviceImage> {
    try {
      // 生成唯一 ID
      const imageId = uuidv4();
      const timestamp = capturedAt.toISOString().replace(/[:.]/g, '-');

      // 1. 儲存 RGB 圖像
      const rgbPaths = await this.processImage(
        rgbImageBuffer,
        deviceId,
        imageId,
        'rgb',
        timestamp
      );

      // 2. 儲存熱影像
      const thermalPaths = await this.processImage(
        thermalImageBuffer,
        deviceId,
        imageId,
        'thermal',
        timestamp
      );

      // 3. 儲存元數據到資料庫
      const savedImage = await this.imageRepo.insertImage({
        deviceId,
        rgbImagePath: rgbPaths.imagePath,
        rgbThumbnailPath: rgbPaths.thumbnailPath,
        rgbFileSize: rgbPaths.fileSize,
        thermalImagePath: thermalPaths.imagePath,
        thermalThumbnailPath: thermalPaths.thumbnailPath,
        thermalFileSize: thermalPaths.fileSize,
        capturedAt,
      });

      this.logger.info(`Images uploaded for device ${deviceId} at ${capturedAt.toISOString()}`);
      return savedImage;

    } catch (error: any) {
      this.logger.error('Failed to upload images:', error);
      throw error;
    }
  }

  /**
   * 處理單張圖片 (壓縮、縮圖、儲存)
   */
  private async processImage(
    buffer: Buffer,
    deviceId: string,
    imageId: string,
    type: 'rgb' | 'thermal',
    timestamp: string
  ): Promise<{ imagePath: string; thumbnailPath: string; fileSize: number }> {
    // 建立目錄
    const imageDir = path.join(this.uploadDir, type);
    const thumbnailDir = path.join(this.uploadDir, 'thumbnails', type);

    await fs.mkdir(imageDir, { recursive: true });
    await fs.mkdir(thumbnailDir, { recursive: true });

    // 檔案名稱
    const filename = `${deviceId}_${timestamp}_${imageId}.jpg`;
    const thumbnailFilename = `${deviceId}_${timestamp}_${imageId}_thumb.jpg`;

    // 完整路徑
    const imagePath = path.join(imageDir, filename);
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // 1. 壓縮並儲存原圖
    await sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .toFile(imagePath);

    // 2. 生成縮圖 (320x240)
    await sharp(buffer)
      .resize(320, 240, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // 3. 獲取檔案大小
    const stats = await fs.stat(imagePath);
    const fileSize = stats.size;

    // 返回相對路徑 (用於 URL)
    return {
      imagePath: `/uploads/images/${type}/${filename}`,
      thumbnailPath: `/uploads/images/thumbnails/${type}/${thumbnailFilename}`,
      fileSize,
    };
  }

  /**
   * 獲取最新圖像
   */
  async getLatestImage(deviceId: string): Promise<DeviceImage | null> {
    return this.imageRepo.getLatestImage(deviceId);
  }

  /**
   * 獲取圖像列表
   */
  async getImages(
    deviceId: string,
    limit: number = 50,
    offset: number = 0,
    from?: Date,
    to?: Date
  ): Promise<{ count: number; images: DeviceImage[] }> {
    return this.imageRepo.getImages(deviceId, limit, offset, from, to);
  }

  /**
   * 刪除舊圖像 (保留 30 天)
   */
  async cleanupOldImages(retentionDays: number = 30): Promise<number> {
    try {
      // 1. 從資料庫獲取要刪除的圖像列表
      const deletedCount = await this.imageRepo.deleteOldImages(retentionDays);

      // TODO: 2. 刪除實際檔案 (可選)
      // 目前只刪除資料庫記錄,檔案保留

      this.logger.info(`Cleaned up ${deletedCount} old images (retention: ${retentionDays} days)`);
      return deletedCount;

    } catch (error: any) {
      this.logger.error('Failed to cleanup old images:', error);
      throw error;
    }
  }
}
