// =================================================================
// Database Connection Test Script
// 資料庫連接測試腳本
// =================================================================

import * as dotenv from 'dotenv';
import * as path from 'path';
import { DatabaseService } from '../src/services/database/DatabaseService';
import { Logger } from '../src/utils/logger';

// 載入環境變數
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logger = new Logger('TestDB');

async function testDatabaseConnection() {
  logger.info('========================================');
  logger.info('Testing Database Connection');
  logger.info('========================================');

  try {
    const dbService = DatabaseService.getInstance();

    // 測試連接
    logger.info('Testing connection...');
    const connected = await dbService.testConnection();

    if (!connected) {
      throw new Error('Connection test failed');
    }

    // 列出資料表
    logger.info('Listing tables...');
    const tables = await dbService.listTables();

    logger.info(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      logger.info(`  - ${table}`);
    });

    // 關閉連接
    await dbService.close();

    logger.info('========================================');
    logger.info('✅ Database connection test successful');
    logger.info('========================================');

    process.exit(0);
  } catch (error: any) {
    logger.error('Database connection test failed', error);
    process.exit(1);
  }
}

testDatabaseConnection();
