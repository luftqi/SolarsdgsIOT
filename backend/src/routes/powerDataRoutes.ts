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
  const pool = dbService.getPool();
  const powerDataRepo = new PowerDataRepository(pool);
  const controller = new PowerDataController(powerDataRepo);

  // GET /api/power-data/:deviceId/latest/:limit - 最新 N 筆數據
  router.get('/:deviceId/latest/:limit', controller.getList);

  // GET /api/power-data/:deviceId/latest - 最新一筆數據
  router.get('/:deviceId/latest', controller.getLatest);

  // GET /api/power-data/:deviceId/chart - 圖表數據
  router.get('/:deviceId/chart', controller.getChartData);

  // GET /api/power-data/:deviceId/statistics - 統計數據
  router.get('/:deviceId/statistics', controller.getStatistics);

  return router;
}
