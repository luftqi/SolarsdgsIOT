/**
 * Timezone Utilities
 *
 * 根據 GPS 座標自動推算時區
 */

import tzlookup from 'tz-lookup';
import { Logger } from './logger';

const logger = new Logger('TimezoneUtils');

/**
 * 根據經緯度推算時區
 * @param latitude 緯度
 * @param longitude 經度
 * @returns 時區字串 (例如: 'Asia/Taipei')
 */
export function getTimezoneFromCoordinates(
  latitude: number,
  longitude: number
): string {
  try {
    // 驗證座標範圍
    if (latitude < -90 || latitude > 90) {
      logger.warn(`Invalid latitude: ${latitude}, using UTC`);
      return 'UTC';
    }

    if (longitude < -180 || longitude > 180) {
      logger.warn(`Invalid longitude: ${longitude}, using UTC`);
      return 'UTC';
    }

    // 使用 tz-lookup 推算時區
    const timezone = tzlookup(latitude, longitude);

    logger.info(`Timezone calculated: (${latitude}, ${longitude}) → ${timezone}`);
    return timezone;
  } catch (error: any) {
    logger.error(`Failed to calculate timezone for (${latitude}, ${longitude}):`, error);
    return 'UTC';  // 失敗時使用 UTC
  }
}

/**
 * 驗證時區字串是否有效
 * @param timezone 時區字串
 * @returns 是否有效
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // 嘗試創建一個 Date 並使用該時區格式化
    new Date().toLocaleString('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * 獲取時區的 UTC offset (小時)
 * @param timezone 時區字串
 * @returns UTC offset (例如: 8 表示 UTC+8)
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    return offsetMs / (1000 * 60 * 60);  // 轉換為小時
  } catch {
    return 0;  // UTC
  }
}
