/**
 * Image Controller - Phase 3.1
 * 圖像上傳與查詢的 HTTP 控制器
 */

import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../services/image/ImageService';
import { Logger } from '../utils/logger';
import type {
  ImageUploadResponse,
  LatestImageResponse,
  ImageListResponse,
} from '../types/image.types';

export class ImageController {
  private readonly logger = new Logger(ImageController.name);
  private readonly imageService: ImageService;

  constructor() {
    this.imageService = new ImageService();
  }

  /**
   * 上傳圖像 (RGB + 熱影像)
   * POST /api/images/upload
   */
  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 驗證請求
      if (!req.files || typeof req.files !== 'object') {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
        return;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.rgbImage || !files.thermalImage) {
        res.status(400).json({
          success: false,
          message: 'Both rgbImage and thermalImage are required',
        });
        return;
      }

      const { deviceId, capturedAt } = req.body;

      if (!deviceId || !capturedAt) {
        res.status(400).json({
          success: false,
          message: 'deviceId and capturedAt are required',
        });
        return;
      }

      // 解析時間戳
      const capturedDate = new Date(capturedAt);
      if (isNaN(capturedDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid capturedAt timestamp',
        });
        return;
      }

      // 上傳圖像
      const result = await this.imageService.uploadImages(
        deviceId,
        files.rgbImage[0].buffer,
        files.thermalImage[0].buffer,
        capturedDate
      );

      const response: ImageUploadResponse = {
        success: true,
        message: 'Images uploaded successfully',
        data: result,
      };

      res.status(201).json(response);
      this.logger.info(`Images uploaded for device ${deviceId}`);

    } catch (error: any) {
      this.logger.error('Failed to upload images:', error);
      next(error);
    }
  }

  /**
   * 獲取最新圖像
   * GET /api/images/:deviceId/latest
   */
  async getLatestImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        res.status(400).json({
          success: false,
          message: 'deviceId is required',
        });
        return;
      }

      const result = await this.imageService.getLatestImage(deviceId);

      const response: LatestImageResponse = {
        success: true,
        data: result,
      };

      res.json(response);

    } catch (error: any) {
      this.logger.error(`Failed to get latest image for device ${req.params.deviceId}:`, error);
      next(error);
    }
  }

  /**
   * 獲取圖像列表
   * GET /api/images/:deviceId/list
   */
  async getImageList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { from, to, limit = '50', offset = '0' } = req.query;

      if (!deviceId) {
        res.status(400).json({
          success: false,
          message: 'deviceId is required',
        });
        return;
      }

      // 解析分頁參數
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'limit must be between 1 and 100',
        });
        return;
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        res.status(400).json({
          success: false,
          message: 'offset must be non-negative',
        });
        return;
      }

      // 解析日期範圍
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (from) {
        fromDate = new Date(from as string);
        if (isNaN(fromDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid from timestamp',
          });
          return;
        }
      }

      if (to) {
        toDate = new Date(to as string);
        if (isNaN(toDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid to timestamp',
          });
          return;
        }
      }

      // 查詢圖像
      const result = await this.imageService.getImages(
        deviceId,
        limitNum,
        offsetNum,
        fromDate,
        toDate
      );

      const response: ImageListResponse = {
        success: true,
        data: result,
      };

      res.json(response);

    } catch (error: any) {
      this.logger.error(`Failed to get image list for device ${req.params.deviceId}:`, error);
      next(error);
    }
  }
}
