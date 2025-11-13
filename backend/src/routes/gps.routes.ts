/**
 * GPS Routes
 *
 * GPS 位置相關的路由
 */

import { Router } from 'express';
import { GpsController } from '../controllers/gps.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new GpsController();

/**
 * GET /api/gps/devices/latest
 *
 * 獲取所有設備的最新 GPS 位置
 */
router.get(
  '/devices/latest',
  asyncHandler(controller.getAllDevicesLatest.bind(controller))
);

/**
 * GET /api/gps/device/:deviceId/latest
 *
 * 獲取設備的最新 GPS 位置
 */
router.get(
  '/device/:deviceId/latest',
  asyncHandler(controller.getLatest.bind(controller))
);

/**
 * GET /api/gps/device/:deviceId/track
 *
 * 獲取設備的 GPS 軌跡
 *
 * Query params:
 * - startTime: ISO 8601 格式
 * - endTime: ISO 8601 格式
 * - limit: 最多返回數量 (默認 100)
 */
router.get(
  '/device/:deviceId/track',
  asyncHandler(controller.getTrack.bind(controller))
);

export default router;
