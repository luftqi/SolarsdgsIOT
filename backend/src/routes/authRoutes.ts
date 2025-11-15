// =================================================================
// Auth Routes - Phase 2.1
// 認證相關路由
// =================================================================

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import type { AuthService } from '../services/auth/AuthService';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();
  const controller = new AuthController(authService);

  /**
   * POST /api/auth/login
   * 登入端點（公開）
   */
  router.post('/login', controller.login);

  /**
   * POST /api/auth/verify
   * 驗證 Token（需要 Token）
   */
  router.post('/verify', controller.verifyToken);

  /**
   * POST /api/auth/refresh
   * 刷新 Token（需要 Token）
   */
  router.post('/refresh', controller.refreshToken);

  /**
   * POST /api/auth/register
   * 創建新客戶（需要管理員權限）
   * TODO: 添加管理員驗證中間件
   */
  router.post('/register', controller.register);

  /**
   * POST /api/auth/change-password
   * 更改密碼（需要驗證）
   * TODO: 添加 JWT 驗證中間件
   */
  router.post('/change-password', controller.changePassword);

  return router;
}
