// =================================================================
// Device Routes - Phase 2 API 層
// =================================================================

import { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { DeviceRepository } from '../services/database/DeviceRepository';
import { DatabaseService } from '../services/database/DatabaseService';

export function createDeviceRoutes(): Router {
  const router = Router();
  const dbService = DatabaseService.getInstance();
  const deviceRepo = new DeviceRepository(dbService);
  const controller = new DeviceController(deviceRepo);

  // GET /api/devices - 所有設備
  router.get('/', controller.getAll);

  // GET /api/devices/online - 在線設備
  router.get('/online', controller.getOnlineDevices);

  // GET /api/devices/:deviceId - 單一設備詳情
  router.get('/:deviceId', controller.getOne);

  return router;
}
