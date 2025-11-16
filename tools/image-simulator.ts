/**
 * Image Simulator - Phase 3.1 Testing
 * 生成假的 RGB (1920x1080) 和熱影像 (80x60) 並上傳到系統
 */

import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// 環境變數
const BACKEND_URL = process.env.BACKEND_URL || 'http://72.61.117.219:3000';
const DEVICE_ID = process.env.DEVICE_ID || '6001';
const UPLOAD_INTERVAL = parseInt(process.env.UPLOAD_INTERVAL || '600'); // 10 分鐘 = 600 秒

// 圖像尺寸
const RGB_WIDTH = 1920;
const RGB_HEIGHT = 1080;
const THERMAL_WIDTH = 80;
const THERMAL_HEIGHT = 60;

// 輸出目錄
const OUTPUT_DIR = path.join(__dirname, 'generated-images');

/**
 * 生成隨機顏色的 RGB 圖像
 */
async function generateRgbImage(timestamp: string): Promise<Buffer> {
  console.log(`📸 生成 RGB 圖像 (${RGB_WIDTH}x${RGB_HEIGHT})...`);

  // 生成漸層背景 (藍色到綠色)
  const svg = `
    <svg width="${RGB_WIDTH}" height="${RGB_HEIGHT}">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(52,152,219);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(46,204,113);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${RGB_WIDTH}" height="${RGB_HEIGHT}" fill="url(#grad1)" />

      <!-- 模擬太陽能板 -->
      <rect x="400" y="200" width="1100" height="680" fill="rgba(44,62,80,0.3)" stroke="white" stroke-width="5"/>

      <!-- 文字標籤 -->
      <text x="${RGB_WIDTH/2}" y="100" font-family="Arial" font-size="48" fill="white" text-anchor="middle" font-weight="bold">
        SolarSDGs IoT - RGB Camera
      </text>
      <text x="${RGB_WIDTH/2}" y="160" font-family="Arial" font-size="32" fill="white" text-anchor="middle">
        Device: ${DEVICE_ID}
      </text>
      <text x="${RGB_WIDTH/2}" y="220" font-family="Arial" font-size="28" fill="white" text-anchor="middle">
        ${timestamp}
      </text>

      <!-- 模擬太陽能板細節 -->
      <rect x="450" y="250" width="500" height="600" fill="rgba(52,73,94,0.5)" stroke="yellow" stroke-width="3"/>
      <rect x="1000" y="250" width="450" height="600" fill="rgba(52,73,94,0.5)" stroke="yellow" stroke-width="3"/>

      <!-- 狀態指示燈 -->
      <circle cx="1800" cy="150" r="30" fill="lime" stroke="white" stroke-width="3"/>
      <text x="1800" y="240" font-family="Arial" font-size="24" fill="white" text-anchor="middle">運作中</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();

  console.log(`✅ RGB 圖像生成完成 (${buffer.length} bytes)`);
  return buffer;
}

/**
 * 生成熱影像 (紅外線熱圖)
 */
async function generateThermalImage(timestamp: string): Promise<Buffer> {
  console.log(`🌡️ 生成熱影像 (${THERMAL_WIDTH}x${THERMAL_HEIGHT})...`);

  // 生成熱影像漸層 (藍色到紅色，代表溫度)
  const svg = `
    <svg width="${THERMAL_WIDTH}" height="${THERMAL_HEIGHT}">
      <defs>
        <radialGradient id="thermal">
          <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(255,165,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="${THERMAL_WIDTH}" height="${THERMAL_HEIGHT}" fill="url(#thermal)" />

      <!-- 高溫區域 (模擬太陽能板發熱) -->
      <ellipse cx="40" cy="30" rx="25" ry="20" fill="rgba(255,255,0,0.8)" />

      <!-- 文字標籤 (小字體) -->
      <text x="${THERMAL_WIDTH/2}" y="8" font-family="Arial" font-size="6" fill="white" text-anchor="middle" font-weight="bold">
        THERMAL
      </text>
      <text x="${THERMAL_WIDTH/2}" y="56" font-family="Arial" font-size="4" fill="white" text-anchor="middle">
        ${DEVICE_ID}
      </text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();

  console.log(`✅ 熱影像生成完成 (${buffer.length} bytes)`);
  return buffer;
}

/**
 * 上傳圖像到 Backend
 */
async function uploadImages(rgbBuffer: Buffer, thermalBuffer: Buffer, capturedAt: string): Promise<void> {
  console.log(`\n📤 上傳圖像到 Backend...`);

  const formData = new FormData();
  formData.append('deviceId', DEVICE_ID);
  formData.append('capturedAt', capturedAt);
  formData.append('rgbImage', rgbBuffer, {
    filename: 'rgb.jpg',
    contentType: 'image/jpeg',
  });
  formData.append('thermalImage', thermalBuffer, {
    filename: 'thermal.jpg',
    contentType: 'image/jpeg',
  });

  try {
    const response = await axios.post(`${BACKEND_URL}/api/images/upload`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log(`✅ 上傳成功！`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error(`❌ 上傳失敗:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * 儲存圖像到本地 (用於除錯)
 */
async function saveImagesToLocal(rgbBuffer: Buffer, thermalBuffer: Buffer, timestamp: string): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const rgbPath = path.join(OUTPUT_DIR, `rgb_${safeTimestamp}.jpg`);
  const thermalPath = path.join(OUTPUT_DIR, `thermal_${safeTimestamp}.jpg`);

  fs.writeFileSync(rgbPath, rgbBuffer);
  fs.writeFileSync(thermalPath, thermalBuffer);

  console.log(`💾 圖像已儲存到本地:`);
  console.log(`   RGB: ${rgbPath}`);
  console.log(`   Thermal: ${thermalPath}`);
}

/**
 * 單次執行
 */
async function runOnce(): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString();
  const displayTime = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`⏰ 執行時間: ${displayTime}`);
  console.log(`📍 設備 ID: ${DEVICE_ID}`);
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // 1. 生成 RGB 圖像
    const rgbBuffer = await generateRgbImage(displayTime);

    // 2. 生成熱影像
    const thermalBuffer = await generateThermalImage(displayTime);

    // 3. 儲存到本地 (除錯用)
    await saveImagesToLocal(rgbBuffer, thermalBuffer, timestamp);

    // 4. 上傳到 Backend
    await uploadImages(rgbBuffer, thermalBuffer, timestamp);

    console.log(`\n✅ 本次執行完成！`);
  } catch (error: any) {
    console.error(`\n❌ 執行失敗:`, error.message);
  }
}

/**
 * 週期性執行
 */
async function runPeriodically(): Promise<void> {
  console.log(`🚀 圖像模擬器啟動`);
  console.log(`   上傳間隔: ${UPLOAD_INTERVAL} 秒 (${UPLOAD_INTERVAL / 60} 分鐘)`);
  console.log(`   設備 ID: ${DEVICE_ID}`);
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(``);

  // 立即執行一次
  await runOnce();

  // 設定週期性執行
  setInterval(async () => {
    await runOnce();
  }, UPLOAD_INTERVAL * 1000);

  console.log(`\n⏳ 等待下次執行... (${UPLOAD_INTERVAL} 秒後)\n`);
}

/**
 * 主程式
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'once';

  if (mode === 'loop') {
    // 週期性執行模式
    await runPeriodically();
  } else {
    // 單次執行模式
    await runOnce();
  }
}

// 執行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
