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

  /**
   * GET /api/power-data/device/:deviceId/aggregated
   *
   * 獲取設備的聚合功率數據（固定資料點數，按時間間隔平均）
   *
   * Query params:
   * - interval: 時間間隔（分鐘），例如 1, 5, 10, 30, 60, 360, 1440
   * - points: 資料點數量（預設 60）
   */
  async getAggregated(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const interval = parseInt(req.query.interval as string);
    const points = parseInt(req.query.points as string) || 60;

    // 驗證參數
    if (!interval || isNaN(interval) || interval <= 0) {
      throw new BadRequestError('interval must be a positive number (minutes)');
    }

    if (isNaN(points) || points <= 0 || points > 1000) {
      throw new BadRequestError('points must be between 1 and 1000');
    }

    // 計算時間範圍：從最新數據往回推
    // 1. 先獲取最新一筆數據的時間戳
    const latestQuery = `
      SELECT timestamp
      FROM power_data
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const latestResult = await this.powerDataRepo['pool'].query(latestQuery, [deviceId]);

    let endTime: Date;
    if (latestResult.rows.length > 0) {
      // 使用最新數據的時間戳
      endTime = new Date(latestResult.rows[0].timestamp);
    } else {
      // 如果沒有數據，使用當前時間
      endTime = new Date();
    }

    // 2. 從最新數據往回推算時間範圍
    const startTime = new Date(endTime.getTime() - interval * points * 60 * 1000);

    logger.info(
      `Getting aggregated data for device ${deviceId}: interval=${interval}min, points=${points}, latest=${endTime.toISOString()}, range=${startTime.toISOString()} to ${endTime.toISOString()}`
    );

    const data = await this.powerDataRepo.getAggregatedData(
      deviceId,
      startTime,
      endTime,
      interval,
      points
    );

    res.json({
      success: true,
      data: {
        deviceId,
        interval,
        points,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        count: data.length,
        records: data,
      },
    });
  }
}
