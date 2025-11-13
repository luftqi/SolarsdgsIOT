// =================================================================
// MQTT Data Parser Service - Converted from Node-RED
// 數據解析器 V8.1 - TypeScript 版本
//
// Original: Node-RED Function node "數據解析器" (303 lines)
// Node ID: 586ca0706858a41b
//
// Purpose: Parse MQTT power data with Factor correction
// Input: MQTT topic solar/{device_id}/data
// Output: Chart data, SQL data, UI data
// =================================================================

import { Logger } from '../../utils/logger';
import type {
  FactorConfig,
  ParsedPowerData,
  ChartData,
  RealtimeUiData,
  DataParserResult,
  ParseStats
} from '../../types/power.types';

export class DataParser {
  private readonly logger = new Logger(DataParser.name);

  /**
   * 解析 MQTT 功率數據
   * @param deviceId 設備 ID
   * @param payload MQTT payload (可以是 Buffer 或 string)
   * @param factorConfig Factor 配置（修正係數）
   * @returns 解析結果
   */
  async parse(
    deviceId: string,
    payload: Buffer | string,
    factorConfig: FactorConfig = { factor_a: 1.0, factor_p: 1.0 }
  ): Promise<DataParserResult> {
    this.logger.info('========================================');
    this.logger.info(`設備: ${deviceId}`);
    this.logger.info(`Factor 配置: A=${factorConfig.factor_a}, P=${factorConfig.factor_p}`);
    this.logger.info('========================================');

    // === 步驟 1: 轉換 payload 為字串 ===
    let rawData: string;

    if (Buffer.isBuffer(payload)) {
      rawData = payload.toString('utf-8');
    } else if (typeof payload === 'string') {
      rawData = payload;
    } else {
      rawData = String(payload);
    }

    // === 步驟 2: 清理數據 ===
    const cleanData = rawData.replace(/["\s]/g, '').trim();
    const finalData = cleanData.endsWith(',') ? cleanData.slice(0, -1) : cleanData;

    this.logger.info(`原始數據: ${rawData.substring(0, 100)}...`);
    this.logger.info(`清理後: ${finalData.substring(0, 100)}...`);

    // === 步驟 3: 分割批量數據 ===
    const dataEntries = finalData.includes(',')
      ? finalData.split(',').filter(s => s.trim().length > 0)
      : [finalData];

    this.logger.info(`數據條數: ${dataEntries.length}`);

    if (dataEntries.length === 0) {
      this.logger.error('無有效數據');
      return {
        chartData: null,
        sqlData: null,
        uiData: null,
        stats: { total: 0, processed: 0, errors: 0 }
      };
    }

    // === 步驟 4: 解析每條數據 ===
    const parsedData: ParsedPowerData[] = [];
    const errors: string[] = [];
    let latestData: ParsedPowerData | null = null;

    for (let i = 0; i < dataEntries.length; i++) {
      const entry = dataEntries[i].trim();
      if (!entry) continue;

      try {
        const parsed = this.parseEntry(entry, deviceId, factorConfig, i);
        if (parsed) {
          parsedData.push(parsed);
          latestData = parsed;

          // 詳細日誌（前3條）
          if (i < 3) {
            const pgRaw = parseInt(entry.split('/')[1]) || 0;
            const paRaw = parseInt(entry.split('/')[2]) || 0;
            const ppRaw = parseInt(entry.split('/')[3]) || 0;

            this.logger.info(`[${i}] ${parsed.timestamp}`);
            this.logger.info(`  原始: PG:${pgRaw}W PA:${paRaw}W PP:${ppRaw}W`);
            this.logger.info(`  修正: PG:${parsed.pg}W PA:${parsed.pa}W PP:${parsed.pp}W (A×${factorConfig.factor_a}, P×${factorConfig.factor_p})`);
            this.logger.info(`  效率: PAG:${parsed.pag}% PPG:${parsed.ppg}%`);
          }
        }
      } catch (error: any) {
        errors.push(`[${i}] 異常: ${error.message}`);
      }
    }

    // === 步驟 5: 統計結果 ===
    const stats: ParseStats = {
      total: dataEntries.length,
      processed: parsedData.length,
      errors: errors.length
    };

    this.logger.info('========================================');
    this.logger.info(`處理完成: 成功 ${stats.processed}/${stats.total}`);

    if (errors.length > 0) {
      this.logger.warn(`錯誤數: ${errors.length}`);
      if (errors.length <= 5) {
        errors.forEach(err => this.logger.warn(err));
      }
    }

    if (parsedData.length === 0) {
      this.logger.error('無有效數據可處理');
      return {
        chartData: null,
        sqlData: null,
        uiData: null,
        stats
      };
    }

    // === 步驟 6: 準備輸出 ===
    const chartData: ChartData | null = latestData ? {
      deviceId: latestData.deviceId,
      timestamp: latestData.timestamp,
      unixTimestamp: latestData.unixTimestamp,
      pg: latestData.pg,
      pa: latestData.pa,
      pp: latestData.pp,
      pag: latestData.pag,
      ppg: latestData.ppg
    } : null;

    const uiData: RealtimeUiData | null = latestData ? {
      type: 'realtime',
      device_id: latestData.deviceId,
      online: true,
      lastUpdate: new Date().toLocaleTimeString('zh-TW'),
      pg: latestData.pg,
      pa: latestData.pa,
      pp: latestData.pp,
      pag: latestData.pag,
      ppg: latestData.ppg,
      timestamp: latestData.timestamp
    } : null;

    this.logger.info('✅ 三輸出準備完成（已應用 Factor）');
    this.logger.info('========================================');

    return {
      chartData,
      sqlData: parsedData,
      uiData,
      stats
    };
  }

  /**
   * 解析單條數據
   */
  private parseEntry(
    entry: string,
    deviceId: string,
    factorConfig: FactorConfig,
    _index: number
  ): ParsedPowerData | null {
    // 分割數據：timestamp/pg/pa/pp[/pag/ppg]
    const parts = entry.split('/');

    if (parts.length !== 6 && parts.length !== 4) {
      throw new Error(`格式錯誤: ${parts.length}個部分`);
    }

    // === 解析時間戳 ===
    const timeParts = parts[0].split('_');
    if (timeParts.length !== 6) {
      throw new Error(`時間格式錯誤: ${parts[0]}`);
    }

    const [year, month, day, hour, minute, second] = timeParts.map(Number);

    // 驗證時間範圍
    if (
      year < 2020 || year > 2030 ||
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      hour < 0 || hour > 23 ||
      minute < 0 || minute > 59 ||
      second < 0 || second > 59
    ) {
      throw new Error(`時間值不合理: ${parts[0]}`);
    }

    // 創建 Date 對象
    const timestamp = new Date(year, month - 1, day, hour, minute, second);

    if (isNaN(timestamp.getTime())) {
      throw new Error(`無效日期: ${parts[0]}`);
    }

    // SQL 格式時間戳
    const sqlTimestamp = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    // Unix 毫秒時間戳
    const unixTimestamp = timestamp.getTime();

    // === 解析功率值並應用 Factor ===
    const pgRaw = parseInt(parts[1]) || 0;
    const paRaw = parseInt(parts[2]) || 0;
    const ppRaw = parseInt(parts[3]) || 0;

    // 應用 Factor 修正
    const pg = pgRaw;  // PG 保持原值（發電功率不修正）
    const pa = Math.round(paRaw * factorConfig.factor_a);  // PA 乘以 factor_a
    const pp = Math.round(ppRaw * factorConfig.factor_p);  // PP 乘以 factor_p

    // 驗證功率值範圍
    if (pg < 0 || pg > 10000 || pa < 0 || pa > 10000 || pp < 0 || pp > 10000) {
      throw new Error('功率超出範圍');
    }

    // === 計算效率（使用修正後的值）===
    const pag = pg > 0 ? ((pa - pg) * 100 / pg) : 0;
    const ppg = pg > 0 ? ((pp - pg) * 100 / pg) : 0;

    // 四捨五入到2位小數
    const pagRounded = Math.round(pag * 100) / 100;
    const ppgRounded = Math.round(ppg * 100) / 100;

    return {
      deviceId,
      timestamp: sqlTimestamp,
      unixTimestamp,
      pg,
      pa,
      pp,
      pag: pagRounded,
      ppg: ppgRounded
    };
  }
}
