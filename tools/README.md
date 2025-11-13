# IoT Device Simulator

> 🔧 用於測試與開發的 IoT 設備模擬器

## 功能特性

### ✅ 逼真的功率數據生成
- **太陽能發電模擬**: 根據時間（日出、正午、日落）自動調整發電功率
- **天氣波動**: 模擬雲層遮擋造成的隨機功率波動
- **負載模擬**: 模擬 LED 照明（負載A）和泵浦系統（負載P）的消耗
- **批量數據**: 支援一次發送多條歷史數據

### ✅ GPS 位置模擬
- **移動軌跡**: 模擬設備緩慢移動（如移動式太陽能板）
- **高度變化**: 模擬地形起伏
- **衛星數量**: 隨機生成 8-12 顆衛星訊號

### ✅ 完全兼容 Node-RED 格式
- **功率數據格式**: `YYYY_MM_DD_HH_MM_SS/pg/pa/pp`
- **GPS 數據格式**: `latitude,longitude,altitude,satellites`
- **MQTT Topics**:
  - `solar/{device_id}/data` - 功率數據
  - `solar/{device_id}/gps` - GPS 位置

## 快速開始

### 1. 安裝依賴

```bash
cd tools
npm install mqtt dotenv @types/node
```

### 2. 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 檔案
```

### 3. 啟動模擬器

**基本使用:**
```bash
npx ts-node iot-simulator.ts
```

**指定設備 ID:**
```bash
npx ts-node iot-simulator.ts --device=6002
```

**自訂間隔:**
```bash
npx ts-node iot-simulator.ts --interval=5
```

**批量數據:**
```bash
npx ts-node iot-simulator.ts --batch=10
```

**停用 GPS:**
```bash
npx ts-node iot-simulator.ts --no-gps
```

**組合使用:**
```bash
npx ts-node iot-simulator.ts --device=6001 --interval=5 --batch=5
```

## 使用場景

### 場景 1: 本地開發測試

```bash
# 終端 1: 啟動後端服務
cd backend
npm run dev

# 終端 2: 啟動模擬器
cd tools
npx ts-node iot-simulator.ts --device=6001 --interval=5
```

### 場景 2: 多設備模擬

```bash
# 終端 1: 設備 6001
npx ts-node iot-simulator.ts --device=6001 --interval=10

# 終端 2: 設備 6002
npx ts-node iot-simulator.ts --device=6002 --interval=15
```

### 場景 3: 歷史數據批量導入

```bash
# 一次發送 60 條歷史數據（模擬過去 1 小時）
npx ts-node iot-simulator.ts --batch=60 --interval=60
```

### 場景 4: 壓力測試

```bash
# 高頻率發送（每秒一次）
npx ts-node iot-simulator.ts --interval=1 --batch=10
```

## 輸出示例

```
========================================
🚀 IoT Device Simulator Starting...
========================================
Device ID:      6001
MQTT Broker:    mqtt://localhost:1883
Data Interval:  10s
Batch Size:     1
GPS Enabled:    true
GPS Interval:   60s
========================================

Connecting to MQTT broker: mqtt://localhost:1883...
✅ Connected to MQTT broker

✅ Simulator started successfully
Press Ctrl+C to stop

[14:30:15] 📤 Power data sent: solar/6001/data
   📊 PG: 1425W, PA: 1550W, PP: 1780W
[14:30:17] 📍 GPS data sent: solar/6001/gps
   🌍 Location: (25.033721, 121.564485), 100.2m, 10 satellites
[14:30:25] 📤 Power data sent: solar/6001/data
   📊 PG: 1430W, PA: 1545W, PP: 1795W
