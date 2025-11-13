// =================================================================
// Logger Utility - Production-ready logging
// 日誌工具
// =================================================================

export class Logger {
  constructor(private readonly context: string) {}

  info(message: string): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`);
    if (error) {
      console.error(error);
    }
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`);
    }
  }
}
