// =================================================================
// Power Data Repository - Converted from Node-RED SQL Generator
// 功率數據儲存庫
//
// Original: Node-RED Function node "SQL生成器" (476 lines)
// Node ID: 4e63fc0483df2653
//
// Purpose: Database operations for power data
// =================================================================

import { Pool, QueryResult } from 'pg';
import { Logger } from '../../utils/logger';
import type { ParsedPowerData, PowerDataRecord } from '../../types/power.types';

export class PowerDataRepository {
  private readonly logger = new Logger(PowerDataRepository.name);

  constructor(private readonly pool: Pool) {}

  /**
   * 插入單條功率數據
   * @param data 解析後的功率數據
   * @returns 插入的記錄 ID
   */
  async insertPowerData(data: ParsedPowerData): Promise<number> {
    const query = `
      INSERT INTO power_data
      (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (device_id, timestamp) DO UPDATE SET
        pg = EXCLUDED.pg,
        pa = EXCLUDED.pa,
        pp = EXCLUDED.pp,
        pga_efficiency = EXCLUDED.pga_efficiency,
        pgp_efficiency = EXCLUDED.pgp_efficiency
      RETURNING id;
    `;

    const params = [
      data.deviceId,
      data.timestamp,
      data.pg,
      data.pa,
      data.pp,
      data.pag,
      data.ppg
    ];

    this.logger.info(`插入功率數據: ${data.deviceId} @ ${data.timestamp}`);

    try {
      const result: QueryResult = await this.pool.query(query, params);
      return result.rows[0].id;
    } catch (error: any) {
      this.logger.error(`插入功率數據失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 批量插入功率數據
   * @param dataArray 解析後的功率數據陣列
   * @returns 插入的記錄 ID 陣列
   */
  async batchInsertPowerData(dataArray: ParsedPowerData[]): Promise<number[]> {
    if (!dataArray || dataArray.length === 0) {
      this.logger.warn('批量插入：無有效數據');
      return [];
    }

    // 構建 VALUES 子句
    const values = dataArray.map((_, idx) => {
      const offset = idx * 7;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
    }).join(',');

    const query = `
      INSERT INTO power_data
      (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
      VALUES ${values}
      ON CONFLICT (device_id, timestamp) DO UPDATE SET
        pg = EXCLUDED.pg,
        pa = EXCLUDED.pa,
        pp = EXCLUDED.pp,
        pga_efficiency = EXCLUDED.pga_efficiency,
        pgp_efficiency = EXCLUDED.pgp_efficiency
      RETURNING id;
    `;

    // 扁平化參數
    const params = dataArray.flatMap(data => [
      data.deviceId,
      data.timestamp,
      data.pg,
      data.pa,
      data.pp,
      data.pag,
      data.ppg
    ]);

    this.logger.info(`批量插入 ${dataArray.length} 筆數據`);

    try {
      const result: QueryResult = await this.pool.query(query, params);
      return result.rows.map(row => row.id);
    } catch (error: any) {
      this.logger.error(`批量插入失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取最新數據
   * @param deviceId 設備 ID
   * @param limit 數據條數（預設 10）
   * @returns 功率數據陣列
   */
  async getLatestData(deviceId: string, limit: number = 10): Promise<PowerDataRecord[]> {
    const query = `
      SELECT * FROM power_data
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT $2;
    `;

    this.logger.info(`查詢最新數據: ${deviceId} (limit: ${limit})`);

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, limit]);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢最新數據失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 根據時間範圍獲取數據
   * @param deviceId 設備 ID
   * @param startTime 開始時間
   * @param endTime 結束時間
   * @returns 功率數據陣列
   */
  async getDataByTimeRange(
    deviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<PowerDataRecord[]> {
    const query = `
      SELECT * FROM power_data
      WHERE device_id = $1
      AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp DESC;
    `;

    this.logger.info(`查詢時間範圍數據: ${deviceId} (${startTime.toISOString()} ~ ${endTime.toISOString()})`);

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, startTime, endTime]);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢時間範圍數據失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取每小時統計數據
   * @param deviceId 設備 ID
   * @param date 日期
   * @returns 統計數據
   */
  async getHourlyStats(deviceId: string, date: Date): Promise<any[]> {
    const query = `
      SELECT
        DATE_TRUNC('hour', timestamp) AS hour,
        AVG(pg) AS avg_pg,
        AVG(pa) AS avg_pa,
        AVG(pp) AS avg_pp,
        AVG(pga_efficiency) AS avg_pag,
        AVG(pgp_efficiency) AS avg_ppg,
        MAX(pg) AS max_pg,
        MIN(pg) AS min_pg,
        COUNT(*) AS count
      FROM power_data
      WHERE device_id = $1
      AND DATE(timestamp) = DATE($2)
      GROUP BY DATE_TRUNC('hour', timestamp)
      ORDER BY hour;
    `;

    this.logger.info(`查詢每小時統計: ${deviceId} (${date.toISOString()})`);

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, date]);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢每小時統計失敗: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 獲取每日摘要
   * @param deviceId 設備 ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 摘要數據
   */
  async getDailySummary(
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const query = `
      SELECT
        DATE(timestamp) AS date,
        AVG(pg) AS avg_pg,
        AVG(pa) AS avg_pa,
        AVG(pp) AS avg_pp,
        AVG(pga_efficiency) AS avg_pag,
        AVG(pgp_efficiency) AS avg_ppg,
        MAX(pg) AS max_pg,
        MIN(pg) AS min_pg,
        SUM(pg) / 1000.0 AS total_kwh,
        COUNT(*) AS count
      FROM power_data
      WHERE device_id = $1
      AND DATE(timestamp) BETWEEN DATE($2) AND DATE($3)
      GROUP BY DATE(timestamp)
      ORDER BY date;
    `;

    this.logger.info(`查詢每日摘要: ${deviceId} (${startDate.toISOString()} ~ ${endDate.toISOString()})`);

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, startDate, endDate]);
      return result.rows;
    } catch (error: any) {
      this.logger.error(`查詢每日摘要失敗: ${error.message}`, error);
      throw error;
    }
  }
}
