// =================================================================
// Auth Middleware - Phase 2.1
// JWT 認證中間件
// =================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import type { JwtPayload } from '../types/customer.types';

const logger = new Logger('AuthMiddleware');

/**
 * 擴展 Express Request 以包含 user 資訊
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT 認證中間件
 * 驗證 Authorization header 中的 Bearer token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // 1. 取得 Token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. 驗證 Token
    const jwtSecret = process.env.JWT_SECRET || 'solarsdgs-secret-2025';

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      // 3. 將用戶資訊附加到 Request
      req.user = decoded;

      // 4. 繼續處理
      next();

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else {
        logger.error('Token verification error:', error);
        res.status(500).json({
          success: false,
          message: 'Token verification failed'
        });
      }
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * 可選的 JWT 認證中間件
 * 如果有 Token 則驗證，沒有則繼續（不強制要求登入）
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 沒有 Token，繼續處理（req.user 為 undefined）
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = process.env.JWT_SECRET || 'solarsdgs-secret-2025';

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = decoded;
      next();

    } catch (error) {
      // Token 無效，但不阻止請求（req.user 為 undefined）
      logger.warn('Invalid token in optional auth');
      next();
    }

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // 發生錯誤仍然繼續
  }
}

/**
 * 管理員權限中間件
 * 檢查用戶是否為管理員（customer_code === 'admin'）
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.user.customerCode !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }

  next();
}

/**
 * 設備權限中間件
 * 檢查用戶是否有權訪問指定設備
 */
export function deviceAccessMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  // 從路由參數或查詢參數中取得 deviceId
  const deviceId = req.params.deviceId || req.query.deviceId as string;

  if (!deviceId) {
    res.status(400).json({
      success: false,
      message: 'Device ID required'
    });
    return;
  }

  // 檢查用戶是否有該設備的訪問權限
  if (!req.user.devices.includes(deviceId)) {
    res.status(403).json({
      success: false,
      message: 'Access denied to this device'
    });
    return;
  }

  next();
}
