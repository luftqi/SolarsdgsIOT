// =================================================================
// Backend Server Entry Point
// 後端服務入口
//
// Purpose: Initialize and start all services
// - Database connection
// - MQTT service
// - Express API server
// - WebSocket server
// =================================================================

// ⚠️ CRITICAL: 必須在所有 import 之前載入環境變數
// 因為某些模組在導入時可能會立即讀取 process.env
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 現在可以安全地導入其他模組
import { Logger } from './utils/logger';
import { DatabaseService } from './services/database/DatabaseService';
import { PowerDataRepository } from './services/database/PowerDataRepository';
import { GpsLocationRepository } from './services/database/GpsLocationRepository';
import { MqttService } from './services/mqtt/MqttService';
import { WebSocketService } from './services/realtime/WebSocketService';
import { createApp } from './app';
import type { Server as HttpServer } from 'http';

const logger = new Logger('Server');

// 調試：確認環境變數已載入
logger.info(`Environment loaded - DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);

/**
 * 主啟動函數
 */
async function main() {
  logger.info('========================================');
  logger.info('SolarSDGs IoT Backend Starting...');
  logger.info('========================================');

  try {
    // === 1. 初始化資料庫 ===
    logger.info('Step 1: Initializing database...');
    const dbService = DatabaseService.getInstance();
    const pool = dbService.getPool();

    // 測試連接
    const connected = await dbService.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // === 2. 創建 Repository 實例 ===
    logger.info('Step 2: Creating repositories...');
    const powerDataRepo = new PowerDataRepository(pool);
    const gpsLocationRepo = new GpsLocationRepository(pool);

    // === 3. 初始化 MQTT 服務 ===
    logger.info('Step 3: Initializing MQTT service...');
    const mqttService = new MqttService(powerDataRepo, gpsLocationRepo);

    await mqttService.connect();

    // === 4. 設置 Factor 配置（從資料庫載入）===
    logger.info('Step 4: Loading device configurations...');
    mqttService.setFactorConfig('6001', { factor_a: 1.0, factor_p: 1.0 });
    mqttService.setFactorConfig('6002', { factor_a: 1.0, factor_p: 1.0 });

    // === 5. 初始化 Express API 服務器 ===
    logger.info('Step 5: Starting Express API server...');
    const app = createApp();
    const PORT = parseInt(process.env.PORT || '3000');

    const httpServer: HttpServer = app.listen(PORT, () => {
      logger.info(`Express API server listening on port ${PORT}`);
    });

    // === 6. 初始化 WebSocket 服務器 ===
    logger.info('Step 6: Starting WebSocket server...');
    const wsService = new WebSocketService(httpServer);

    // === 7. 整合 MQTT → WebSocket 即時推送 ===
    logger.info('Step 7: Integrating MQTT with WebSocket...');
    mqttService.on('powerDataParsed', (data) => {
      // 廣播即時數據到 WebSocket
      wsService.broadcastRealtimeData(data.deviceId, data, true);
    });

    logger.info('========================================');
    logger.info('✅ SolarSDGs IoT Backend Started Successfully');
    logger.info('========================================');
    logger.info('Services running:');
    logger.info(`  - PostgreSQL: Connected (${process.env.DB_NAME})`);
    logger.info(`  - MQTT: Connected (${process.env.MQTT_BROKER_URL})`);
    logger.info(`  - Express API: http://localhost:${PORT}`);
    logger.info(`  - WebSocket: ws://localhost:${PORT} (Socket.io)`);
    logger.info('========================================');
    logger.info('Available endpoints:');
    logger.info(`  - http://localhost:${PORT}/api/health`);
    logger.info(`  - http://localhost:${PORT}/api/devices`);
    logger.info(`  - http://localhost:${PORT}/api/power-data`);
    logger.info(`  - http://localhost:${PORT}/api/gps`);
    logger.info('========================================');

    // 處理優雅關閉
    setupGracefulShutdown(dbService, mqttService, wsService, httpServer);

  } catch (error: any) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

/**
 * 設置優雅關閉
 */
function setupGracefulShutdown(
  dbService: DatabaseService,
  mqttService: MqttService,
  wsService: WebSocketService,
  httpServer?: HttpServer
) {
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);

    try {
      // 關閉 WebSocket 服務器
      logger.info('Closing WebSocket server...');
      await wsService.close();

      // 關閉 HTTP 服務器 (停止接受新請求)
      if (httpServer) {
        logger.info('Closing HTTP server...');
        await new Promise<void>((resolve, reject) => {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      logger.info('Closing MQTT connection...');
      await mqttService.disconnect();

      logger.info('Closing database connection...');
      await dbService.close();

      logger.info('✅ Shutdown complete');
      process.exit(0);
    } catch (error: any) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    shutdown('UNHANDLED_REJECTION');
  });
}

// 啟動服務器
main();
