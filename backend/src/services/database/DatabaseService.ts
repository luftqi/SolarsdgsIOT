// =================================================================
// Database Service - PostgreSQL Connection Management
// 資料庫服務
// =================================================================

import { Pool, PoolConfig } from 'pg';
import { Logger } from '../../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  private constructor() {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'solar_db',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'your_password',
      max: 20,                    // 最大連接數
      idleTimeoutMillis: 30000,  // 閒置超時
      connectionTimeoutMillis: 2000, // 連接超時
    };

    this.pool = new Pool(config);

    // 錯誤處理
    this.pool.on('error', (err) => {
      this.logger.error('PostgreSQL pool error', err);
    });

    // 連接事件
    this.pool.on('connect', () => {
      this.logger.info('New database connection established');
    });

    this.logger.info(`Database connection pool initialized (${config.host}:${config.port}/${config.database})`);
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 獲取連接池
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * 測試資料庫連接
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT version(), current_database();');
      this.logger.info(`Database connected: ${result.rows[0].current_database}`);
      this.logger.info(`PostgreSQL version: ${result.rows[0].version}`);
      return true;
    } catch (error: any) {
      this.logger.error('Database connection test failed', error);
      return false;
    }
  }

  /**
   * 關閉連接池
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('Database connection pool closed');
    } catch (error: any) {
      this.logger.error('Error closing database pool', error);
      throw error;
    }
  }

  /**
   * 執行資料庫遷移
   */
  async runMigration(sqlFilePath: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    try {
      const sql = fs.readFileSync(path.resolve(sqlFilePath), 'utf-8');
      await this.pool.query(sql);
      this.logger.info(`Migration executed: ${sqlFilePath}`);
    } catch (error: any) {
      this.logger.error(`Migration failed: ${sqlFilePath}`, error);
      throw error;
    }
  }

  /**
   * 列出所有資料表
   */
  async listTables(): Promise<string[]> {
    try {
      const result = await this.pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      return result.rows.map(row => row.table_name);
    } catch (error: any) {
      this.logger.error('Failed to list tables', error);
      throw error;
    }
  }
}
