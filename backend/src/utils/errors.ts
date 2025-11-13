/**
 * 自訂錯誤類別
 *
 * 統一的錯誤處理機制
 */

/**
 * 應用程式錯誤基類
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true
  ) {
    super(message);

    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found 錯誤
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 400 Bad Request 錯誤
 */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized 錯誤
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden 錯誤
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 409 Conflict 錯誤
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity 錯誤 (驗證失敗)
 */
export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(422, message);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, message, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable 錯誤
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, `${service} is currently unavailable`);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}
