// =================================================================
// Customer Types - Phase 2.1
// 客戶與認證相關的類型定義
// 100% 對應 Node-RED flows.json 中的 customers 資料表
// =================================================================

/**
 * Customer 資料庫模型
 * 對應 PostgreSQL customers 資料表
 */
export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  password: string; // ⚠️ 儲存時使用 bcrypt hash
  devices: string[]; // PostgreSQL TEXT[] 陣列
  active: boolean;
  created_at: Date;
  last_login: Date | null;
  login_count: number;
}

/**
 * 登入請求 DTO
 * 對應 Node-RED Dashboard 登入表單
 */
export interface LoginRequest {
  username: string; // customer_code
  password: string; // 明文密碼
}

/**
 * 登入回應 DTO
 * 對應 Node-RED 登入成功後回傳的資料
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  customer?: CustomerDTO;
  devices?: string[];
  token?: string; // JWT Token (Node-RED 等價於 Session)
}

/**
 * Customer DTO (不含密碼)
 * 對應前端顯示的客戶資料
 */
export interface CustomerDTO {
  id: number;
  customerCode: string;
  customerName: string;
  devices: string[];
  active: boolean;
  lastLogin: string | null;
  loginCount: number;
}

/**
 * JWT Payload
 * Token 中包含的用戶資訊
 */
export interface JwtPayload {
  customerId: number;
  customerCode: string;
  customerName: string;
  devices: string[];
}

/**
 * 創建客戶請求 DTO
 */
export interface CreateCustomerRequest {
  customerCode: string;
  customerName: string;
  password: string;
  devices?: string[];
  active?: boolean;
}

/**
 * 更新客戶請求 DTO
 */
export interface UpdateCustomerRequest {
  customerName?: string;
  password?: string;
  devices?: string[];
  active?: boolean;
}
