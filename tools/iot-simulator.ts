// =================================================================
// IoT Device Simulator - MQTT Data Generator
// IoT 設備模擬器 - 用於測試與開發
//
// Purpose: Simulate real IoT devices sending power & GPS data via MQTT
// Usage: ts-node tools/iot-simulator.ts [--device=6001] [--interval=10]
// =================================================================

import * as mqtt from 'mqtt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// =================================================================
// 配置
// =================================================================

interface SimulatorConfig {
  deviceId: string;
  brokerUrl: string;
  interval: number;        // 數據發送間隔（秒）
  batchSize: number;       // 每次發送的數據條數
  enableGps: boolean;      // 是否模擬 GPS 數據
  gpsInterval: number;     // GPS 數據發送間隔（秒）
}

const config: SimulatorConfig = {
  deviceId: process.env.DEVICE_ID || '6001',
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  interval: parseInt(process.env.DATA_INTERVAL || '10'),
  batchSize: parseInt(process.env.BATCH_SIZE || '1'),
  enableGps: process.env.ENABLE_GPS !== 'false',
  gpsInterval: parseInt(process.env.GPS_INTERVAL || '60')
};

// =================================================================
// 功率數據生成器（模擬太陽能發電）
// =================================================================

class PowerDataGenerator {
  private baseGeneration = 1500;  // 基礎發電功率 (W)
  private currentTime = new Date();

  /**
   * 生成逼真的功率數據（考慮時間因素）
   */
  generatePowerData(): { pg: number; pa: number; pp: number } {
    const hour = this.currentTime.getHours();
    const minute = this.currentTime.getMinutes();

    // 根據時間計算太陽能發電效率（0-1）
    let solarEfficiency = 0;

    if (hour >= 6 && hour <= 18) {
      // 白天：模擬太陽軌跡（拋物線）
      const dayProgress = (hour - 6) + minute / 60;  // 0-12
      const peak = 6;  // 中午12點最高
      solarEfficiency = 1 - Math.pow((dayProgress - peak) / peak, 2);
      solarEfficiency = Math.max(0, solarEfficiency);
    }

    // 添加隨機波動（雲層、天氣）
    const randomFactor = 0.85 + Math.random() * 0.15;  // 0.85 - 1.0
    solarEfficiency *= randomFactor;

    // 計算發電功率
    const pg = Math.round(this.baseGeneration * solarEfficiency);

    // 負載 A：輕微消耗（LED 照明、監控設備）
    const pa = pg + Math.round(50 + Math.random() * 100);  // PG + 50-150W

    // 負載 P：重度消耗（泵、冷卻系統）
    const pp = pg + Math.round(200 + Math.random() * 300);  // PG + 200-500W

    return { pg, pa, pp };
  }

  /**
   * 生成數據字串（Node-RED 格式）
   * 格式: YYYY_MM_DD_HH_MM_SS/pg/pa/pp
   */
  generateDataString(): string {
    const { pg, pa, pp } = this.generatePowerData();
    const timestamp = this.formatTimestamp(this.currentTime);

    // 每次生成後時間前進
    this.currentTime = new Date(this.currentTime.getTime() + 1000);

    return `${timestamp}/${pg}/${pa}/${pp}`;
  }

  /**
   * 生成批量數據（逗號分隔）
   */
  generateBatchData(count: number): string {
    const dataArray: string[] = [];
    for (let i = 0; i < count; i++) {
      dataArray.push(this.generateDataString());
    }
    return dataArray.join(',');
  }

  /**
   * 格式化時間戳
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
   * 重置時間為當前時間
   */
  resetTime(): void {
    this.currentTime = new Date();
  }
}

// =================================================================
// GPS 數據生成器（模擬移動軌跡）
// =================================================================

class GpsDataGenerator {
  // 台北市中心附近
  private baseLat = 25.033671;
  private baseLon = 121.564427;
  private baseAlt = 100;

  // 移動參數
  private currentLat = this.baseLat;
  private currentLon = this.baseLon;
  private currentAlt = this.baseAlt;
  private velocity = 0.00001;  // 每次移動的度數

  /**
   * 生成 GPS 數據（模擬緩慢移動）
   */
  generateGpsData(): string {
    // 隨機移動方向
    const direction = Math.random() * 2 * Math.PI;
    this.currentLat += Math.sin(direction) * this.velocity;
    this.currentLon += Math.cos(direction) * this.velocity;

    // 高度微調
    this.currentAlt += (Math.random() - 0.5) * 2;

    // 衛星數量（8-12顆）
    const satellites = Math.floor(8 + Math.random() * 5);

    // 格式: "latitude,longitude,altitude,satellites"
    return `${this.currentLat.toFixed(6)},${this.currentLon.toFixed(6)},${this.currentAlt.toFixed(1)},${satellites}`;
  }

  /**
   * 重置位置
   */
  resetPosition(): void {
    this.currentLat = this.baseLat;
    this.currentLon = this.baseLon;
    this.currentAlt = this.baseAlt;
  }
}

// =================================================================
// MQTT 模擬器主類
// =================================================================

