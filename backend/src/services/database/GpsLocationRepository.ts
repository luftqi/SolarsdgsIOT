// =================================================================
// GPS Location Repository - Converted from Node-RED SQL Generator
// GPS 位置儲存庫
//
// Original: Node-RED Function node "SQL生成器" (476 lines)
// Purpose: Database operations for GPS location data
// =================================================================

import { Pool, QueryResult } from 'pg';
import { Logger } from '../../utils/logger';
import type { ParsedGpsData, GpsLocationRecord } from '../../types/gps.types';

export class GpsLocationRepository {
  private readonly logger = new Logger(GpsLocationRepository.name);

  constructor(private readonly pool: Pool) {}

  /**
   * 插入或更新 GPS 位置（UPSERT）
   * @param gpsData 解析後的 GPS 數據
   * @returns 記錄 ID
   */
  async upsertGpsLocation(gpsData: ParsedGpsData): Promise<number> {
    const query = `
      INSERT INTO gps_locations
      (device_id, latitude, longitude, altitude, satellites, timezone, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (device_id, timestamp) DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        altitude = EXCLUDED.altitude,
        satellites = EXCLUDED.satellites,
        timezone = EXCLUDED.timezone
      RETURNING id;
    `;

    const params = [
      gpsData.deviceId,
      gpsData.latitude,
      gpsData.longitude,
      gpsData.altitude,
      gpsData.satellites,
      gpsData.timezone,  // 加入時區
      gpsData.timestamp
    ];

    this.logger.info(
      `UPSERT GPS 位置: ${gpsData.deviceId} @ (${gpsData.latitude}, ${gpsData.longitude}), 時區: ${gpsData.timezone}`
    );

    try {
      const result: QueryResult = await this.pool.query(query, params);
      return result.rows[0].id;
    } catch (error: any) {
      this.logger.error(`UPSERT GPS 位置失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取設備的最新 GPS 位置
   * @param deviceId 設備 ID
   * @returns GPS 位置記錄
   */
  async getLatestLocation(deviceId: string): Promise<GpsLocationRecord | null> {
    const query = `
      SELECT * FROM gps_locations
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;

    this.logger.info(`查詢最新 GPS 位置: ${deviceId}`);

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      this.logger.error(`查詢最新 GPS 位置失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取所有設備的最新 GPS 位置
   * @returns GPS 位置記錄陣列
   */
  async getAllLatestLocations(): Promise<GpsLocationRecord[]> {
    const query = `
      SELECT DISTINCT ON (device_id) *
      FROM gps_locations
      ORDER BY device_id, timestamp DESC;
    `;

    this.logger.info('查詢所有設備的最新 GPS 位置');

    try {
      const result: QueryResult = await this.pool.query(query);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢所有 GPS 位置失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取設備的 GPS 軌跡
   * @param deviceId 設備 ID
   * @param startTime 開始時間
   * @param endTime 結束時間
   * @param limit 最多返回數量
   * @returns GPS 位置記錄陣列
   */
  async getGpsTrack(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 100
  ): Promise<GpsLocationRecord[]> {
    const query = `
      SELECT * FROM gps_locations
      WHERE device_id = $1
      AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp ASC
      LIMIT $4;
    `;

    this.logger.info(
      `查詢 GPS 軌跡: ${deviceId} (${startTime.toISOString()} ~ ${endTime.toISOString()}) limit ${limit}`
    );

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, startTime, endTime, limit]);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢 GPS 軌跡失敗: ${error.message}`, error);
      throw error;
    }
  }
}
