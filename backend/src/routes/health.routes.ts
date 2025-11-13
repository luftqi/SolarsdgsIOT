/**
 * Health Check Routes
 *
 * 系統健康檢查端點
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database/DatabaseService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/health
 *
 * 基本健康檢查
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /api/health/db
 *
 * 資料庫連接檢查
 */
router.get('/db', asyncHandler(async (_req: Request, res: Response) => {
  const dbService = DatabaseService.getInstance();

  try {
    const isConnected = await dbService.testConnection();

    if (isConnected) {
      res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * GET /api/health/detailed
 *
 * 詳細健康檢查 (包含所有服務狀態)
 */
router.get('/detailed', asyncHandler(async (_req: Request, res: Response) => {
  const dbService = DatabaseService.getInstance();

  // 檢查資料庫
  let dbStatus = 'unknown';
  try {
    const isConnected = await dbService.testConnection();
    dbStatus = isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    dbStatus = 'error';
  }

  // 記憶體使用情況
  const memoryUsage = process.memoryUsage();

  res.json({
    success: true,
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      // 未來可以添加其他服務狀態 (MQTT, WebSocket, etc.)
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      },
    },
  });
}));

export default router;
