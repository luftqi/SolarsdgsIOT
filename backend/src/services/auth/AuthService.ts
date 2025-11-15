// =================================================================
// Auth Service - Phase 2.1
// 認證服務 (100% 對應 Node-RED 登入流程)
// =================================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../../utils/logger';
import type { CustomerRepository } from '../database/CustomerRepository';
import type {
  LoginRequest,
  LoginResponse,
  CustomerDTO,
  JwtPayload,
  CreateCustomerRequest,
  Customer
} from '../../types/customer.types';

export class AuthService {
  private readonly logger = new Logger('AuthService');
  private readonly jwtSecret: string;

  constructor(private readonly customerRepo: CustomerRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'solarsdgs-secret-2025';

    if (!process.env.JWT_SECRET) {
      this.logger.warn('⚠️ JWT_SECRET not set, using default (insecure for production)');
    }
  }

  /**
   * Node-RED 登入流程 (4 個 Function 節點)
   * 1. "UI→SQL (登入)": 查詢 customer
   * 2. "驗證密碼": 比對密碼
   * 3. "記錄登入": 更新 last_login 和 login_count
   * 4. 回傳: { success: true, customer, devices, token }
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info(`Login attempt: ${request.username}`);

    try {
      // Step 1: Node-RED "UI→SQL (登入)"
      const customer = await this.customerRepo.findByCustomerCode(request.username);

      if (!customer) {
        this.logger.warn(`Login failed: User not found - ${request.username}`);
        return {
          success: false,
          message: '帳號或密碼錯誤'
        };
      }

      // Step 2: Node-RED "驗證密碼"
      const isPasswordValid = await this.verifyPassword(request.password, customer.password);

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password - ${request.username}`);
        return {
          success: false,
          message: '帳號或密碼錯誤'
        };
      }

      // Step 3: Node-RED "記錄登入"
      await this.customerRepo.updateLoginRecord(customer.id);

      // Step 4: 生成 JWT Token (取代 Node-RED 的 Session)
      const token = this.generateToken(customer);

      // 轉換為 DTO (不包含密碼)
      const customerDTO = this.toCustomerDTO(customer);

      this.logger.info(`Login successful: ${customer.customer_name} (ID: ${customer.id})`);

      return {
        success: true,
        message: '登入成功',
        customer: customerDTO,
        devices: customer.devices,
        token
      };

    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        message: '登入失敗，請稍後再試'
      };
    }
  }

  /**
   * 驗證 JWT Token
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn('Invalid token');
      } else {
        this.logger.error('Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(oldToken: string): Promise<string | null> {
    const payload = await this.verifyToken(oldToken);

    if (!payload) {
      return null;
    }

    // 重新查詢用戶以獲取最新資料
    const customer = await this.customerRepo.findById(payload.customerId);

    if (!customer || !customer.active) {
      return null;
    }

    // 生成新 Token
    return this.generateToken(customer);
  }

  /**
   * 創建新客戶（含密碼 hash）
   */
  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    this.logger.info(`Creating customer: ${request.customerCode}`);

    // 檢查 customer_code 是否已存在
    const exists = await this.customerRepo.existsByCustomerCode(request.customerCode);
    if (exists) {
      throw new Error(`Customer code '${request.customerCode}' already exists`);
    }

    // Hash 密碼
    const hashedPassword = await this.hashPassword(request.password);

    // 創建客戶
    const customer = await this.customerRepo.create({
      ...request,
      password: hashedPassword
    });

    this.logger.info(`Customer created: ${customer.customer_name} (ID: ${customer.id})`);
    return customer;
  }

  /**
   * 更新客戶密碼
   */
  async updatePassword(customerId: number, newPassword: string): Promise<void> {
    this.logger.info(`Updating password for customer ID: ${customerId}`);

    const hashedPassword = await this.hashPassword(newPassword);

    await this.customerRepo.update(customerId, {
      password: hashedPassword
    });

    this.logger.info(`Password updated for customer ID: ${customerId}`);
  }

  /**
   * Hash 密碼 (bcrypt)
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 驗證密碼
   * @param plainPassword 明文密碼
   * @param hashedPassword bcrypt hash
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // 檢查是否為舊的明文密碼（向下相容 Node-RED）
      if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$')) {
        this.logger.warn('⚠️ Plaintext password detected (legacy Node-RED format)');
        // 明文比對（僅用於遷移期間）
        return plainPassword === hashedPassword;
      }

      // bcrypt 驗證
      return await bcrypt.compare(plainPassword, hashedPassword);

    } catch (error) {
      this.logger.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(customer: Customer): string {
    const payload: JwtPayload = {
      customerId: customer.id,
      customerCode: customer.customer_code,
      customerName: customer.customer_name,
      devices: customer.devices
    };

    // Token 有效期: 7 天（可通過環境變數 JWT_EXPIRES_IN 設置）
    // @ts-expect-error - jsonwebtoken 的類型定義問題，expiresIn 應該接受 string
    return jwt.sign(payload, this.jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  }

  /**
   * 轉換為 CustomerDTO (移除敏感資料)
   */
  private toCustomerDTO(customer: Customer): CustomerDTO {
    return {
      id: customer.id,
      customerCode: customer.customer_code,
      customerName: customer.customer_name,
      devices: customer.devices,
      active: customer.active,
      lastLogin: customer.last_login ? customer.last_login.toISOString() : null,
      loginCount: customer.login_count
    };
  }
}
