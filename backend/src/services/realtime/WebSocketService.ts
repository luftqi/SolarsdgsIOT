/**
 * WebSocket Service
 *
 * Socket.io 即時數據推送服務
 *
 * 功能：
 * - 管理 WebSocket 連接
 * - 設備房間管理
 * - 即時數據廣播
 * - 心跳檢測
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '../../utils/logger';
import { UiFormatter } from './UiFormatter';
import { WebSocketEvent, type WebSocketError } from '../../types/realtime.types';
import type { ParsedPowerData } from '../../types/power.types';

export class WebSocketService {
  private io: SocketIOServer;
  private readonly logger = new Logger(WebSocketService.name);
  private readonly uiFormatter: UiFormatter;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HttpServer) {
    // 初始化 Socket.io
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.WS_CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.uiFormatter = new UiFormatter();

    // 設置連接處理
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    this.logger.info('✅ WebSocket Service initialized');
  }

  /**
   * 處理客戶端連接
   */
  private handleConnection(socket: Socket): void {
    this.logger.info(`🔌 Client connected: ${socket.id}`);

    // 處理加入設備房間
    socket.on(WebSocketEvent.JOIN_DEVICE, (deviceId: string) => {
      this.handleJoinDevice(socket, deviceId);
    });

    // 處理離開設備房間
    socket.on(WebSocketEvent.LEAVE_DEVICE, (deviceId: string) => {
      this.handleLeaveDevice(socket, deviceId);
    });

    // 處理 PING
    socket.on(WebSocketEvent.PING, () => {
      socket.emit(WebSocketEvent.PONG);
    });

    // 處理斷線
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(socket, reason);
    });

    // 處理錯誤
    socket.on('error', (error: Error) => {
      this.logger.error(`Socket error: ${socket.id}`, error);
    });
  }

  /**
   * 處理加入設備房間
   */
  private handleJoinDevice(socket: Socket, deviceId: string): void {
    if (!deviceId) {
      const error: WebSocketError = {
        code: 'INVALID_DEVICE_ID',
        message: 'Device ID is required',
        timestamp: new Date().toISOString()
      };
      socket.emit(WebSocketEvent.ERROR, error);
      return;
    }

    // 加入房間
    const roomName = `device:${deviceId}`;
    socket.join(roomName);

    this.logger.info(`📥 Client ${socket.id} joined room: ${roomName}`);

    // 確認加入成功
    socket.emit(WebSocketEvent.DEVICE_STATUS, {
      device_id: deviceId,
      status: 'joined',
      timestamp: new Date().toISOString()
    });

    // 啟動心跳檢測
    this.startHeartbeat(socket, deviceId);
  }

  /**
   * 處理離開設備房間
   */
  private handleLeaveDevice(socket: Socket, deviceId: string): void {
    if (!deviceId) {
      return;
    }

    const roomName = `device:${deviceId}`;
    socket.leave(roomName);

    this.logger.info(`📤 Client ${socket.id} left room: ${roomName}`);

    // 停止心跳檢測
    this.stopHeartbeat(socket.id);

    // 確認離開成功
    socket.emit(WebSocketEvent.DEVICE_STATUS, {
      device_id: deviceId,
      status: 'left',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 處理客戶端斷線
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    this.logger.info(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);

    // 清理心跳檢測
    this.stopHeartbeat(socket.id);
  }

  /**
   * 啟動心跳檢測
   */
  private startHeartbeat(socket: Socket, _deviceId: string): void {
    // 清除舊的心跳檢測
    this.stopHeartbeat(socket.id);

    // 每 30 秒發送一次心跳
    const interval = setInterval(() => {
      socket.emit(WebSocketEvent.PING);
    }, 30000);

    this.heartbeatIntervals.set(socket.id, interval);
  }

  /**
   * 停止心跳檢測
   */
  private stopHeartbeat(socketId: string): void {
    const interval = this.heartbeatIntervals.get(socketId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socketId);
    }
  }

  /**
   * 廣播即時數據到設備房間
   *
   * @param deviceId 設備 ID
   * @param data 解析後的功率數據
   * @param online 設備在線狀態
   */
  broadcastRealtimeData(
    deviceId: string,
    data: ParsedPowerData,
    online: boolean = true
  ): void {
    try {
      // 格式化數據
      const uiData = this.uiFormatter.formatRealtimeData(data, online);

      if (!uiData) {
        this.logger.warn(`⚠️ Failed to format data for device ${deviceId}`);
        return;
      }

      // 廣播到設備房間
      const roomName = `device:${deviceId}`;
      this.io.to(roomName).emit(WebSocketEvent.REALTIME_DATA, uiData);

      this.logger.debug(`📡 Broadcasted data to room: ${roomName}`, {
        device_id: deviceId,
        pg: uiData.pg,
        pa: uiData.pa,
        pp: uiData.pp
      });
    } catch (error) {
      this.logger.error(`Failed to broadcast data for device ${deviceId}`, error);
    }
  }

  /**
   * 廣播設備狀態變更
   *
   * @param deviceId 設備 ID
   * @param online 在線狀態
   * @param message 狀態訊息
   */
  broadcastDeviceStatus(
    deviceId: string,
    online: boolean,
    message?: string
  ): void {
    const roomName = `device:${deviceId}`;

    this.io.to(roomName).emit(WebSocketEvent.DEVICE_STATUS, {
      device_id: deviceId,
      online: online,
      message: message || (online ? 'Device online' : 'Device offline'),
      timestamp: new Date().toISOString()
    });

    this.logger.info(`📢 Broadcasted status for ${deviceId}: ${online ? 'online' : 'offline'}`);
  }

  /**
   * 發送錯誤訊息到設備房間
   *
   * @param deviceId 設備 ID
   * @param error 錯誤訊息
   */
  broadcastError(_deviceId: string, error: WebSocketError): void {
    const roomName = `device:${_deviceId}`;
    this.io.to(roomName).emit(WebSocketEvent.ERROR, error);

    this.logger.warn(`⚠️ Broadcasted error to ${roomName}:`, error);
  }

  /**
   * 獲取房間內的連接數
   *
   * @param deviceId 設備 ID
   * @returns 連接數
   */
  async getRoomSize(deviceId: string): Promise<number> {
    const roomName = `device:${deviceId}`;
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.length;
  }

  /**
   * 獲取所有活躍房間
   *
   * @returns 房間名稱列表
   */
  getActiveRooms(): string[] {
    const rooms: string[] = [];
    this.io.sockets.adapter.rooms.forEach((_, roomName) => {
      // 過濾掉 socket.id 的房間（這些是私有房間）
      if (!roomName.startsWith('/')) {
        rooms.push(roomName);
      }
    });
    return rooms;
  }

  /**
   * 關閉 WebSocket 服務
   */
  async close(): Promise<void> {
    // 清理所有心跳檢測
    this.heartbeatIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.heartbeatIntervals.clear();

    // 關閉所有連接
    this.io.close();

    this.logger.info('WebSocket Service closed');
  }
}
