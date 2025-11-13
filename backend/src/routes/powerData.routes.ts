/**
 * Power Data Routes
 *
 * 功率數據相關的路由
 */

import { Router } from 'express';
import { PowerDataController } from '../controllers/powerData.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new PowerDataController();

/**
 * GET /api/power-data/devices/latest
 *
 * 獲取所有設備的最新功率數據
 */
router.get(
  '/devices/latest',
  asyncHandler(controller.getAllDevicesLatest.bind(controller))
);

/**
 * GET /api/power-data/device/:deviceId/current
 *
 * 獲取設備的當前（最新）功率數據
 */
router.get(
  '/device/:deviceId/current',
  asyncHandler(controller.getCurrent.bind(controller))
);

/**
 * GET /api/power-data/device/:deviceId/latest
 *
 * 獲取設備的最新 N 條功率數據
 */
router.get(
  '/device/:deviceId/latest',
  asyncHandler(controller.getLatest.bind(controller))
);

/**
 * GET /api/power-data/device/:deviceId/range
 *
 * 獲取設備在指定時間範圍內的功率數據
 *
 * Query params:
 * - startTime: ISO 8601 格式 (e.g., 2025-11-13T00:00:00Z)
 * - endTime: ISO 8601 格式
 */
router.get(
  '/device/:deviceId/range',
  asyncHandler(controller.getByTimeRange.bind(controller))
);

/**
 * GET /api/power-data/device/:deviceId/hourly
 *
 * 獲取設備的每小時統計數據
 *
 * Query params:
 * - date: YYYY-MM-DD 格式
 */
router.get(
  '/device/:deviceId/hourly',
  asyncHandler(controller.getHourlyStats.bind(controller))
);

/**
 * GET /api/power-data/device/:deviceId/daily
 *
 * 獲取設備的每日統計數據
 *
 * Query params:
 * - startDate: YYYY-MM-DD 格式
 * - endDate: YYYY-MM-DD 格式
 */
router.get(
  '/device/:deviceId/daily',
  asyncHandler(controller.getDailySummary.bind(controller))
);

export default router;
