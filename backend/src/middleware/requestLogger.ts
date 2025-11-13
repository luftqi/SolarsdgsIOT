/**
 * 請求日誌記錄 Middleware
 *
 * 記錄所有 HTTP 請求的詳細資訊
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('HTTP');

/**
 * 請求日誌記錄器
 *
 * 記錄請求方法、路徑、狀態碼和處理時間
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // 監聽 response 完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logMessage = `${req.method} ${req.path} ${statusCode} ${duration}ms`;

    // 根據狀態碼選擇日誌等級
    if (statusCode >= 500) {
      logger.error(logMessage, {
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        ip: req.ip,
      });
    } else if (statusCode >= 400) {
      logger.warn(logMessage, {
        method: req.method,
        path: req.path,
        statusCode,
        duration,
      });
    } else {
      logger.info(logMessage, {
        method: req.method,
        path: req.path,
        statusCode,
        duration,
      });
    }
  });

  next();
}