class IotSimulator {
  private client: mqtt.MqttClient | null = null;
  private powerGenerator: PowerDataGenerator;
  private gpsGenerator: GpsDataGenerator;
  private dataTimer: NodeJS.Timeout | null = null;
  private gpsTimer: NodeJS.Timeout | null = null;

  constructor(private config: SimulatorConfig) {
    this.powerGenerator = new PowerDataGenerator();
    this.gpsGenerator = new GpsDataGenerator();
  }

  /**
   * 啟動模擬器
   */
  async start(): Promise<void> {
    console.log('========================================');
    console.log('🚀 IoT Device Simulator Starting...');
    console.log('========================================');
    console.log(`Device ID:      ${this.config.deviceId}`);
    console.log(`MQTT Broker:    ${this.config.brokerUrl}`);
    console.log(`Data Interval:  ${this.config.interval}s`);
    console.log(`Batch Size:     ${this.config.batchSize}`);
    console.log(`GPS Enabled:    ${this.config.enableGps}`);
    if (this.config.enableGps) {
      console.log(`GPS Interval:   ${this.config.gpsInterval}s`);
    }
    console.log('========================================\n');

    // 連接 MQTT
    await this.connectMqtt();

    // 啟動數據發送定時器
    this.startDataTimer();

    // 啟動 GPS 定時器（如果啟用）
    if (this.config.enableGps) {
      this.startGpsTimer();
    }

    console.log('✅ Simulator started successfully');
    console.log('Press Ctrl+C to stop\n');
  }

  /**
   * 連接 MQTT Broker
   */
  private async connectMqtt(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to MQTT broker: ${this.config.brokerUrl}...`);

      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: `iot-simulator-${this.config.deviceId}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker\n');
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error.message);
        reject(error);
      });

      this.client.on('close', () => {
        console.log('⚠️  MQTT connection closed');
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Attempting to reconnect...');
      });
    });
  }

  /**
   * 啟動功率數據發送定時器
   */
  private startDataTimer(): void {
    this.dataTimer = setInterval(() => {
      this.sendPowerData();
    }, this.config.interval * 1000);

    // 立即發送一次
    this.sendPowerData();
  }

  /**
   * 啟動 GPS 數據發送定時器
   */
  private startGpsTimer(): void {
    this.gpsTimer = setInterval(() => {
      this.sendGpsData();
    }, this.config.gpsInterval * 1000);

    // 立即發送一次
    setTimeout(() => this.sendGpsData(), 2000);
  }

  /**
   * 發送功率數據
   */
  private sendPowerData(): void {
    if (!this.client) return;

    const topic = `solar/${this.config.deviceId}/data`;
    const data = this.powerGenerator.generateBatchData(this.config.batchSize);

    this.client.publish(topic, data, (error) => {
      if (error) {
        console.error(`❌ Failed to publish power data:`, error.message);
      } else {
        const timestamp = new Date().toLocaleTimeString('zh-TW');
        console.log(`[${timestamp}] 📤 Power data sent: ${topic}`);

        // 顯示第一條數據作為預覽
        const firstData = data.split(',')[0];
        const [time, pg, pa, pp] = firstData.split('/');
        console.log(`   📊 PG: ${pg}W, PA: ${pa}W, PP: ${pp}W`);
      }
    });
  }

  /**
   * 發送 GPS 數據
   */
  private sendGpsData(): void {
    if (!this.client) return;

    const topic = `solar/${this.config.deviceId}/gps`;
    const data = this.gpsGenerator.generateGpsData();

    this.client.publish(topic, data, (error) => {
      if (error) {
        console.error(`❌ Failed to publish GPS data:`, error.message);
      } else {
        const timestamp = new Date().toLocaleTimeString('zh-TW');
        console.log(`[${timestamp}] 📍 GPS data sent: ${topic}`);

        const [lat, lon, alt, sat] = data.split(',');
        console.log(`   🌍 Location: (${lat}, ${lon}), ${alt}m, ${sat} satellites`);
      }
    });
  }

  /**
   * 停止模擬器
   */
  async stop(): Promise<void> {
    console.log('\n========================================');
    console.log('Stopping simulator...');

    if (this.dataTimer) {
      clearInterval(this.dataTimer);
    }

    if (this.gpsTimer) {
      clearInterval(this.gpsTimer);
    }

    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client!.end(false, () => {
          console.log('✅ MQTT client disconnected');
          resolve();
        });
      });
    }

    console.log('========================================');
    console.log('👋 Simulator stopped');
    process.exit(0);
  }
}

// =================================================================
// Main
// =================================================================

async function main() {
  // 解析命令列參數
  process.argv.forEach((arg) => {
    if (arg.startsWith('--device=')) {
      config.deviceId = arg.split('=')[1];
    } else if (arg.startsWith('--interval=')) {
      config.interval = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--batch=')) {
      config.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg === '--no-gps') {
      config.enableGps = false;
    }
  });

  const simulator = new IotSimulator(config);

  // 優雅關閉
  process.on('SIGINT', async () => {
    await simulator.stop();
  });

  process.on('SIGTERM', async () => {
    await simulator.stop();
  });

  // 啟動
  try {
    await simulator.start();
  } catch (error: any) {
    console.error('❌ Failed to start simulator:', error.message);
    process.exit(1);
  }
}

main();
