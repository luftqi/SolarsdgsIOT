/**
 * Device Routes
 *
 * 設備相關的路由
 */

import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new DeviceController();

/**
 * GET /api/devices
 *
 * 獲取所有設備列表
 */
router.get(
  '/',
  asyncHandler(controller.getAll.bind(controller))
);

/**
 * GET /api/devices/:deviceId
 *
 * 獲取單個設備詳情
 */
router.get(
  '/:deviceId',
  asyncHandler(controller.getById.bind(controller))
);

/**
 * GET /api/devices/:deviceId/config
 *
 * 獲取設備配置 (Factor 配置)
 */
router.get(
  '/:deviceId/config',
  asyncHandler(controller.getConfig.bind(controller))
);

/**
 * GET /api/devices/:deviceId/status
 *
 * 獲取設備完整狀態 (包含最新數據)
 */
router.get(
  '/:deviceId/status',
  asyncHandler(controller.getStatus.bind(controller))
);

export default router;
