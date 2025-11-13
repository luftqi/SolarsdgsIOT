/**
 * Device Controller
 *
 * 處理設備相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { DatabaseService } from '../services/database/DatabaseService';
import { NotFoundError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('DeviceController');

export class DeviceController {
  private pool;

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.pool = dbService.getPool();
  }

  /**
   * GET /api/devices
   *
   * 獲取所有設備列表
   */
  async getAll(_req: Request, res: Response): Promise<void> {
    logger.info('Getting all devices');

    const query = `
      SELECT
        d.device_id,
        d.device_name,
        d.location,
        d.status,
        d.created_at,
        d.updated_at,
        c.factor_a,
        c.factor_p
      FROM devices d
      LEFT JOIN device_config c ON d.device_id = c.device_id
      ORDER BY d.device_id;
    `;

    const result = await this.pool.query(query);

    res.json({
      success: true,
      data: {
        count: result.rows.length,
        devices: result.rows,
      },
    });
  }

  /**
   * GET /api/devices/:deviceId
   *
   * 獲取單個設備詳情
   */
  async getById(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    logger.info(`Getting device details for ${deviceId}`);

    const query = `
      SELECT
        d.device_id,
        d.device_name,
        d.location,
        d.status,
        d.created_at,
        d.updated_at,
        c.factor_a,
        c.factor_p
      FROM devices d
      LEFT JOIN device_config c ON d.device_id = c.device_id
      WHERE d.device_id = $1;
    `;

    const result = await this.pool.query(query, [deviceId]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Device ${deviceId}`);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }

  /**
   * GET /api/devices/:deviceId/config
   *
   * 獲取設備配置
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    logger.info(`Getting config for device ${deviceId}`);

    const query = `
      SELECT
        device_id,
        factor_a,
        factor_p,
        updated_at
      FROM device_config
      WHERE device_id = $1;
    `;

    const result = await this.pool.query(query, [deviceId]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Config for device ${deviceId}`);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }

  /**
   * GET /api/devices/:deviceId/status
   *
   * 獲取設備狀態（包含最新數據）
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;

    logger.info(`Getting status for device ${deviceId}`);

    // 獲取設備基本資訊
    const deviceQuery = `
      SELECT
        device_id,
        device_name,
        location,
        status
      FROM devices
      WHERE device_id = $1;
    `;

    // 獲取最新功率數據
    const powerQuery = `
      SELECT
        timestamp,
        pg,
        pa,
        pp,
        pga_efficiency,
        pgp_efficiency
      FROM power_data
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;

    // 獲取最新 GPS 位置
    const gpsQuery = `
      SELECT
        latitude,
        longitude,
        altitude,
        satellites,
        timestamp
      FROM gps_locations
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;

    const [deviceResult, powerResult, gpsResult] = await Promise.all([
      this.pool.query(deviceQuery, [deviceId]),
      this.pool.query(powerQuery, [deviceId]),
      this.pool.query(gpsQuery, [deviceId]),
    ]);

    if (deviceResult.rows.length === 0) {
      throw new NotFoundError(`Device ${deviceId}`);
    }

    res.json({
      success: true,
      data: {
        device: deviceResult.rows[0],
        latestPower: powerResult.rows[0] || null,
        latestGps: gpsResult.rows[0] || null,
      },
    });
  }
}
