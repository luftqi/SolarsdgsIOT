// =================================================================
// Power Data Routes - Phase 2 API 層
// =================================================================

import { Router } from 'express';
import { PowerDataController } from '../controllers/PowerDataController';
import { PowerDataRepository } from '../services/database/PowerDataRepository';
import { DatabaseService } from '../services/database/DatabaseService';

export function createPowerDataRoutes(): Router {
  const router = Router();
  const dbService = DatabaseService.getInstance();
  const powerDataRepo = new PowerDataRepository(dbService);
  const controller = new PowerDataController(powerDataRepo);

  // GET /api/devices/:deviceId/power-data/latest - 最新一筆數據
  router.get('/:deviceId/power-data/latest', controller.getLatest);

  // GET /api/devices/:deviceId/power-data/chart - 圖表數據
  router.get('/:deviceId/power-data/chart', controller.getChartData);

  // GET /api/devices/:deviceId/power-data/statistics - 統計數據
  router.get('/:deviceId/power-data/statistics', controller.getStatistics);

  // GET /api/devices/:deviceId/power-data - 數據列表（分頁、時間範圍）
  router.get('/:deviceId/power-data', controller.getList);

  return router;
}
