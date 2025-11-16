/**
 * Device Routes - Phase 2.4 (多租戶權限控制)
 *
 * 設備相關的路由
 */

import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkDeviceAccess, checkAnyDeviceAccess } from '../middleware/deviceAuthMiddleware';

const router = Router();
const controller = new DeviceController();

/**
 * GET /api/devices
 *
 * 獲取所有設備列表 (僅返回用戶有權訪問的設備)
 * ⚠️ 需要 JWT 認證 + 至少有一個設備權限
 */
router.get(
  '/',
  authMiddleware,
  checkAnyDeviceAccess,
  asyncHandler(controller.getAll.bind(controller))
);

/**
 * GET /api/devices/:deviceId
 *
 * 獲取單個設備詳情
 * ⚠️ 需要 JWT 認證 + 該設備權限
 */
router.get(
  '/:deviceId',
  authMiddleware,
  checkDeviceAccess,
  asyncHandler(controller.getById.bind(controller))
);

/**
 * GET /api/devices/:deviceId/config
 *
 * 獲取設備配置 (Factor 配置)
 * ⚠️ 需要 JWT 認證 + 該設備權限
 */
router.get(
  '/:deviceId/config',
  authMiddleware,
  checkDeviceAccess,
  asyncHandler(controller.getConfig.bind(controller))
);

/**
 * GET /api/devices/:deviceId/status
 *
 * 獲取設備完整狀態 (包含最新數據)
 * ⚠️ 需要 JWT 認證 + 該設備權限
 */
router.get(
  '/:deviceId/status',
  authMiddleware,
  checkDeviceAccess,
  asyncHandler(controller.getStatus.bind(controller))
);

/**
 * PUT /api/devices/:deviceId/config
 *
 * 更新設備 Factor 配置
 * ⚠️ 需要 JWT 認證 + 該設備權限
 */
router.put(
  '/:deviceId/config',
  authMiddleware,
  checkDeviceAccess,
  asyncHandler(controller.updateConfig.bind(controller))
);

export default router;
