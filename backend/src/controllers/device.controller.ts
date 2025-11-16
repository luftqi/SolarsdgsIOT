/**
 * Device Controller - Phase 2.4 (多租戶權限控制)
 *
 * 處理設備相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { DatabaseService } from '../services/database/DatabaseService';
import { NotFoundError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('DeviceController');

/**
 * 擴展 Express Request，添加 user 屬性（來自 authMiddleware）
 */
interface AuthRequest extends Request {
  user?: {
    customerId: number;
    customerCode: string;
    customerName: string;
    devices: string[];
  };
}

export class DeviceController {
  private pool;

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.pool = dbService.getPool();
  }

  /**
   * GET /api/devices
   *
   * 獲取所有設備列表（僅返回用戶有權訪問的設備）
   * Phase 2.4: 根據 JWT Token 中的 devices 列表過濾
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthRequest;
    const userDevices = authReq.user?.devices || [];

    logger.info(`Getting devices for user ${authReq.user?.customerCode}, allowed devices: ${userDevices.join(', ')}`);

    // Phase 2.4: 只查詢用戶有權訪問的設備
    const query = `
      SELECT
        d.device_id,
        d.device_name,
        d.device_type,
        d.status,
        d.last_seen,
        d.created_at,
        d.updated_at,
        c.factor_a,
        c.factor_p
      FROM devices d
      LEFT JOIN device_config c ON d.device_id = c.device_id
      WHERE d.device_id = ANY($1::text[])
      ORDER BY d.device_id;
    `;

    const result = await this.pool.query(query, [userDevices]);

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
        d.device_type,
        d.status,
        d.last_seen,
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
        device_type,
        status,
        last_seen
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

  /**
   * PUT /api/devices/:deviceId/config
   *
   * 更新設備 Factor 配置
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    const { factor_a, factor_p } = req.body;

    logger.info(`Updating config for device ${deviceId}: factor_a=${factor_a}, factor_p=${factor_p}`);

    // 驗證 Factor 範圍
    if (factor_a !== undefined && (factor_a < 0.5 || factor_a > 2.0)) {
      res.status(400).json({
        success: false,
        message: 'factor_a must be between 0.5 and 2.0'
      });
      return;
    }

    if (factor_p !== undefined && (factor_p < 0.5 || factor_p > 2.0)) {
      res.status(400).json({
        success: false,
        message: 'factor_p must be between 0.5 and 2.0'
      });
      return;
    }

    // 更新配置
    const query = `
      INSERT INTO device_config (device_id, factor_a, factor_p, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (device_id)
      DO UPDATE SET
        factor_a = COALESCE($2, device_config.factor_a),
        factor_p = COALESCE($3, device_config.factor_p),
        updated_at = NOW()
      RETURNING device_id, factor_a, factor_p, updated_at;
    `;

    const result = await this.pool.query(query, [deviceId, factor_a, factor_p]);

    res.json({
      success: true,
      message: 'Factor configuration updated successfully',
      data: result.rows[0],
    });
  }
}
