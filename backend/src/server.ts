// =================================================================
// Backend Server Entry Point
// 後端服務入口
//
// Purpose: Initialize and start all services
// - Database connection
// - MQTT service
// - Express API server
// - WebSocket server (future)
// =================================================================

import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { DatabaseService } from './services/database/DatabaseService';
import { PowerDataRepository } from './services/database/PowerDataRepository';
import { GpsLocationRepository } from './services/database/GpsLocationRepository';
import { MqttService } from './services/mqtt/MqttService';

// 載入環境變數
dotenv.config();

const logger = new Logger('Server');

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

    // === 5. TODO: 初始化 Express API 服務器 ===
    // const expressApp = createExpressApp();
    // const PORT = parseInt(process.env.PORT || '3000');
    // expressApp.listen(PORT, () => {
    //   logger.info(`Express API server listening on port ${PORT}`);
    // });

    // === 6. TODO: 初始化 WebSocket 服務器 ===
    // const wsService = new WebSocketService();
    // wsService.start();

    logger.info('========================================');
    logger.info('✅ SolarSDGs IoT Backend Started Successfully');
    logger.info('========================================');
    logger.info('Services running:');
    logger.info('  - PostgreSQL: Connected');
    logger.info('  - MQTT: Connected (solar/+/data, solar/+/gps)');
    logger.info('  - Express API: TODO');
    logger.info('  - WebSocket: TODO');
    logger.info('========================================');

    // 處理優雅關閉
    setupGracefulShutdown(dbService, mqttService);

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
  mqttService: MqttService
) {
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);

    try {
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
