// =================================================================
// Power Data Routes - Phase 2.4 API 層 (多租戶權限控制)
// =================================================================

import { Router } from 'express';
import { PowerDataController } from '../controllers/PowerDataController';
import { PowerDataRepository } from '../services/database/PowerDataRepository';
import { DatabaseService } from '../services/database/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkDeviceAccess } from '../middleware/deviceAuthMiddleware';

export function createPowerDataRoutes(): Router {
  const router = Router();
  const dbService = DatabaseService.getInstance();
  const pool = dbService.getPool();
  const powerDataRepo = new PowerDataRepository(pool);
  const controller = new PowerDataController(powerDataRepo);

  // ⚠️ 所有路由都需要 JWT 認證 + 設備權限檢查

  // GET /api/power-data/:deviceId/latest/:limit - 最新 N 筆數據
  router.get('/:deviceId/latest/:limit', authMiddleware, checkDeviceAccess, controller.getList);

  // GET /api/power-data/:deviceId/latest - 最新一筆數據
  router.get('/:deviceId/latest', authMiddleware, checkDeviceAccess, controller.getLatest);

  // GET /api/power-data/:deviceId/chart - 圖表數據
  router.get('/:deviceId/chart', authMiddleware, checkDeviceAccess, controller.getChartData);

  // GET /api/power-data/:deviceId/statistics - 統計數據
  router.get('/:deviceId/statistics', authMiddleware, checkDeviceAccess, controller.getStatistics);

  return router;
}
