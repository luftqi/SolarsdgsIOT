// =================================================================
// Auth Controller - Phase 2.1
// 認證路由控制器
// =================================================================

import { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import type { AuthService } from '../services/auth/AuthService';
import type { LoginRequest, CreateCustomerRequest } from '../types/customer.types';

export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * 登入端點（對應 Node-RED Dashboard 登入頁面）
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginRequest: LoginRequest = req.body;

      // 驗證輸入
      if (!loginRequest.username || !loginRequest.password) {
        res.status(400).json({
          success: false,
          message: '請輸入帳號和密碼'
        });
        return;
      }

      // 執行登入
      const result = await this.authService.login(loginRequest);

      // 回傳結果
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }

    } catch (error) {
      this.logger.error('Login endpoint error:', error);
      res.status(500).json({
        success: false,
        message: '登入失敗，請稍後再試'
      });
    }
  };

  /**
   * POST /api/auth/verify
   * 驗證 Token 是否有效
   */
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          valid: false,
          message: 'No token provided'
        });
        return;
      }

      const payload = await this.authService.verifyToken(token);

      if (payload) {
        res.status(200).json({
          valid: true,
          payload
        });
      } else {
        res.status(401).json({
          valid: false,
          message: 'Invalid or expired token'
        });
      }

    } catch (error) {
      this.logger.error('Verify token endpoint error:', error);
      res.status(500).json({
        valid: false,
        message: 'Token verification failed'
      });
    }
  };

  /**
   * POST /api/auth/refresh
   * 刷新 Token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const oldToken = req.headers.authorization?.replace('Bearer ', '');

      if (!oldToken) {
        res.status(401).json({
          success: false,
          message: 'No token provided'
        });
        return;
      }

      const newToken = await this.authService.refreshToken(oldToken);

      if (newToken) {
        res.status(200).json({
          success: true,
          token: newToken
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Failed to refresh token'
        });
      }

    } catch (error) {
      this.logger.error('Refresh token endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  };

  /**
   * POST /api/auth/register
   * 創建新客戶（僅供管理員使用，需要 JWT 驗證）
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const createRequest: CreateCustomerRequest = req.body;

      // 驗證輸入
      if (!createRequest.customerCode || !createRequest.customerName || !createRequest.password) {
        res.status(400).json({
          success: false,
          message: '請提供完整的客戶資料'
        });
        return;
      }

      // 創建客戶
      const customer = await this.authService.createCustomer(createRequest);

      res.status(201).json({
        success: true,
        message: '客戶創建成功',
        customer: {
          id: customer.id,
          customerCode: customer.customer_code,
          customerName: customer.customer_name,
          devices: customer.devices,
          active: customer.active
        }
      });

    } catch (error: any) {
      this.logger.error('Register endpoint error:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '客戶創建失敗'
        });
      }
    }
  };

  /**
   * POST /api/auth/change-password
   * 更改密碼（需要 JWT 驗證）
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, newPassword } = req.body;

      if (!customerId || !newPassword) {
        res.status(400).json({
          success: false,
          message: '請提供客戶 ID 和新密碼'
        });
        return;
      }

      await this.authService.updatePassword(customerId, newPassword);

      res.status(200).json({
        success: true,
        message: '密碼更新成功'
      });

    } catch (error) {
      this.logger.error('Change password endpoint error:', error);
      res.status(500).json({
        success: false,
        message: '密碼更新失敗'
      });
    }
  };
}
