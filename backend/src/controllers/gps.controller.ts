/**
 * GPS Controller
 *
 * 處理 GPS 位置相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { GpsLocationRepository } from '../services/database/GpsLocationRepository';
import { DatabaseService } from '../services/database/DatabaseService';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('GpsController');

export class GpsController {
  private gpsRepo: GpsLocationRepository;

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.gpsRepo = new GpsLocationRepository(dbService.getPool());
  }

  /**
   * GET /api/gps/device/:deviceId/latest
   *
   * 獲取設備的最新 GPS 位置
   */
  async getLatest(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    logger.info(`Getting latest GPS location for device ${deviceId}`);

    const location = await this.gpsRepo.getLatestLocation(deviceId);

    if (!location) {
      throw new NotFoundError(`GPS location for device ${deviceId}`);
    }

    res.json({
      success: true,
      data: location,
    });
  }

  /**
   * GET /api/gps/devices/latest
   *
   * 獲取所有設備的最新 GPS 位置
   */
  async getAllDevicesLatest(_req: Request, res: Response): Promise<void> {
    logger.info('Getting latest GPS locations for all devices');

    const locations = await this.gpsRepo.getAllLatestLocations();

    res.json({
      success: true,
      data: {
        count: locations.length,
        locations,
      },
    });
  }

  /**
   * GET /api/gps/device/:deviceId/track
   *
   * 獲取設備的 GPS 軌跡
   */
  async getTrack(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const { startTime, endTime, limit } = req.query;

    if (!startTime || !endTime) {
      throw new BadRequestError('startTime and endTime are required');
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);
    const maxLimit = limit ? parseInt(limit as string) : 100;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    logger.info(`Getting GPS track for device ${deviceId} from ${start.toISOString()} to ${end.toISOString()}`);

    const track = await this.gpsRepo.getGpsTrack(deviceId, start, end, maxLimit);

    res.json({
      success: true,
      data: {
        deviceId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        count: track.length,
        track,
      },
    });
  }
}
