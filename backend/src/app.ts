/**
 * Express 應用程式主檔案
 *
 * 設置所有 middleware、路由和錯誤處理
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from './utils/logger';

// Routes
import deviceRoutes from './routes/device.routes';
import powerDataRoutes from './routes/powerData.routes';
import { createPowerDataRoutes } from './routes/powerDataRoutes';
import gpsRoutes from './routes/gps.routes';
import healthRoutes from './routes/health.routes';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFoundHandler';

const logger = new Logger('App');

/**
 * 建立並配置 Express 應用程式
 */
export function createApp(): Application {
  const app = express();

  // ============================
  // 安全性 & 基礎 Middleware
  // ============================

  // Helmet - 設置安全相關的 HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],  // 允許 fetch/XHR 到同源
      },
    },
  }));

  // CORS - 允許跨域請求
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compression - 壓縮回應
  app.use(compression());

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 靜態檔案服務 (圖片上傳)
  app.use('/uploads', express.static('uploads'));

  // ============================
  // 自訂 Middleware
  // ============================

  // 請求日誌記錄
  app.use(requestLogger);

  // ============================
  // Routes
  // ============================

  // Health Check (系統健康檢查)
  app.use('/api/health', healthRoutes);

  // API Routes
  app.use('/api/devices', deviceRoutes);
  app.use('/api/power-data', powerDataRoutes);
  app.use('/api/power-data', createPowerDataRoutes());  // Phase 2 routes
  app.use('/api/gps', gpsRoutes);

  // Dashboard route
  app.get('/dashboard', (_req: Request, res: Response) => {
    res.sendFile('/app/dashboard.html');
  });

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'SolarSDGs IoT API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        devices: '/api/devices',
        powerData: '/api/power-data',
        gps: '/api/gps',
        dashboard: '/dashboard',
      },
    });
  });

  // ============================
  // 錯誤處理 Middleware
  // ============================

  // 404 Not Found Handler (必須在所有路由之後)
  app.use(notFoundHandler);

  // 全域錯誤處理器 (必須在最後)
  app.use(errorHandler);

  logger.info('Express application configured successfully');

  return app;
}
