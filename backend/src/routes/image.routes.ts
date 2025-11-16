/**
 * Image Routes - Phase 3.1
 * 圖像上傳與查詢的路由配置
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ImageController } from '../controllers/image.controller';
import { uploadImages, handleUploadError } from '../middleware/uploadMiddleware';

const router = Router();
const imageController = new ImageController();

/**
 * POST /api/images/upload
 * 上傳圖像 (RGB + 熱影像)
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body:
 *   - deviceId: string (設備 ID)
 *   - capturedAt: string (ISO 8601 timestamp)
 *   - rgbImage: File (RGB 圖像)
 *   - thermalImage: File (熱影像)
 *
 * Response:
 * - 201: Upload successful
 * - 400: Validation error
 * - 500: Server error
 */
router.post(
  '/upload',
  uploadImages,
  handleUploadError,
  (req: Request, res: Response, next: NextFunction) => imageController.uploadImages(req, res, next)
);

/**
 * GET /api/images/:deviceId/latest
 * 獲取最新圖像
 *
 * Parameters:
 * - deviceId: string (設備 ID)
 *
 * Response:
 * - 200: Success
 * - 400: Invalid deviceId
 * - 404: No images found
 * - 500: Server error
 */
router.get(
  '/:deviceId/latest',
  (req: Request, res: Response, next: NextFunction) => imageController.getLatestImage(req, res, next)
);

/**
 * GET /api/images/:deviceId/list
 * 獲取圖像列表（分頁）
 *
 * Parameters:
 * - deviceId: string (設備 ID)
 *
 * Query Parameters:
 * - from: string (ISO 8601 timestamp, optional)
 * - to: string (ISO 8601 timestamp, optional)
 * - limit: number (1-100, default: 50)
 * - offset: number (>= 0, default: 0)
 *
 * Response:
 * - 200: Success
 * - 400: Invalid parameters
 * - 500: Server error
 */
router.get(
  '/:deviceId/list',
  (req: Request, res: Response, next: NextFunction) => imageController.getImageList(req, res, next)
);

export default router;
