/**
 * 404 Not Found Middleware
 *
 * 處理所有未定義的路由
 */

import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

/**
 * 404 錯誤處理器
 *
 * 當請求的路由不存在時，拋出 NotFoundError
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new NotFoundError(`Route ${req.path}`));
}
