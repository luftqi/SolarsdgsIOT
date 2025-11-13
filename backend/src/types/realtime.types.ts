/**
 * Realtime Data Types
 *
 * 即時數據類型定義
 */

/**
 * 即時 UI 數據格式
 *
 * 用於前端 Dashboard 即時顯示
 */
export interface RealtimeUiData {
  type: 'realtime';
  device_id: string;
  online: boolean;
  lastUpdate: string;      // 本地時間字串 (e.g., "下午4:04:47")
  pg: number;              // 發電功率 (W)
  pa: number;              // 負載A功率 (W)
  pp: number;              // 負載P功率 (W)
  pag: number;             // 負載A效率 (%)
  ppg: number;             // 負載P效率 (%)
  timestamp: string;       // ISO 8601 格式
}

/**
 * WebSocket 事件類型
 */
export enum WebSocketEvent {
  // Client → Server
  JOIN_DEVICE = 'join_device',        // 加入設備房間
  LEAVE_DEVICE = 'leave_device',      // 離開設備房間

  // Server → Client
  REALTIME_DATA = 'realtime_data',    // 即時功率數據
  DEVICE_STATUS = 'device_status',    // 設備狀態變更
  ERROR = 'error',                    // 錯誤訊息

  // Bidirectional
  PING = 'ping',                      // 心跳檢測
  PONG = 'pong',                      // 心跳回應
}

/**
 * WebSocket 錯誤訊息
 */
export interface WebSocketError {
  code: string;
  message: string;
  timestamp: string;
}
