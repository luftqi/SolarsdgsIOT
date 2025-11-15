// =================================================================
// WebSocket Types - Phase 3
// Socket.io 事件與數據類型定義
// =================================================================

/**
 * WebSocket 事件名稱
 */
export enum WebSocketEvent {
  // 連接事件
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // 功率數據事件
  POWER_DATA_UPDATE = 'power-data-update',
  SUBSCRIBE_DEVICE = 'subscribe-device',
  UNSUBSCRIBE_DEVICE = 'unsubscribe-device',

  // 設備狀態事件
  DEVICE_STATUS = 'device-status',
  DEVICE_ONLINE = 'device-online',
  DEVICE_OFFLINE = 'device-offline',

  // 圖像事件
  NEW_IMAGE = 'new-image',
  IMAGE_NOTIFICATION = 'image-notification',

  // 控制事件
  UPDATE_FACTOR = 'update-factor',
  FACTOR_UPDATED = 'factor-updated',

  // 系統事件
  NOTIFICATION = 'notification',
  SYSTEM_STATUS = 'system-status'
}

/**
 * WebSocket 功率數據推送格式
 */
export interface PowerDataUpdatePayload {
  deviceId: string;
  timestamp: string;
  pg: number;
  pa: number;
  pp: number;
  pagEfficiency: number | null;
  ppgEfficiency: number | null;
}

/**
 * WebSocket 設備狀態推送格式
 */
export interface DeviceStatusPayload {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  metadata?: Record<string, any>;
}

/**
 * WebSocket 圖像通知格式
 */
export interface ImageNotificationPayload {
  deviceId: string;
  imageId: string;
  rgbThumbnailUrl: string;
  thermalThumbnailUrl: string;
  capturedAt: string;
}

/**
 * WebSocket Factor 更新請求
 */
export interface UpdateFactorPayload {
  deviceId: string;
  factorType: 'pa_factor' | 'pp_factor';
  newValue: number;
}

/**
 * WebSocket Factor 更新回應
 */
export interface FactorUpdatedPayload {
  deviceId: string;
  factorType: 'pa_factor' | 'pp_factor';
  oldValue: number;
  newValue: number;
  updatedAt: string;
}

/**
 * WebSocket 通知格式
 */
export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

/**
 * WebSocket 訂閱設備請求
 */
export interface SubscribeDevicePayload {
  deviceId: string;
}
