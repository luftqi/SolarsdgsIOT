/**
 * Device Repository
 * 設備儲存庫 - 管理設備資訊
 */

import { Pool, QueryResult } from 'pg';
import { Logger } from '../../utils/logger';

export interface Device {
  id?: number;
  device_id: string;
  device_name?: string;
  device_type?: string;
  status?: string;
  timezone?: string;
  last_seen?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class DeviceRepository {
  private readonly logger = new Logger(DeviceRepository.name);

  constructor(private readonly pool: Pool) {}

  /**
   * 更新設備時區
   * @param deviceId 設備 ID
   * @param timezone 時區 (例如: Asia/Taipei)
   */
  async updateTimezone(deviceId: string, timezone: string): Promise<void> {
    const query = `
      INSERT INTO devices (device_id, timezone, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (device_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        updated_at = CURRENT_TIMESTAMP;
    `;

    this.logger.info(`更新設備 ${deviceId} 時區: ${timezone}`);

    try {
      await this.pool.query(query, [deviceId, timezone]);
    } catch (error: any) {
      this.logger.error(`更新設備時區失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取設備資訊
   * @param deviceId 設備 ID
   * @returns 設備資訊
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    const query = `
      SELECT * FROM devices
      WHERE device_id = $1;
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      this.logger.error(`查詢設備資訊失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 更新設備最後上線時間
   * @param deviceId 設備 ID
   */
  async updateLastSeen(deviceId: string): Promise<void> {
    const query = `
      INSERT INTO devices (device_id, last_seen, status, updated_at)
      VALUES ($1, CURRENT_TIMESTAMP, 'online', CURRENT_TIMESTAMP)
      ON CONFLICT (device_id) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        status = 'online',
        updated_at = CURRENT_TIMESTAMP;
    `;

    try {
      await this.pool.query(query, [deviceId]);
    } catch (error: any) {
      this.logger.error(`更新設備上線時間失敗: ${error.message}`, error);
      throw error;
    }
  }
}
