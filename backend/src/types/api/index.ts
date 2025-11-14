// =================================================================
// API Types - Phase 2 Backend API 層
// =================================================================

/**
 * 通用 API 響應格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * 分頁參數
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁響應
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 時間範圍查詢參數
 */
export interface TimeRangeParams {
  startDate?: string;  // ISO 8601 格式
  endDate?: string;    // ISO 8601 格式
  latest?: number;     // 取最新 N 筆
}

/**
 * 設備資訊 DTO
 */
export interface DeviceDTO {
  id: number;
  deviceId: string;
  deviceName: string | null;
  deviceType: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 功率數據 DTO
 */
export interface PowerDataDTO {
  id: number;
  deviceId: string;
  timestamp: string;
  pg: number;              // 發電功率 (W)
  pa: number;              // 負載 A 功率 (W)
  pp: number;              // 負載 P 功率 (W)
  pagEfficiency: number | null;  // PAG 效率 (%)
  ppgEfficiency: number | null;  // PPG 效率 (%)
  createdAt: string;
}

/**
 * GPS 位置 DTO
 */
export interface GpsLocationDTO {
  id: number;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  timestamp: string;
  createdAt: string;
}

/**
 * 設備配置 DTO
 */
export interface DeviceConfigDTO {
  id: number;
  deviceId: string;
  factorA: number;   // PA 修正係數
  factorP: number;   // PP 修正係數
  pizero2On: number;  // Pi Zero 2W 開機時間
  pizero2Off: number; // Pi Zero 2W 關機時間
  updatedAt: string;
}

/**
 * 圖表數據點（對應 Node-RED ui-chart 格式）
 */
export interface ChartDataPoint {
  topic: string;        // 系列名稱 (PG, PA, PP, PAG, PPG)
  timestamp: number;    // Unix 毫秒時間戳
  payload: number;      // 數值
}

/**
 * 實時數據推送格式（WebSocket）
 */
export interface RealtimeDataPayload {
  type: 'power_data' | 'gps_location' | 'device_status';
  deviceId: string;
  data: PowerDataDTO | GpsLocationDTO | { status: string };
  timestamp: string;
}

/**
 * 統計數據 DTO
 */
export interface StatisticsDTO {
  deviceId: string;
  totalRecords: number;
  avgPG: number;
  avgPA: number;
  avgPP: number;
  avgPAG: number;
  avgPPG: number;
  maxPG: number;
  minPG: number;
  dateRange: {
    start: string;
    end: string;
  };
}
