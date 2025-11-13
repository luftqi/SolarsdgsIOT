/**
 * UI Formatter Service
 *
 * 從 Node-RED "MQTT->UI轉換" 轉換而來
 * Original Node ID: c75e089718b69008 (148 lines)
 *
 * 功能：格式化即時數據用於前端 Dashboard 顯示
 */

import { Logger } from '../../utils/logger';
import type { ParsedPowerData } from '../../types/power.types';
import type { RealtimeUiData } from '../../types/realtime.types';

export class UiFormatter {
  private readonly logger = new Logger(UiFormatter.name);

  /**
   * 格式化即時數據用於 UI 顯示
   *
   * @param data 解析後的功率數據
   * @param online 設備在線狀態
   * @returns 格式化後的 UI 數據
   */
  formatRealtimeData(
    data: ParsedPowerData,
    online: boolean = true
  ): RealtimeUiData | null {
    this.logger.debug('========================================');

    // ========== 步驟 1: 驗證輸入 ==========
    if (!data) {
      this.logger.warn('❌ 無數據');
      return null;
    }

    // ========== 步驟 2: 驗證必要欄位 ==========
    const requiredFields: (keyof ParsedPowerData)[] = [
      'deviceId', 'pg', 'pa', 'pp', 'pag', 'ppg'
    ];

    const missingFields = requiredFields.filter(
      field => data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      this.logger.warn(`❌ 缺少必要欄位: ${missingFields.join(', ')}`);
      return null;
    }

    // ========== 步驟 3: 提取並驗證數據 ==========
    const deviceId = data.deviceId;
    const pg = Math.round(data.pg || 0);
    const pa = Math.round(data.pa || 0);
    const pp = Math.round(data.pp || 0);
    const pag = parseFloat((data.pag || 0).toFixed(2));
    const ppg = parseFloat((data.ppg || 0).toFixed(2));

    // ========== 步驟 4: 驗證數據範圍 ==========
    // 功率範圍（0-10000W）
    if (pg < 0 || pg > 10000 || pa < 0 || pa > 10000 || pp < 0 || pp > 10000) {
      this.logger.warn(`⚠️ 功率值超出範圍: PG=${pg}, PA=${pa}, PP=${pp}`);
    }

    // 效率範圍（-100% ~ 200%）
    if (pag < -100 || pag > 200 || ppg < -100 || ppg > 200) {
      this.logger.warn(`⚠️ 效率值超出範圍: PAG=${pag}%, PPG=${ppg}%`);
    }

    // ========== 步驟 5: 輸出詳細日誌 ==========
    const now = new Date();
    const lastUpdate = now.toLocaleTimeString('zh-TW');

    this.logger.info(`設備: ${deviceId}`);
    this.logger.info(`時間: ${lastUpdate}`);
    this.logger.info(`狀態: ${online ? '在線' : '離線'}`);
    this.logger.info('----------------------------------------');
    this.logger.info('功率數據:');
    this.logger.info(`  PG (發電): ${pg} W`);
    this.logger.info(`  PA (負載A): ${pa} W`);
    this.logger.info(`  PP (負載P): ${pp} W`);
    this.logger.info('----------------------------------------');
    this.logger.info('效率數據:');
    this.logger.info(`  PAG (負載A效率): ${pag} %`);
    this.logger.info(`  PPG (負載P效率): ${ppg} %`);
    this.logger.info('========================================');

    // ========== 步驟 6: 準備輸出數據 ==========
    const uiData: RealtimeUiData = {
      type: 'realtime',
      device_id: deviceId,
      online: online,
      lastUpdate: lastUpdate,
      pg: pg,
      pa: pa,
      pp: pp,
      pag: pag,
      ppg: ppg,
      timestamp: data.timestamp || now.toISOString(),
    };

    this.logger.debug(`✅ UI 數據已準備完成`);

    return uiData;
  }

  /**
   * 驗證 UI 數據格式
   *
   * @param data UI 數據
   * @returns 是否有效
   */
  validateUiData(data: any): data is RealtimeUiData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const requiredFields = [
      'type', 'device_id', 'online', 'lastUpdate',
      'pg', 'pa', 'pp', 'pag', 'ppg', 'timestamp'
    ];

    return requiredFields.every(field => field in data);
  }
}
