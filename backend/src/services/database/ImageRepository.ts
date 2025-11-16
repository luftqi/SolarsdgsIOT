/**
 * Image Repository - Phase 3.1
 * 圖像數據的資料庫操作
 */

import { Pool } from 'pg';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../../utils/logger';
import type { DeviceImage } from '../../types/image.types';

export class ImageRepository {
  private pool: Pool;
  private readonly logger = new Logger(ImageRepository.name);

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.pool = dbService.getPool();
  }

  /**
   * 插入新圖像記錄
   */
  async insertImage(data: Omit<DeviceImage, 'id' | 'createdAt'>): Promise<DeviceImage> {
    const query = `
      INSERT INTO device_images (
        device_id,
        rgb_image_path,
        rgb_thumbnail_path,
        rgb_file_size,
        thermal_image_path,
        thermal_thumbnail_path,
        thermal_file_size,
        captured_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (device_id, captured_at) DO UPDATE SET
        rgb_image_path = EXCLUDED.rgb_image_path,
        rgb_thumbnail_path = EXCLUDED.rgb_thumbnail_path,
        rgb_file_size = EXCLUDED.rgb_file_size,
        thermal_image_path = EXCLUDED.thermal_image_path,
        thermal_thumbnail_path = EXCLUDED.thermal_thumbnail_path,
        thermal_file_size = EXCLUDED.thermal_file_size
      RETURNING
        id,
        device_id as "deviceId",
        rgb_image_path as "rgbImagePath",
        rgb_thumbnail_path as "rgbThumbnailPath",
        rgb_file_size as "rgbFileSize",
        thermal_image_path as "thermalImagePath",
        thermal_thumbnail_path as "thermalThumbnailPath",
        thermal_file_size as "thermalFileSize",
        captured_at as "capturedAt",
        created_at as "createdAt";
    `;

    const values = [
      data.deviceId,
      data.rgbImagePath,
      data.rgbThumbnailPath || null,
      data.rgbFileSize || null,
      data.thermalImagePath,
      data.thermalThumbnailPath || null,
      data.thermalFileSize || null,
      data.capturedAt,
    ];

    try {
      const result = await this.pool.query(query, values);
      this.logger.info(`Image inserted for device ${data.deviceId}`);
      return result.rows[0];
    } catch (error: any) {
      this.logger.error('Failed to insert image:', error);
      throw error;
    }
  }

  /**
   * 獲取最新圖像
   */
  async getLatestImage(deviceId: string): Promise<DeviceImage | null> {
    const query = `
      SELECT
        id,
        device_id as "deviceId",
        rgb_image_path as "rgbImagePath",
        rgb_thumbnail_path as "rgbThumbnailPath",
        rgb_file_size as "rgbFileSize",
        thermal_image_path as "thermalImagePath",
        thermal_thumbnail_path as "thermalThumbnailPath",
        thermal_file_size as "thermalFileSize",
        captured_at as "capturedAt",
        created_at as "createdAt"
      FROM device_images
      WHERE device_id = $1
      ORDER BY captured_at DESC
      LIMIT 1;
    `;

    try {
      const result = await this.pool.query(query, [deviceId]);
      return result.rows[0] || null;
    } catch (error: any) {
      this.logger.error(`Failed to get latest image for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 獲取圖像列表 (分頁)
   */
  async getImages(
    deviceId: string,
    limit: number = 50,
    offset: number = 0,
    from?: Date,
    to?: Date
  ): Promise<{ count: number; images: DeviceImage[] }> {
    let query = `
      SELECT
        id,
        device_id as "deviceId",
        rgb_image_path as "rgbImagePath",
        rgb_thumbnail_path as "rgbThumbnailPath",
        rgb_file_size as "rgbFileSize",
        thermal_image_path as "thermalImagePath",
        thermal_thumbnail_path as "thermalThumbnailPath",
        thermal_file_size as "thermalFileSize",
        captured_at as "capturedAt",
        created_at as "createdAt"
      FROM device_images
      WHERE device_id = $1
    `;

    const values: any[] = [deviceId];
    let paramIndex = 2;

    if (from) {
      query += ` AND captured_at >= $${paramIndex}`;
      values.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND captured_at <= $${paramIndex}`;
      values.push(to);
      paramIndex++;
    }

    query += ` ORDER BY captured_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
    values.push(limit, offset);

    // Count query
    let countQuery = `
      SELECT COUNT(*) as count
      FROM device_images
      WHERE device_id = $1
    `;

    const countValues: any[] = [deviceId];
    let countParamIndex = 2;

    if (from) {
      countQuery += ` AND captured_at >= $${countParamIndex}`;
      countValues.push(from);
      countParamIndex++;
    }

    if (to) {
      countQuery += ` AND captured_at <= $${countParamIndex}`;
      countValues.push(to);
    }

    try {
      const [imagesResult, countResult] = await Promise.all([
        this.pool.query(query, values),
        this.pool.query(countQuery, countValues),
      ]);

      return {
        count: parseInt(countResult.rows[0].count),
        images: imagesResult.rows,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get images for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除舊圖像 (保留政策: 30天)
   */
  async deleteOldImages(retentionDays: number = 30): Promise<number> {
    const query = `
      DELETE FROM device_images
      WHERE captured_at < NOW() - INTERVAL '${retentionDays} days'
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query);
      const deletedCount = result.rowCount || 0;
      this.logger.info(`Deleted ${deletedCount} old images (older than ${retentionDays} days)`);
      return deletedCount;
    } catch (error: any) {
      this.logger.error('Failed to delete old images:', error);
      throw error;
    }
  }
}
