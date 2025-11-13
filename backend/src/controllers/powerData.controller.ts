/**
 * Power Data Controller
 *
 * 處理功率數據相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { PowerDataRepository } from '../services/database/PowerDataRepository';
import { DatabaseService } from '../services/database/DatabaseService';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('PowerDataController');

export class PowerDataController {
  private powerDataRepo: PowerDataRepository;

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.powerDataRepo = new PowerDataRepository(dbService.getPool());
  }

  /**
   * GET /api/power-data/device/:deviceId/latest
   *
   * 獲取設備的最新功率數據
   */
  async getLatest(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info(`Getting latest ${limit} power data for device ${deviceId}`);

    const data = await this.powerDataRepo.getLatestData(deviceId, limit);

    if (!data || data.length === 0) {
      throw new NotFoundError(`Power data for device ${deviceId}`);
    }

    res.json({
      success: true,
      data: {
        deviceId,
        count: data.length,
        records: data,
      },
    });
  }

  /**
   * GET /api/power-data/device/:deviceId/range
   *
   * 獲取設備在指定時間範圍內的功率數據
   */
  async getByTimeRange(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      throw new BadRequestError('startTime and endTime are required');
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    logger.info(`Getting power data for device ${deviceId} from ${start.toISOString()} to ${end.toISOString()}`);

    const data = await this.powerDataRepo.getDataByTimeRange(deviceId, start, end);

    res.json({
      success: true,
      data: {
        deviceId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        count: data.length,
        records: data,
      },
    });
  }

  /**
   * GET /api/power-data/device/:deviceId/hourly
   *
   * 獲取設備的每小時統計數據
   */
  async getHourlyStats(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new BadRequestError('date is required (format: YYYY-MM-DD)');
    }

    const targetDate = new Date(date as string);

    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    logger.info(`Getting hourly stats for device ${deviceId} on ${targetDate.toISOString()}`);

    const stats = await this.powerDataRepo.getHourlyStats(deviceId, targetDate);

    res.json({
      success: true,
      data: {
        deviceId,
        date: targetDate.toISOString().split('T')[0],
        count: stats.length,
        stats,
      },
    });
  }

  /**
   * GET /api/power-data/device/:deviceId/daily
   *
   * 獲取設備的每日統計數據
   */
  async getDailySummary(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required (format: YYYY-MM-DD)');
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    logger.info(`Getting daily summary for device ${deviceId} from ${start.toISOString()} to ${end.toISOString()}`);

    const summary = await this.powerDataRepo.getDailySummary(deviceId, start, end);

    res.json({
      success: true,
      data: {
        deviceId,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        count: summary.length,
        summary,
      },
    });
  }

  /**
   * GET /api/power-data/device/:deviceId/current
   *
   * 獲取設備的當前（最新）功率數據
   */
  async getCurrent(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    logger.info(`Getting current power data for device ${deviceId}`);

    const data = await this.powerDataRepo.getLatestData(deviceId, 1);

    if (!data || data.length === 0) {
      throw new NotFoundError(`Current power data for device ${deviceId}`);
    }

    res.json({
      success: true,
      data: data[0],
    });
  }

  /**
   * GET /api/power-data/devices/latest
   *
   * 獲取所有設備的最新功率數據
   */
  async getAllDevicesLatest(_req: Request, res: Response): Promise<void> {
    logger.info('Getting latest power data for all devices');

    const data = await this.powerDataRepo.getAllDevicesLatest();

    res.json({
      success: true,
      data: {
        count: data.length,
        devices: data,
      },
    });
  }
}
