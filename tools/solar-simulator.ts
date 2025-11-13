// =================================================================
// Solar Power IoT Simulator - Enhanced Version
// 太陽能發電 IoT 模擬器 - 增強版
//
// Purpose: 模擬真實太陽能設備，透過 MQTT 發送功率數據到 VPS
// Usage: npx ts-node tools/solar-simulator.ts
// =================================================================

import * as mqtt from 'mqtt';

// =================================================================
// 配置
// =================================================================

interface SimulatorConfig {
  deviceId: string;
  mqttBroker: string;
  mqttTopic: string;
  dataInterval: number;      // 秒
  gpsInterval: number;        // 秒
  enableGps: boolean;
  enableLogs: boolean;
}

const config: SimulatorConfig = {
  deviceId: '6001',
  mqttBroker: 'mqtt://72.61.117.219:1883',  // VPS MQTT Broker
  mqttTopic: 'SOLARSDGS',
  dataInterval: 5,           // 每 5 秒發送一次功率數據
  gpsInterval: 60,           // 每 60 秒發送一次 GPS 數據
  enableGps: true,
  enableLogs: true
};

// =================================================================
// 太陽能功率數據生成器
// =================================================================

class SolarPowerGenerator {
  private currentTime: Date;
  private baseGeneration: number = 2000;  // 2000W 基礎發電功率

  constructor() {
    this.currentTime = new Date();
  }

  /**
   * 生成逼真的太陽能發電數據
   * 考慮因素：時間、天氣、隨機波動
   */
  generatePowerData(): { pg: number; pa: number; pp: number } {
    const hour = this.currentTime.getHours();
    const minute = this.currentTime.getMinutes();

    // 計算太陽能發電效率（0-1）
    let solarEfficiency = 0;

    if (hour >= 6 && hour <= 18) {
      // 白天：模擬太陽軌跡（拋物線）
      const dayProgress = (hour - 6) + minute / 60;  // 0-12
      const peak = 6;  // 中午 12 點最高
      solarEfficiency = 1 - Math.pow((dayProgress - peak) / peak, 2);
      solarEfficiency = Math.max(0, solarEfficiency) * 0.9;  // 最高 90% 效率
    }

    // 添加隨機波動（雲層、天氣變化）
    const weatherFactor = 0.85 + Math.random() * 0.15;  // 85%-100%
    solarEfficiency *= weatherFactor;

    // 計算發電功率 PG
    const pg = Math.round(this.baseGeneration * solarEfficiency);

    // 負載 A 功率（PA）：輕度負載
    // PA = PG + 額外消耗（LED 照明、監控設備）
    const loadA = Math.round(50 + Math.random() * 100);  // 50-150W
    const pa = pg + loadA;

    // 負載 P 功率（PP）：重度負載
    // PP = PG + 額外消耗（水泵、冷卻系統）
    const loadP = Math.round(200 + Math.random() * 300);  // 200-500W
    const pp = pg + loadP;

    return { pg, pa, pp };
  }

  /**
   * 格式化時間戳為 Node-RED 格式
   * 格式: YYYY_MM_DD_HH_MM_SS
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}_${month}_${day}_${hour}_${minute}_${second}`;
  }

  /**
   * 生成 MQTT 消息字串
   * 格式: YYYY_MM_DD_HH_MM_SS/pg/pa/pp
   */
  generateMessage(): string {
    const { pg, pa, pp } = this.generatePowerData();
    const timestamp = this.formatTimestamp(this.currentTime);

    // 時間前進 1 秒
    this.currentTime = new Date(this.currentTime.getTime() + 1000);

    return `${timestamp}/${pg}/${pa}/${pp}`;
  }

  /**
   * 獲取當前功率數據（用於日誌）
   */
  getCurrentPowerInfo(): string {
    const { pg, pa, pp } = this.generatePowerData();
    const hour = this.currentTime.getHours();
    const minute = this.currentTime.getMinutes();

    return `[${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}] PG=${pg}W, PA=${pa}W, PP=${pp}W`;
  }
}

// =================================================================
// GPS 數據生成器
// =================================================================

class GpsDataGenerator {
  // 台灣台北地區座標（可修改為您的實際位置）
  private baseLatitude: number = 25.0330;    // 台北市緯度
  private baseLongitude: number = 121.5654;  // 台北市經度
  private baseAltitude: number = 50;         // 海拔 50 公尺

  /**
   * 生成 GPS 數據（模擬微小移動）
   */
  generateGpsData(): { latitude: number; longitude: number; altitude: number; satellites: number } {
    // 添加微小的隨機偏移（模擬設備輕微移動）
    const latOffset = (Math.random() - 0.5) * 0.0001;  // ±0.00005 度 (約 ±5 公尺)
    const lonOffset = (Math.random() - 0.5) * 0.0001;
    const altOffset = (Math.random() - 0.5) * 2;       // ±1 公尺

    return {
      latitude: this.baseLatitude + latOffset,
      longitude: this.baseLongitude + lonOffset,
      altitude: this.baseAltitude + altOffset,
      satellites: 8 + Math.floor(Math.random() * 5)    // 8-12 顆衛星
    };
  }

