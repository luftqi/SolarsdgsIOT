// =================================================================
// Customer Repository - Phase 2.1
// 客戶資料存取層 (100% 對應 Node-RED flows.json)
// =================================================================

import { Pool } from 'pg';
import { Logger } from '../../utils/logger';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest
} from '../../types/customer.types';

export class CustomerRepository {
  private readonly logger = new Logger('CustomerRepository');

  constructor(private readonly pool: Pool) {}

  /**
   * Node-RED: "UI→SQL (登入)"
   * 根據 customer_code 查詢客戶（僅限 active 用戶）
   */
  async findByCustomerCode(customerCode: string): Promise<Customer | null> {
    this.logger.debug(`Finding customer by code: ${customerCode}`);

    const query = `
      SELECT
        id, customer_code, customer_name, password,
        devices, active, created_at, last_login, login_count
      FROM customers
      WHERE customer_code = $1 AND active = true
    `;

    try {
      const result = await this.pool.query(query, [customerCode]);

      if (result.rows.length === 0) {
        this.logger.debug(`Customer not found: ${customerCode}`);
        return null;
      }

      const customer = this.mapRowToCustomer(result.rows[0]);
      this.logger.info(`Customer found: ${customer.customer_name} (ID: ${customer.id})`);
      return customer;

    } catch (error) {
      this.logger.error(`Failed to find customer by code: ${customerCode}`, error);
      throw error;
    }
  }

  /**
   * Node-RED: "記錄登入"
   * 更新登入記錄：last_login 時間 + login_count 計數
   */
  async updateLoginRecord(customerId: number): Promise<void> {
    this.logger.debug(`Updating login record for customer ID: ${customerId}`);

    const query = `
      UPDATE customers
      SET
        last_login = NOW(),
        login_count = login_count + 1
      WHERE id = $1
    `;

    try {
      await this.pool.query(query, [customerId]);
      this.logger.info(`Login record updated for customer ID: ${customerId}`);

    } catch (error) {
      this.logger.error(`Failed to update login record for customer ID: ${customerId}`, error);
      throw error;
    }
  }

  /**
   * 查詢所有客戶（用於客戶管理頁面）
   */
  async findAll(): Promise<Customer[]> {
    this.logger.debug('Finding all customers');

    const query = `
      SELECT
        id, customer_code, customer_name, password,
        devices, active, created_at, last_login, login_count
      FROM customers
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.pool.query(query);
      const customers = result.rows.map(row => this.mapRowToCustomer(row));
      this.logger.info(`Found ${customers.length} customers`);
      return customers;

    } catch (error) {
      this.logger.error('Failed to find all customers', error);
      throw error;
    }
  }

  /**
   * 根據 ID 查詢客戶
   */
  async findById(id: number): Promise<Customer | null> {
    this.logger.debug(`Finding customer by ID: ${id}`);

    const query = `
      SELECT
        id, customer_code, customer_name, password,
        devices, active, created_at, last_login, login_count
      FROM customers
      WHERE id = $1
    `;

    try {
      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        this.logger.debug(`Customer not found: ID ${id}`);
        return null;
      }

      return this.mapRowToCustomer(result.rows[0]);

    } catch (error) {
      this.logger.error(`Failed to find customer by ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 創建新客戶
   */
  async create(data: CreateCustomerRequest): Promise<Customer> {
    this.logger.debug(`Creating customer: ${data.customerCode}`);

    const query = `
      INSERT INTO customers (
        customer_code, customer_name, password, devices, active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id, customer_code, customer_name, password,
        devices, active, created_at, last_login, login_count
    `;

    try {
      const result = await this.pool.query(query, [
        data.customerCode,
        data.customerName,
        data.password, // ⚠️ 應該已經被 bcrypt hash
        data.devices || [],
        data.active !== undefined ? data.active : true
      ]);

      const customer = this.mapRowToCustomer(result.rows[0]);
      this.logger.info(`Customer created: ${customer.customer_name} (ID: ${customer.id})`);
      return customer;

    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        this.logger.error(`Customer code already exists: ${data.customerCode}`);
        throw new Error(`Customer code '${data.customerCode}' already exists`);
      }
      this.logger.error(`Failed to create customer: ${data.customerCode}`, error);
      throw error;
    }
  }

  /**
   * 更新客戶資料
   */
  async update(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    this.logger.debug(`Updating customer ID: ${id}`);

    // 動態構建 SQL
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.customerName !== undefined) {
      updates.push(`customer_name = $${paramIndex++}`);
      values.push(data.customerName);
    }

    if (data.password !== undefined) {
      updates.push(`password = $${paramIndex++}`);
      values.push(data.password); // ⚠️ 應該已經被 bcrypt hash
    }

    if (data.devices !== undefined) {
      updates.push(`devices = $${paramIndex++}`);
      values.push(data.devices);
    }

    if (data.active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(data.active);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, customer_code, customer_name, password,
        devices, active, created_at, last_login, login_count
    `;

    try {
      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Customer not found: ID ${id}`);
      }

      const customer = this.mapRowToCustomer(result.rows[0]);
      this.logger.info(`Customer updated: ${customer.customer_name} (ID: ${customer.id})`);
      return customer;

    } catch (error) {
      this.logger.error(`Failed to update customer ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 刪除客戶（軟刪除：設為 inactive）
   */
  async delete(id: number): Promise<void> {
    this.logger.debug(`Deleting (soft) customer ID: ${id}`);

    const query = `
      UPDATE customers
      SET active = false
      WHERE id = $1
    `;

    try {
      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw new Error(`Customer not found: ID ${id}`);
      }

      this.logger.info(`Customer soft-deleted: ID ${id}`);

    } catch (error) {
      this.logger.error(`Failed to delete customer ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 檢查 customer_code 是否已存在
   */
  async existsByCustomerCode(customerCode: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM customers WHERE customer_code = $1
      ) as exists
    `;

    try {
      const result = await this.pool.query(query, [customerCode]);
      return result.rows[0].exists;

    } catch (error) {
      this.logger.error(`Failed to check customer code existence: ${customerCode}`, error);
      throw error;
    }
  }

  /**
   * 將資料庫 row 映射為 Customer 物件
   */
  private mapRowToCustomer(row: any): Customer {
    return {
      id: row.id,
      customer_code: row.customer_code,
      customer_name: row.customer_name,
      password: row.password,
      devices: row.devices || [],
      active: row.active,
      created_at: row.created_at,
      last_login: row.last_login,
      login_count: row.login_count
    };
  }
}
