// =================================================================
// Device Controller - Phase 2 API 層
// 處理設備管理相關的 API 請求
// =================================================================

import { Request, Response } from 'express';
import { DeviceRepository } from '../services/database/DeviceRepository';
import { Logger } from '../utils/logger';
import type { ApiResponse, DeviceDTO } from '../types/api';

export class DeviceController {
  private readonly logger = new Logger('DeviceController');
  private readonly deviceRepo: DeviceRepository;

  constructor(deviceRepo: DeviceRepository) {
    this.deviceRepo = deviceRepo;
  }

  /**
   * GET /api/devices
   * 獲取所有設備列表
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Getting all devices');

      const devices = await this.deviceRepo.findAll();

      const deviceDTOs: DeviceDTO[] = devices.map(device => ({
        id: device.id,
        deviceId: device.device_id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        status: device.status as 'online' | 'offline' | 'error',
        lastSeen: device.last_seen ? device.last_seen.toISOString() : null,
        createdAt: device.created_at.toISOString(),
        updatedAt: device.updated_at.toISOString()
      }));

      res.json({
        success: true,
        data: deviceDTOs,
        timestamp: new Date().toISOString()
      } as ApiResponse<DeviceDTO[]>);

    } catch (error: any) {
      this.logger.error('Failed to get all devices:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  /**
   * GET /api/devices/:deviceId
   * 獲取單一設備詳情
   */
  getOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;

      this.logger.info(`Getting device: ${deviceId}`);

      const device = await this.deviceRepo.findByDeviceId(deviceId);

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      const deviceDTO: DeviceDTO = {
        id: device.id,
        deviceId: device.device_id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        status: device.status as 'online' | 'offline' | 'error',
        lastSeen: device.last_seen ? device.last_seen.toISOString() : null,
        createdAt: device.created_at.toISOString(),
        updatedAt: device.updated_at.toISOString()
      };

      res.json({
        success: true,
        data: deviceDTO,
        timestamp: new Date().toISOString()
      } as ApiResponse<DeviceDTO>);

    } catch (error: any) {
      this.logger.error('Failed to get device:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  /**
   * GET /api/devices/online
   * 獲取所有在線設備
   */
  getOnlineDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Getting online devices');

      const devices = await this.deviceRepo.findByStatus('online');

      const deviceDTOs: DeviceDTO[] = devices.map(device => ({
        id: device.id,
        deviceId: device.device_id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        status: device.status as 'online' | 'offline' | 'error',
        lastSeen: device.last_seen ? device.last_seen.toISOString() : null,
        createdAt: device.created_at.toISOString(),
        updatedAt: device.updated_at.toISOString()
      }));

      res.json({
        success: true,
        data: deviceDTOs,
        timestamp: new Date().toISOString()
      } as ApiResponse<DeviceDTO[]>);

    } catch (error: any) {
      this.logger.error('Failed to get online devices:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };
}
