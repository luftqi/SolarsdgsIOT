// =================================================================
// MQTT Service - Replaces Node-RED MQTT In/Out nodes
// MQTT 服務
//
// Purpose: Connect to MQTT broker, subscribe to topics, publish messages
// Integrates with DataParser and GpsParser
// =================================================================

import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { DataParser } from './DataParser';
import { GpsParser } from './GpsParser';
import { PowerDataRepository } from '../database/PowerDataRepository';
import { GpsLocationRepository } from '../database/GpsLocationRepository';
import type { FactorConfig } from '../../types/power.types';

export class MqttService extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private readonly logger = new Logger(MqttService.name);
  private readonly dataParser: DataParser;
  private readonly gpsParser: GpsParser;
  private readonly powerDataRepo: PowerDataRepository;
  private readonly gpsLocationRepo: GpsLocationRepository;

  // Factor 配置緩存（device_id -> FactorConfig）
  private factorCache = new Map<string, FactorConfig>();

  constructor(
    powerDataRepo: PowerDataRepository,
    gpsLocationRepo: GpsLocationRepository
  ) {
    super(); // 呼叫 EventEmitter 建構子
    this.dataParser = new DataParser();
    this.gpsParser = new GpsParser();
    this.powerDataRepo = powerDataRepo;
    this.gpsLocationRepo = gpsLocationRepo;
  }

  /**
   * 連接到 MQTT Broker
   */
  async connect(): Promise<void> {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const clientId = process.env.MQTT_CLIENT_ID || 'nodered-solar-001';

    this.logger.info(`Connecting to MQTT broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT client not initialized'));
        return;
      }

      this.client.on('connect', () => {
        this.logger.info('✅ Connected to MQTT broker');
        this.subscribeToTopics();
        resolve();
      });

      this.client.on('error', (error) => {
        this.logger.error('MQTT connection error', error);
        reject(error);
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload);
      });

      this.client.on('close', () => {
        this.logger.warn('MQTT connection closed');
      });

      this.client.on('reconnect', () => {
        this.logger.info('Attempting to reconnect to MQTT broker...');
      });
    });
  }

  /**
   * 訂閱 MQTT topics
   */
  private subscribeToTopics(): void {
    if (!this.client) {
      this.logger.error('Cannot subscribe: MQTT client not connected');
      return;
    }

    const topics = [
      'solar/+/data',  // 功率數據
      'solar/+/gps',   // GPS 位置
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, (error) => {
        if (error) {
          this.logger.error(`Failed to subscribe to ${topic}`, error);
        } else {
          this.logger.info(`✅ Subscribed to: ${topic}`);
        }
      });
    });
  }

  /**
   * 處理接收到的 MQTT 訊息
   */
  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    this.logger.info(`📩 MQTT message received: ${topic}`);

    try {
      const topicParts = topic.split('/');

      if (topicParts.length < 3 || topicParts[0] !== 'solar') {
        this.logger.warn(`Invalid topic format: ${topic}`);
        return;
      }

      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      switch (messageType) {
        case 'data':
          await this.handlePowerData(deviceId, payload);
          break;

        case 'gps':
          await this.handleGpsData(deviceId, payload);
          break;

        default:
          this.logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error: any) {
      this.logger.error('Error handling MQTT message', error);
    }
  }

  /**
   * 處理功率數據
   */
  private async handlePowerData(deviceId: string, payload: Buffer): Promise<void> {
    try {
      // 獲取 Factor 配置
      const factorConfig = this.getFactorConfig(deviceId);

      // 解析數據
      const result = await this.dataParser.parse(deviceId, payload, factorConfig);

      // 儲存到資料庫
      if (result.sqlData && result.sqlData.length > 0) {
        if (result.sqlData.length === 1) {
          await this.powerDataRepo.insertPowerData(result.sqlData[0]);
          this.logger.info(`✅ Power data saved: ${deviceId}`);
        } else {
          await this.powerDataRepo.batchInsertPowerData(result.sqlData);
          this.logger.info(`✅ Batch power data saved: ${deviceId} (${result.sqlData.length} records)`);
        }
      }

      // 發送事件給 WebSocket 服務 (使用第一筆 sqlData)
      if (result.sqlData && result.sqlData.length > 0) {
        this.emit('powerDataParsed', result.sqlData[0]);
      }

      // TODO: 發送圖表數據
      if (result.chartData) {
        this.emit('chartData', result.chartData);
      }
    } catch (error: any) {
      this.logger.error(`Failed to handle power data for ${deviceId}`, error);
    }
  }

  /**
   * 處理 GPS 數據
   */
  private async handleGpsData(deviceId: string, payload: Buffer): Promise<void> {
    try {
      // 解析 GPS 數據
      const gpsData = await this.gpsParser.parse(deviceId, payload);

      if (!gpsData) {
        this.logger.warn(`Invalid GPS data for ${deviceId}`);
        return;
      }

      // 儲存到資料庫
      await this.gpsLocationRepo.upsertGpsLocation(gpsData);
      this.logger.info(`✅ GPS location saved: ${deviceId} @ (${gpsData.latitude}, ${gpsData.longitude})`);

      // TODO: 發送到 WebSocket (Dashboard 地圖更新)
      // const dashboardData = this.gpsParser.formatForDashboard(gpsData);
      // await this.webSocketService.broadcast(dashboardData);
    } catch (error: any) {
      this.logger.error(`Failed to handle GPS data for ${deviceId}`, error);
    }
  }

  /**
   * 發布 MQTT 訊息
   */
  publish(topic: string, message: string | Buffer): void {
    if (!this.client) {
      this.logger.error('Cannot publish: MQTT client not connected');
      return;
    }

    this.client.publish(topic, message, (error) => {
      if (error) {
        this.logger.error(`Failed to publish to ${topic}`, error);
      } else {
        this.logger.info(`📤 Published to: ${topic}`);
      }
    });
  }

  /**
   * 發送設備控制命令
   */
  sendControlCommand(deviceId: string, command: any): void {
    const topic = `solar/control/${deviceId}`;
    const message = JSON.stringify(command);
    this.publish(topic, message);
  }

  /**
   * 發送配置更新
   */
  sendConfigUpdate(deviceId: string, config: any): void {
    const topic = `solar/config/${deviceId}`;
    const message = JSON.stringify(config);
    this.publish(topic, message);

    // 更新本地 Factor 緩存
    if (config.factor_a !== undefined || config.factor_p !== undefined) {
      this.factorCache.set(deviceId, {
        factor_a: config.factor_a || 1.0,
        factor_p: config.factor_p || 1.0
      });
    }
  }

  /**
   * 獲取設備的 Factor 配置
   */
  private getFactorConfig(deviceId: string): FactorConfig {
    return this.factorCache.get(deviceId) || {
      factor_a: 1.0,
      factor_p: 1.0
    };
  }

  /**
   * 設置 Factor 配置
   */
  setFactorConfig(deviceId: string, config: FactorConfig): void {
    this.factorCache.set(deviceId, config);
    this.logger.info(`Factor config updated: ${deviceId} (A=${config.factor_a}, P=${config.factor_p})`);
  }

  /**
   * 斷開 MQTT 連接
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, () => {
          this.logger.info('MQTT client disconnected');
          resolve();
        });
      });
    }
  }
}
