// =================================================================
// WebSocket Service - Phase 3
// Socket.io 即時通訊服務
// =================================================================

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Logger } from '../../utils/logger';
import type {
  PowerDataUpdatePayload,
  DeviceStatusPayload,
  ImageNotificationPayload,
  UpdateFactorPayload,
  FactorUpdatedPayload,
  NotificationPayload,
  SubscribeDevicePayload
} from '../../types/websocket';
import { WebSocketEvent } from '../../types/websocket';

export class WebSocketService {
  private readonly logger = new Logger('WebSocketService');
  private io: Server;
  private connectedClients: Map<string, Set<string>> = new Map(); // deviceId -> Set<socketId>

  constructor(httpServer: HttpServer) {
    this.logger.info('Initializing WebSocket service...');

    // 初始化 Socket.io
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // ⚠️ 生產環境應該限制為特定域名
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'], // 支援 WebSocket 與 Polling 兩種方式
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    this.logger.info('WebSocket service initialized successfully');
  }

  /**
   * 設置 Socket.io 事件處理器
   */
  private setupEventHandlers(): void {
    this.io.on(WebSocketEvent.CONNECTION, (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * 處理客戶端連接
   */
  private handleConnection(socket: Socket): void {
    const clientId = socket.id;
    const clientIp = socket.handshake.address;

    this.logger.info(`Client connected: ${clientId} from ${clientIp}`);

    // 訂閱設備
    socket.on(WebSocketEvent.SUBSCRIBE_DEVICE, (payload: SubscribeDevicePayload) => {
      this.handleSubscribeDevice(socket, payload);
    });

    // 取消訂閱設備
    socket.on(WebSocketEvent.UNSUBSCRIBE_DEVICE, (payload: SubscribeDevicePayload) => {
      this.handleUnsubscribeDevice(socket, payload);
    });

    // 更新 Factor
    socket.on(WebSocketEvent.UPDATE_FACTOR, (payload: UpdateFactorPayload) => {
      this.handleUpdateFactor(socket, payload);
    });

    // 斷線處理
    socket.on(WebSocketEvent.DISCONNECT, (reason: string) => {
      this.handleDisconnect(socket, reason);
    });

    // 錯誤處理
    socket.on(WebSocketEvent.ERROR, (error: Error) => {
      this.logger.error(`Socket error for client ${clientId}:`, error);
    });

    // 發送歡迎訊息
    socket.emit(WebSocketEvent.NOTIFICATION, {
      type: 'info',
      title: 'Connected',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    } as NotificationPayload);
  }

  /**
   * 處理訂閱設備事件
   */
  private handleSubscribeDevice(socket: Socket, payload: SubscribeDevicePayload): void {
    const { deviceId } = payload;
    const clientId = socket.id;

    if (!this.connectedClients.has(deviceId)) {
      this.connectedClients.set(deviceId, new Set());
    }

    this.connectedClients.get(deviceId)!.add(clientId);
    socket.join(`device:${deviceId}`); // 加入 Socket.io room

    this.logger.info(`Client ${clientId} subscribed to device ${deviceId}`);

    // 發送確認訊息
    socket.emit(WebSocketEvent.NOTIFICATION, {
      type: 'success',
      title: 'Subscribed',
      message: `Subscribed to device ${deviceId}`,
      timestamp: new Date().toISOString()
    } as NotificationPayload);
  }

  /**
   * 處理取消訂閱設備事件
   */
  private handleUnsubscribeDevice(socket: Socket, payload: SubscribeDevicePayload): void {
    const { deviceId } = payload;
    const clientId = socket.id;

    if (this.connectedClients.has(deviceId)) {
      this.connectedClients.get(deviceId)!.delete(clientId);

      if (this.connectedClients.get(deviceId)!.size === 0) {
        this.connectedClients.delete(deviceId);
      }
    }

    socket.leave(`device:${deviceId}`);

    this.logger.info(`Client ${clientId} unsubscribed from device ${deviceId}`);
  }

  /**
   * 處理更新 Factor 事件
   */
  private handleUpdateFactor(socket: Socket, payload: UpdateFactorPayload): void {
    // TODO: 實作 Factor 更新邏輯
    // 1. 驗證權限
    // 2. 更新資料庫
    // 3. 透過 MQTT 發送到設備
    // 4. 回應結果

    this.logger.info(`Factor update request:`, payload);

    // 暫時回應成功
    socket.emit(WebSocketEvent.FACTOR_UPDATED, {
      deviceId: payload.deviceId,
      factorType: payload.factorType,
      oldValue: 1.0,
      newValue: payload.newValue,
      updatedAt: new Date().toISOString()
    } as FactorUpdatedPayload);
  }

  /**
   * 處理客戶端斷線
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    const clientId = socket.id;

    // 從所有設備訂閱中移除
    for (const [deviceId, clients] of this.connectedClients.entries()) {
      if (clients.has(clientId)) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.connectedClients.delete(deviceId);
        }
      }
    }

    this.logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
  }

  /**
   * 廣播功率數據更新
   * @param deviceId 設備 ID
   * @param data 功率數據
   */
  public broadcastPowerDataUpdate(deviceId: string, data: PowerDataUpdatePayload): void {
    const room = `device:${deviceId}`;
    this.io.to(room).emit(WebSocketEvent.POWER_DATA_UPDATE, data);

    const subscriberCount = this.connectedClients.get(deviceId)?.size || 0;
    if (subscriberCount > 0) {
      this.logger.debug(`Broadcasted power data for device ${deviceId} to ${subscriberCount} clients`);
    }
  }

  /**
   * 廣播設備狀態更新
   * @param deviceId 設備 ID
   * @param status 設備狀態
   */
  public broadcastDeviceStatus(deviceId: string, status: DeviceStatusPayload): void {
    const room = `device:${deviceId}`;
    this.io.to(room).emit(WebSocketEvent.DEVICE_STATUS, status);
    this.logger.info(`Broadcasted device status for ${deviceId}: ${status.status}`);
  }

  /**
   * 廣播圖像上傳通知
   * @param deviceId 設備 ID
   * @param imageInfo 圖像資訊
   */
  public broadcastImageNotification(deviceId: string, imageInfo: ImageNotificationPayload): void {
    const room = `device:${deviceId}`;
    this.io.to(room).emit(WebSocketEvent.IMAGE_NOTIFICATION, imageInfo);
    this.logger.info(`Broadcasted image notification for device ${deviceId}`);
  }

  /**
   * 發送系統通知給所有連接的客戶端
   * @param notification 通知內容
   */
  public broadcastNotification(notification: NotificationPayload): void {
    this.io.emit(WebSocketEvent.NOTIFICATION, notification);
    this.logger.info(`Broadcasted notification: ${notification.title}`);
  }

  /**
   * 獲取連接的客戶端數量
   */
  public getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * 獲取訂閱特定設備的客戶端數量
   */
  public getDeviceSubscribersCount(deviceId: string): number {
    return this.connectedClients.get(deviceId)?.size || 0;
  }

  /**
   * 獲取 Socket.io Server 實例 (用於與 HTTP Server 整合)
   */
  public getIO(): Server {
    return this.io;
  }

  /**
   * 關閉 WebSocket 服務
   */
  public async close(): Promise<void> {
    this.logger.info('Closing WebSocket service...');

    return new Promise((resolve) => {
      this.io.close(() => {
        this.logger.info('WebSocket service closed');
        resolve();
      });
    });
  }
}
