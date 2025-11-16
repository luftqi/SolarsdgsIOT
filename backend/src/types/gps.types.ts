// =================================================================
// GPS Data Types - Converted from Node-RED flows.json
// GPS 數據類型定義
// =================================================================

/**
 * GPS 原始數據（從 MQTT 接收）
 * 格式: "latitude,longitude,altitude,satellites"
 * 範例: "25.033671,121.564427,100.5,8"
 */
export interface RawGpsData {
  deviceId: string;
  payload: string;  // CSV 格式字串
}

/**
 * 解析後的 GPS 數據
 */
export interface ParsedGpsData {
  deviceId: string;
  latitude: number;   // 緯度 (-90 ~ 90)
  longitude: number;  // 經度 (-180 ~ 180)
  altitude: number;   // 高度 (公尺)
  satellites: number; // 衛星數量
  timezone: string;   // 時區 (例如: Asia/Taipei)
  timestamp: Date;
}

/**
 * GPS 資料庫記錄
 */
export interface GpsLocationRecord {
  id?: number;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  timezone: string;   // 時區 (例如: Asia/Taipei)
  timestamp: Date;
  created_at?: Date;
}

/**
 * GPS Dashboard 數據（發送給前端）
 */
export interface GpsDashboardData {
  device_id: string;
  type: 'gps';
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  timestamp: string;  // 本地時間字串
  formatted: string;  // 格式化座標字串: "25.033671, 121.564427"
}

/**
 * GPS 驗證結果
 */
export interface GpsValidation {
  valid: boolean;
  error?: string;
}