```

## 數據格式說明

### 功率數據

**格式**: `YYYY_MM_DD_HH_MM_SS/pg/pa/pp`

**範例**: `2025_11_13_14_30_00/1500/1650/1850`

**欄位說明**:
- `YYYY_MM_DD_HH_MM_SS`: 時間戳
- `pg`: 發電功率 (Generation Power) in Watts
- `pa`: 負載 A 功率 (Load A) in Watts
- `pp`: 負載 P 功率 (Load P) in Watts

**發電邏輯**:
```
時間         發電效率    PG (基準1500W)
06:00-07:00    20%       ~300W
08:00-10:00    60%       ~900W
12:00-13:00   100%      ~1500W (峰值)
16:00-17:00    60%       ~900W
18:00-19:00    20%       ~300W
19:00-06:00     0%         0W
```

### GPS 數據

**格式**: `latitude,longitude,altitude,satellites`

**範例**: `25.033671,121.564427,100.5,10`

**欄位說明**:
- `latitude`: 緯度 (-90 ~ 90)
- `longitude`: 經度 (-180 ~ 180)
- `altitude`: 高度 (公尺)
- `satellites`: 衛星數量

## 配置參數

| 參數 | 環境變數 | 命令列 | 預設值 | 說明 |
|-----|---------|-------|-------|------|
| 設備 ID | `DEVICE_ID` | `--device=` | 6001 | 設備識別碼 |
| MQTT Broker | `MQTT_BROKER_URL` | - | mqtt://localhost:1883 | MQTT 伺服器位址 |
| 數據間隔 | `DATA_INTERVAL` | `--interval=` | 10 | 發送間隔（秒）|
| 批量大小 | `BATCH_SIZE` | `--batch=` | 1 | 每次發送條數 |
| GPS 開關 | `ENABLE_GPS` | `--no-gps` | true | 是否發送 GPS |
| GPS 間隔 | `GPS_INTERVAL` | - | 60 | GPS 發送間隔（秒）|

## 未來 IoT 設備整合

當實際 IoT 設備（如 Pi Zero 2W）準備好後，您只需要：

### Python 版本（Pi Zero 2W）

```python
import paho.mqtt.client as mqtt
import time

# 連接 MQTT
client = mqtt.Client("solar-6001")
client.connect("YOUR_VPS_IP", 1883, 60)

# 發送功率數據
def send_power_data(pg, pa, pp):
    timestamp = time.strftime("%Y_%m_%d_%H_%M_%S")
    payload = f"{timestamp}/{pg}/{pa}/{pp}"
    client.publish("solar/6001/data", payload)

# 發送 GPS 數據
def send_gps_data(lat, lon, alt, sat):
    payload = f"{lat},{lon},{alt},{sat}"
    client.publish("solar/6001/gps", payload)

# 每 10 秒發送一次
while True:
    send_power_data(1500, 1650, 1850)
    time.sleep(10)
```

### Arduino/ESP32 版本

```cpp
#include <PubSubClient.h>
#include <WiFi.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  client.setServer("YOUR_VPS_IP", 1883);
}

void loop() {
  String timestamp = "2025_11_13_14_30_00";
  String payload = timestamp + "/1500/1650/1850";
  client.publish("solar/6001/data", payload.c_str());
  delay(10000);
}
```

## 故障排除

### 問題: 無法連接 MQTT

```bash
# 檢查 MQTT 服務
systemctl status mosquitto

# 檢查防火牆
sudo ufw allow 1883
```

### 問題: 數據未寫入資料庫

```bash
# 檢查後端服務日誌
cd backend
npm run dev

# 查看資料庫
psql -U admin -d solar_db -c "SELECT * FROM power_data ORDER BY timestamp DESC LIMIT 5;"
```

### 問題: TypeScript 錯誤

```bash
# 安裝類型定義
npm install --save-dev @types/node
```

## 進階功能

### 自訂發電模式

編輯 `iot-simulator.ts` 中的 `PowerDataGenerator`:

```typescript
// 修改基礎發電功率
private baseGeneration = 2000;  // 改為 2000W

// 修改時間效率曲線
if (hour >= 6 && hour <= 18) {
  // 自訂您的邏輯
}
```

### 自訂 GPS 軌跡

編輯 `GpsDataGenerator`:

```typescript
// 改變起始位置
private baseLat = 25.123456;
private baseLon = 121.654321;

// 改變移動速度
private velocity = 0.0001;  // 更快的移動
```

## 授權

MIT License
