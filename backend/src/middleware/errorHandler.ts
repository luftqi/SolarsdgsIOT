/**
 * 全域錯誤處理 Middleware
 *
 * 捕獲所有錯誤並返回統一格式的錯誤回應
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { Logger } from '../utils/logger';

const logger = new Logger('ErrorHandler');

/**
 * 錯誤回應介面
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    errors?: any[];
    stack?: string;
  };
}

/**
 * 全域錯誤處理器
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 如果是 AppError，使用其 statusCode
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // 錯誤訊息
  const message = err.message || 'Internal server error';

  // 建立錯誤回應
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // 如果是 ValidationError，包含驗證錯誤詳情
  if (err instanceof ValidationError) {
    errorResponse.error.errors = err.errors;
  }

  // 開發環境下包含 stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // 記錄錯誤
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      error: err,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      path: req.path,
      method: req.method,
    });
  }

  // 返回錯誤回應
  res.status(statusCode).json(errorResponse);
}

/**
 * 非同步路由處理器包裝器
 *
 * 自動捕獲 async 函數中的錯誤並傳遞給錯誤處理器
 *
 * @example
 * router.get('/devices', asyncHandler(async (req, res) => {
 *   const devices = await deviceService.getAll();
 *   res.json(devices);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
