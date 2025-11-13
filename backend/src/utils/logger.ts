// =================================================================
// Logger Utility - Production-ready logging
// 日誌工具
// =================================================================

export class Logger {
  constructor(private readonly context: string) {}

  info(message: string, meta?: any): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`);
    if (meta) {
      console.log(JSON.stringify(meta, null, 2));
    }
  }

  warn(message: string, meta?: any): void {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`);
    if (meta) {
      console.warn(JSON.stringify(meta, null, 2));
    }
  }

  error(message: string, error?: any): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`);
    if (error) {
      console.error(error);
    }
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`);
      if (meta) {
        console.debug(JSON.stringify(meta, null, 2));
      }
    }
  }
}
