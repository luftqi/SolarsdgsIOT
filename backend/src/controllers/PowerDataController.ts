// =================================================================
// PowerData Controller - Phase 2 API 層
// 處理功率數據相關的 API 請求
// =================================================================

import { Request, Response } from 'express';
import { PowerDataRepository } from '../services/database/PowerDataRepository';
import { Logger } from '../utils/logger';
import type { ApiResponse, PowerDataDTO, ChartDataPoint } from '../types/api';

export class PowerDataController {
  private readonly logger = new Logger('PowerDataController');
  private readonly powerDataRepo: PowerDataRepository;

  constructor(powerDataRepo: PowerDataRepository) {
    this.powerDataRepo = powerDataRepo;
  }

  /**
   * GET /api/devices/:deviceId/power-data/latest
   * 獲取最新一筆功率數據
   */
  getLatest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;

      this.logger.info(`Getting latest power data for device: ${deviceId}`);

      const latestData = (await this.powerDataRepo.getLatestData(deviceId, 1))[0];

      if (!latestData) {
        res.status(404).json({
          success: false,
          error: 'No data found for this device',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      const dto: PowerDataDTO = {
        id: latestData.id || 0,
        deviceId: latestData.device_id,
        timestamp: latestData.timestamp.toISOString(),
        pg: latestData.pg,
        pa: latestData.pa,
        pp: latestData.pp,
        pagEfficiency: latestData.pga_efficiency || null,
        ppgEfficiency: latestData.pgp_efficiency || null,
        createdAt: latestData.created_at?.toISOString() || new Date().toISOString()
      };

      res.json({
        success: true,
        data: dto,
        timestamp: new Date().toISOString()
      } as ApiResponse<PowerDataDTO>);

    } catch (error: any) {
      this.logger.error('Failed to get latest power data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  /**
   * GET /api/devices/:deviceId/power-data
   * 獲取功率數據列表（支援分頁、時間範圍）
   */
  getList = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId, limit: paramLimit } = req.params;
      const {
        startDate,
        endDate,
        latest
      } = req.query;

      // 優先使用 URL path 中的 limit，其次是 query 中的 latest，最後預設 100
      const limitNum = paramLimit ? parseInt(paramLimit) : (latest ? parseInt(latest as string) : 100);

      this.logger.info(`Getting power data list for device: ${deviceId}, limit: ${limitNum}`);

      let data: any[] = [];

      // 如果指定時間範圍
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        data = await this.powerDataRepo.getDataByTimeRange(deviceId, start, end);
      }
      // 否則使用 limit 查詢
      else {
        data = await this.powerDataRepo.getLatestData(deviceId, limitNum);
      }

      // 轉換為 DTO
      const items: PowerDataDTO[] = data.map(item => ({
        id: item.id || 0,
        deviceId: item.device_id,
        timestamp: item.timestamp.toISOString(),
        pg: item.pg,
        pa: item.pa,
        pp: item.pp,
        pagEfficiency: item.pga_efficiency || null,
        ppgEfficiency: item.pgp_efficiency || null,
        createdAt: item.created_at?.toISOString() || new Date().toISOString()
      }));

      // 直接返回數據列表
      res.json({
        success: true,
        data: items,
        timestamp: new Date().toISOString()
      } as ApiResponse<PowerDataDTO[]>);

    } catch (error: any) {
      this.logger.error('Failed to get power data list:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  /**
   * GET /api/devices/:deviceId/power-data/chart
   * 獲取圖表數據（對應 Node-RED ui-chart 格式）
   * 返回 5 個系列：PG, PA, PP, PAG, PPG
   */
  getChartData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const { latest = 100 } = req.query;

      this.logger.info(`Getting chart data for device: ${deviceId}`);

      const latestCount = parseInt(latest as string);
      const data = await this.powerDataRepo.getLatestData(deviceId, latestCount);

      if (!Array.isArray(data) || data.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No data found for this device',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      // 轉換為 Chart.js 格式（對應 Node-RED ui-chart）
      const chartData: {
        PG: ChartDataPoint[];
        PA: ChartDataPoint[];
        PP: ChartDataPoint[];
        PAG: ChartDataPoint[];
        PPG: ChartDataPoint[];
      } = {
        PG: [],
        PA: [],
        PP: [],
        PAG: [],
        PPG: []
      };

      data.forEach(item => {
        const timestamp = new Date(item.timestamp).getTime();

        chartData.PG.push({
          topic: 'PG',
          timestamp,
          payload: item.pg
        });

        chartData.PA.push({
          topic: 'PA',
          timestamp,
          payload: item.pa
        });

        chartData.PP.push({
          topic: 'PP',
          timestamp,
          payload: item.pp
        });

        chartData.PAG.push({
          topic: 'PAG',
          timestamp,
          payload: item.pga_efficiency || 0
        });

        chartData.PPG.push({
          topic: 'PPG',
          timestamp,
          payload: item.pgp_efficiency || 0
        });
      });

      res.json({
        success: true,
        data: chartData,
        timestamp: new Date().toISOString()
      } as ApiResponse);

    } catch (error: any) {
      this.logger.error('Failed to get chart data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  /**
   * GET /api/devices/:deviceId/power-data/statistics
   * 獲取統計數據
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const { startDate, endDate } = req.query;

      this.logger.info(`Getting statistics for device: ${deviceId}`);

      let data: any[];

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        data = await this.powerDataRepo.getDataByTimeRange(deviceId, start, end);
      } else {
        // 取最近 1000 筆數據進行統計
        data = await this.powerDataRepo.getLatestData(deviceId, 1000);
      }

      if (!Array.isArray(data) || data.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No data found for this device',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      // 計算統計數據
      const pgValues = data.map(item => item.pg);
      const paValues = data.map(item => item.pa);
      const ppValues = data.map(item => item.pp);
      const pagValues = data.map(item => item.pga_efficiency || 0);
      const ppgValues = data.map(item => item.pgp_efficiency || 0);

      const statistics = {
        deviceId,
        totalRecords: data.length,
        avgPG: Math.round(pgValues.reduce((sum, val) => sum + val, 0) / data.length),
        avgPA: Math.round(paValues.reduce((sum, val) => sum + val, 0) / data.length),
        avgPP: Math.round(ppValues.reduce((sum, val) => sum + val, 0) / data.length),
        avgPAG: parseFloat((pagValues.reduce((sum, val) => sum + val, 0) / data.length).toFixed(2)),
        avgPPG: parseFloat((ppgValues.reduce((sum, val) => sum + val, 0) / data.length).toFixed(2)),
        maxPG: Math.max(...pgValues),
        minPG: Math.min(...pgValues),
        dateRange: {
          start: data[0].timestamp.toISOString(),
          end: data[data.length - 1].timestamp.toISOString()
        }
      };

      res.json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      } as ApiResponse);

    } catch (error: any) {
      this.logger.error('Failed to get statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };
}