  /**
   * 生成 MQTT 消息字串
   * 格式: deviceId,latitude,longitude,altitude,satellites
   */
  generateMessage(deviceId: string): string {
    const { latitude, longitude, altitude, satellites } = this.generateGpsData();

    return `${deviceId},${latitude.toFixed(8)},${longitude.toFixed(8)},${altitude.toFixed(2)},${satellites}`;
  }
}

// =================================================================
// IoT 模擬器主程式
// =================================================================

class IoTSimulator {
  private client: mqtt.MqttClient | null = null;
  private powerGenerator: SolarPowerGenerator;
  private gpsGenerator: GpsDataGenerator;
  private powerIntervalId: NodeJS.Timeout | null = null;
  private gpsIntervalId: NodeJS.Timeout | null = null;
  private messageCount: number = 0;

  constructor() {
    this.powerGenerator = new SolarPowerGenerator();
    this.gpsGenerator = new GpsDataGenerator();
  }

  /**
   * 連接到 MQTT Broker
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(`正在連接到 MQTT Broker: ${config.mqttBroker}`);

      this.client = mqtt.connect(config.mqttBroker, {
        clientId: `solar_simulator_${config.deviceId}_${Date.now()}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000
      });

      this.client.on('connect', () => {
        this.log('✅ MQTT 連接成功！');
        this.log(`設備 ID: ${config.deviceId}`);
        this.log(`發送主題: ${config.mqttTopic}`);
        this.log(`數據間隔: ${config.dataInterval} 秒`);
        console.log('─'.repeat(60));
        resolve();
      });

      this.client.on('error', (error) => {
        this.log(`❌ MQTT 連接錯誤: ${error.message}`);
        reject(error);
      });

      this.client.on('close', () => {
        this.log('⚠️  MQTT 連接關閉');
      });

      this.client.on('reconnect', () => {
        this.log('🔄 正在重新連接...');
      });
    });
  }

  /**
   * 發送功率數據
   */
  private sendPowerData(): void {
    if (!this.client || !this.client.connected) {
      this.log('❌ MQTT 未連接，跳過發送');
      return;
    }

    const message = this.powerGenerator.generateMessage();

    this.client.publish(config.mqttTopic, message, { qos: 1 }, (error) => {
      if (error) {
        this.log(`❌ 發送失敗: ${error.message}`);
      } else {
        this.messageCount++;
        const powerInfo = this.powerGenerator.getCurrentPowerInfo();
        this.log(`📤 [${this.messageCount}] ${powerInfo}`);
      }
    });
  }

  /**
   * 發送 GPS 數據
   */
  private sendGpsData(): void {
    if (!this.client || !this.client.connected) {
      return;
    }

    const message = this.gpsGenerator.generateMessage(config.deviceId);
    const topic = `${config.mqttTopic}/gps`;

    this.client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        this.log(`❌ GPS 發送失敗: ${error.message}`);
      } else {
        this.log(`📍 GPS 數據已發送`);
      }
    });
  }

  /**
   * 開始模擬
   */
  start(): void {
    // 發送功率數據
    this.sendPowerData();  // 立即發送第一筆
    this.powerIntervalId = setInterval(() => {
      this.sendPowerData();
    }, config.dataInterval * 1000);

    // 發送 GPS 數據（如果啟用）
    if (config.enableGps) {
      this.sendGpsData();  // 立即發送第一筆
      this.gpsIntervalId = setInterval(() => {
        this.sendGpsData();
      }, config.gpsInterval * 1000);
    }

    this.log('🚀 模擬器已啟動！按 Ctrl+C 停止...\n');
  }

  /**
   * 停止模擬
   */
  stop(): void {
    this.log('\n⏹️  正在停止模擬器...');

    if (this.powerIntervalId) {
      clearInterval(this.powerIntervalId);
    }

    if (this.gpsIntervalId) {
      clearInterval(this.gpsIntervalId);
    }

    if (this.client) {
      this.client.end();
    }

    this.log(`✅ 模擬器已停止。總共發送 ${this.messageCount} 筆功率數據。`);
    process.exit(0);
  }

  /**
   * 日誌輸出
   */
  private log(message: string): void {
    if (config.enableLogs) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.log(`[${timestamp}] ${message}`);
    }
  }
}

// =================================================================
// 主程式
// =================================================================

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       SolarSDGs IoT 模擬器 - 太陽能發電數據生成器        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const simulator = new IoTSimulator();

  // 捕獲 Ctrl+C 停止信號
  process.on('SIGINT', () => {
    simulator.stop();
  });

  try {
    await simulator.connect();
    simulator.start();
  } catch (error: any) {
    console.error(`❌ 啟動失敗: ${error.message}`);
    process.exit(1);
  }
}

// 執行
main();
