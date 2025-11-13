// =================================================================
// GPS Parser Service - Converted from Node-RED
// GPS 解析器 - TypeScript 版本
//
// Original: Node-RED Function node "gps解析器" (130 lines)
// Node ID: 74034cbe63589d95
//
// Purpose: Parse GPS location data from MQTT
// Input: MQTT topic solar/{device_id}/gps
// Format: "latitude,longitude,altitude,satellites"
// Example: "25.033671,121.564427,100.5,8"
// =================================================================

import { Logger } from '../../utils/logger';
import type {
  ParsedGpsData,
  GpsDashboardData,
  GpsValidation
} from '../../types/gps.types';

export class GpsParser {
  private readonly logger = new Logger(GpsParser.name);

  /**
   * 解析 GPS 數據
   * @param deviceId 設備 ID
   * @param payload MQTT payload (可以是 Buffer 或 string)
   * @returns 解析後的 GPS 數據
   */
  async parse(
    deviceId: string,
    payload: Buffer | string
  ): Promise<ParsedGpsData | null> {
    this.logger.info(`處理設備 ${deviceId} 的 GPS 數據`);

    // === 步驟 1: 轉換 payload 為字串 ===
    let rawData: string;

    if (Buffer.isBuffer(payload)) {
      rawData = payload.toString('utf-8');
    } else if (typeof payload === 'string') {
      rawData = payload;
    } else {
      rawData = String(payload);
    }

    // === 步驟 2: 清理數據（移除引號和空白）===
    const cleanData = rawData.replace(/["\s]/g, '');

    this.logger.info(`原始數據: ${cleanData}`);

    // === 步驟 3: 檢查數據 ===
    if (!cleanData || cleanData.length === 0) {
      this.logger.error('GPS 數據為空');
      return null;
    }

    // === 步驟 4: 分割數據 ===
    // 格式: latitude,longitude,altitude,satellites
    const parts = cleanData.split(',');

    if (parts.length < 2) {
      this.logger.error(`GPS 數據格式錯誤: 預期至少2個欄位，實際${parts.length}個`);
      return null;
    }

    // === 步驟 5: 解析座標 ===
    const latitude = parseFloat(parts[0]);
    const longitude = parseFloat(parts[1]);
    const altitude = parts.length > 2 ? parseFloat(parts[2]) : 0;
    const satellites = parts.length > 3 ? parseInt(parts[3]) : 0;

    // === 步驟 6: 驗證座標 ===
    const validation = this.validateCoordinates(latitude, longitude);

    if (!validation.valid) {
      this.logger.warn(validation.error || 'GPS 座標驗證失敗');
      return null;
    }

    // === 步驟 7: 記錄成功 ===
    this.logger.info(
      `✅ 座標: (${latitude.toFixed(6)}, ${longitude.toFixed(6)}), ` +
      `高度: ${altitude}m, 衛星: ${satellites}`
    );

    // === 步驟 8: 返回解析結果 ===
    return {
      deviceId,
      latitude,
      longitude,
      altitude: altitude || 0,
      satellites: satellites || 0,
      timestamp: new Date()
    };
  }

  /**
   * 驗證 GPS 座標
   */
  private validateCoordinates(
    latitude: number,
    longitude: number
  ): GpsValidation {
    // 檢查是否為數字
    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        valid: false,
        error: '無效的 GPS 座標（非數字）'
      };
    }

    // 檢查座標範圍
    if (latitude < -90 || latitude > 90) {
      return {
        valid: false,
        error: `緯度超出範圍: ${latitude} (應在 -90 ~ 90 之間)`
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        valid: false,
        error: `經度超出範圍: ${longitude} (應在 -180 ~ 180 之間)`
      };
    }

    return { valid: true };
  }

  /**
   * 格式化為 Dashboard 數據
   */
  formatForDashboard(gpsData: ParsedGpsData): GpsDashboardData {
    return {
      device_id: gpsData.deviceId,
      type: 'gps',
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      altitude: gpsData.altitude,
      satellites: gpsData.satellites,
      timestamp: new Date().toLocaleTimeString('zh-TW'),
      formatted: `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}`
    };
  }
}
