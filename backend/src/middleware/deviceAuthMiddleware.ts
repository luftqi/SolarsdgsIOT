// =================================================================
// Device Authorization Middleware - Phase 2.4
// 設備權限檢查中間件（簡化版多租戶）
// =================================================================

import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('DeviceAuthMiddleware');

/**
 * 擴展 Express Request，添加 user 屬性（來自 authMiddleware）
 */
interface AuthRequest extends Request {
  user?: {
    customerId: number;
    customerCode: string;
    customerName: string;
    devices: string[];  // 用戶可訪問的設備列表
  };
}

/**
 * 檢查用戶是否有權訪問指定設備
 *
 * 使用方式:
 * router.get('/:deviceId', authMiddleware, checkDeviceAccess, controller.get)
 *
 * 前置條件:
 * - 必須在 authMiddleware 之後使用
 * - req.user 必須存在（由 authMiddleware 設置）
 *
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export function checkDeviceAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthRequest;

  // 1. 檢查用戶是否已認證
  if (!authReq.user) {
    logger.warn('Device access denied: User not authenticated');
    res.status(401).json({
      success: false,
      message: '未登入，無法訪問設備'
    });
    return;
  }

  // 2. 從 URL 參數或 query 參數獲取 deviceId
  const deviceId = authReq.params.deviceId || authReq.query.deviceId as string;

  if (!deviceId) {
    logger.warn('Device access denied: No deviceId provided');
    res.status(400).json({
      success: false,
      message: '缺少設備 ID'
    });
    return;
  }

  // 3. 檢查用戶的設備列表
  const { devices, customerCode } = authReq.user;

  if (!devices || !Array.isArray(devices)) {
    logger.error(`User ${customerCode} has invalid devices list`);
    res.status(500).json({
      success: false,
      message: '用戶設備列表配置錯誤'
    });
    return;
  }

  // 4. 驗證設備權限
  if (!devices.includes(deviceId)) {
    logger.warn(
      `Device access denied: User ${customerCode} attempted to access device ${deviceId}. ` +
      `Allowed devices: ${devices.join(', ')}`
    );

    res.status(403).json({
      success: false,
      message: `無權訪問設備 ${deviceId}`,
      allowedDevices: devices
    });
    return;
  }

  // 5. 權限驗證通過
  logger.info(`Device access granted: ${customerCode} → ${deviceId}`);
  next();
}

/**
 * 檢查用戶是否有權訪問任意設備（用於設備列表 API）
 *
 * 使用方式:
 * router.get('/devices', authMiddleware, checkAnyDeviceAccess, controller.getAll)
 *
 * 此中間件只檢查用戶是否至少有一個設備權限
 */
export function checkAnyDeviceAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    logger.warn('Device access denied: User not authenticated');
    res.status(401).json({
      success: false,
      message: '未登入'
    });
    return;
  }

  const { devices, customerCode } = authReq.user;

  if (!devices || devices.length === 0) {
    logger.warn(`User ${customerCode} has no devices assigned`);
    res.status(403).json({
      success: false,
      message: '沒有可訪問的設備，請聯繫管理員'
    });
    return;
  }

  logger.info(`User ${customerCode} has access to ${devices.length} device(s)`);
  next();
}
