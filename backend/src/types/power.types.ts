// =================================================================
// Power Data Types - Converted from Node-RED flows.json
// 功率數據類型定義
// =================================================================

/**
 * 原始功率數據（從 MQTT 接收）
 */
export interface RawPowerData {
  deviceId: string;
  timestamp: string; // 格式: YYYY_MM_DD_HH_MM_SS
  pg: number;        // 發電功率 (Generation Power) in Watts
  pa: number;        // 負載 A 功率 (Load A Power) in Watts
  pp: number;        // 負載 P 功率 (Load P Power) in Watts
  pag?: number;      // 負載 A 效率 (可選，如果數據中包含)
  ppg?: number;      // 負載 P 效率 (可選，如果數據中包含)
}

/**
 * Factor 配置（用於修正 PA/PP 值）
 */
export interface FactorConfig {
  factor_a: number;  // PA 修正係數（預設 1.0）
  factor_p: number;  // PP 修正係數（預設 1.0）
}

/**
 * 解析後的功率數據（準備寫入資料庫）
 */
export interface ParsedPowerData {
  deviceId: string;
  timestamp: string;      // SQL 格式: YYYY-MM-DD HH:MM:SS
  unixTimestamp: number;  // Unix 毫秒時間戳
  pg: number;             // 修正後的 PG (實際上保持原值)
  pa: number;             // 修正後的 PA (pa_raw * factor_a)
  pp: number;             // 修正後的 PP (pp_raw * factor_p)
  pag: number;            // 計算的效率: ((pa - pg) / pg) * 100
  ppg: number;            // 計算的效率: ((pp - pg) / pg) * 100
}

/**
 * 功率數據資料庫記錄
 */
export interface PowerDataRecord {
  id?: number;
  device_id: string;
  timestamp: Date;
  pg: number;
  pa: number;
  pp: number;
  pga_efficiency: number;  // 資料庫欄位名稱
  pgp_efficiency: number;  // 資料庫欄位名稱
  created_at?: Date;
}

/**
 * 批量插入數據
 */
export interface BatchPowerData {
  deviceId: string;
  data: Array<[string, string, number, number, number, number, number]>;
  // [device_id, timestamp, pg, pa, pp, pag, ppg]
}

/**
 * 圖表數據（發送給前端）
 */
export interface ChartData {
  deviceId: string;
  timestamp: string;
  unixTimestamp: number;
  pg: number;
  pa: number;
  pp: number;
  pag: number;
  ppg: number;
}

/**
 * 即時 UI 數據（WebSocket 推送）
 */
export interface RealtimeUiData {
  type: 'realtime';
  device_id: string;
  online: boolean;
  lastUpdate: string;  // 本地時間字串
  pg: number;
  pa: number;
  pp: number;
  pag: number;
  ppg: number;
  timestamp: string;
}

/**
 * 數據解析統計
 */
export interface ParseStats {
  total: number;      // 總數據條數
  processed: number;  // 成功處理的條數
  errors: number;     // 錯誤條數
}

/**
 * 數據解析結果
 */
export interface DataParserResult {
  chartData: ChartData | null;
  sqlData: ParsedPowerData[] | null;
  uiData: RealtimeUiData | null;
  stats: ParseStats;
}
