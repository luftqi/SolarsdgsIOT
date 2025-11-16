/**
 * Type definitions for tz-lookup
 * tz-lookup 沒有官方 TypeScript 類型定義，這是手動聲明
 */

declare module 'tz-lookup' {
  /**
   * 根據經緯度查找時區
   * @param lat 緯度 (-90 ~ 90)
   * @param lon 經度 (-180 ~ 180)
   * @returns 時區字串 (例如: 'Asia/Taipei')
   */
  function tzlookup(lat: number, lon: number): string;
  export = tzlookup;
}
