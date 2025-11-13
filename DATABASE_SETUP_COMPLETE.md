# 資料庫建立完成報告 + IoT 模擬器

> 📅 完成日期: 2025-11-13
> 🎯 目標: VPS 資料庫建立 + IoT 數據模擬器開發

---

## ✅ 1. VPS 資料庫建立完成

### 執行步驟

**1.1 建立資料庫與用戶**
```bash
✅ CREATE DATABASE solar_db
✅ CREATE USER admin WITH PASSWORD 'solar123456'
✅ GRANT ALL PRIVILEGES ON DATABASE solar_db TO admin
```

**1.2 執行 Schema 遷移**
```bash
✅ 上傳 001_initial_schema.sql 到 VPS
✅ 執行 SQL 遷移
✅ 驗證資料表建立成功
```

### 資料庫資訊

**連接資訊:**
```
Host:     72.61.117.219 (VPS)
Port:     5432
Database: solar_db
User:     admin
Password: solar123456
```

**已建立的資料表:**
```
✅ power_data      - 功率數據表
✅ gps_locations   - GPS 位置表
✅ devices         - 設備表
✅ device_config   - 設備配置表
✅ images          - 圖像表
✅ users           - 用戶表
```

**默認數據:**
```
✅ 設備 6001 (Solar Device 6001) - offline
✅ 設備 6002 (Solar Device 6002) - offline
✅ 配置 6001 (factor_a: 1.0, factor_p: 1.0)
✅ 配置 6002 (factor_a: 1.0, factor_p: 1.0)
```

### 驗證命令

**從本地連接測試:**
```bash
psql -h 72.61.117.219 -U admin -d solar_db -c "\dt"
```

**在 VPS 上查詢:**
```bash
ssh root@72.61.117.219
sudo -u postgres psql -d solar_db

# 查看資料表
\dt

# 查看設備
SELECT * FROM devices;

# 查看配置
SELECT * FROM device_config;

# 退出
\q
```

---

## 🚀 2. IoT 設備模擬器完成

### 模擬器特性

**功能完整性:**
```
✅ 逼真的太陽能發電模擬（根據時間變化）
✅ 天氣波動模擬（雲層遮擋）
✅ 負載消耗模擬（LED + 泵浦）
✅ GPS 位置模擬（移動軌跡）
✅ 批量數據發送（歷史數據）
✅ 完全兼容 Node-RED 格式
✅ 多設備支援
✅ 自動重連機制
```

**數據格式:**
```
功率數據: YYYY_MM_DD_HH_MM_SS/pg/pa/pp
GPS 數據: latitude,longitude,altitude,satellites
```

**MQTT Topics:**
```
solar/{device_id}/data  - 功率數據
solar/{device_id}/gps   - GPS 位置
```

### 檔案結構

```
tools/
├── iot-simulator.ts      ✅ 主程式（500+ lines）
├── package.json          ✅ 依賴配置
├── .env.example          ✅ 環境變數範例
└── README.md             ✅ 完整使用文檔
```

### 快速使用

**1. 安裝依賴:**
```bash
cd tools
npm install
```

**2. 配置環境:**
```bash
cp .env.example .env
# 編輯 .env，設置 MQTT_BROKER_URL
```

**3. 啟動模擬器:**
```bash
# 基本使用
npm start

# 指定設備
npx ts-node iot-simulator.ts --device=6002

# 高頻率發送（測試用）
npx ts-node iot-simulator.ts --interval=5

# 批量數據（模擬歷史數據）
npx ts-node iot-simulator.ts --batch=10
```

### 輸出示例

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
```

---

## 🔄 3. 完整數據流程測試

### 測試架構

```
IoT Simulator (工具)
    ↓ MQTT
MQTT Broker (Mosquitto @ VPS)
    ↓ solar/+/data, solar/+/gps
Backend Service (Node.js)
    ↓ DataParser / GpsParser
PostgreSQL (solar_db @ VPS)
```

### 測試步驟

**步驟 1: 準備 VPS 環境**
```bash
# SSH 到 VPS
ssh root@72.61.117.219

# 確認服務運行
systemctl status postgresql
systemctl status mosquitto

# 查看 MQTT 日誌（可選）
mosquitto_sub -t "solar/#" -v
```

**步驟 2: 啟動後端服務**

*選項 A: 在本地啟動（開發模式）*
```bash
cd backend
cp .env.example .env

# 編輯 .env
# DB_HOST=72.61.117.219
# DB_PASSWORD=solar123456
# MQTT_BROKER_URL=mqtt://72.61.117.219:1883

npm run dev
```

*選項 B: 在 VPS 上啟動（生產模式）*
```bash
ssh root@72.61.117.219

# 上傳後端程式碼
# git clone 或 scp 上傳

cd /path/to/backend
npm install
npm run build
npm start
```

**步驟 3: 啟動模擬器**
```bash
cd tools

# 編輯 .env
# MQTT_BROKER_URL=mqtt://72.61.117.219:1883

npm start
```

**步驟 4: 驗證數據寫入**
```bash
# 在 VPS 上查詢資料庫
ssh root@72.61.117.219
sudo -u postgres psql -d solar_db

-- 查詢最新功率數據
SELECT
  device_id,
  timestamp,
  pg, pa, pp,
  pga_efficiency, pgp_efficiency
FROM power_data
ORDER BY timestamp DESC
LIMIT 10;

-- 查詢 GPS 位置
SELECT
  device_id,
  latitude, longitude,
  altitude, satellites,
  timestamp
FROM gps_locations
ORDER BY timestamp DESC
LIMIT 5;
```

**步驟 5: 檢查數據統計**
```sql
-- 查看設備數據量
SELECT
  device_id,
  COUNT(*) as count,
  MIN(timestamp) as first_data,
  MAX(timestamp) as last_data
FROM power_data
GROUP BY device_id;

-- 查看每小時平均功率
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(pg) as avg_pg,
  AVG(pa) as avg_pa,
  AVG(pp) as avg_pp
FROM power_data
WHERE device_id = '6001'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC
LIMIT 24;
```

---

## 📊 4. 數據生成邏輯

### 功率數據生成

**時間曲線（太陽能發電）:**
```
時間          發電效率    PG (基準1500W)    說明
06:00-07:00     ~20%         ~300W         日出
08:00-09:00     ~50%         ~750W         上升
10:00-11:00     ~80%        ~1200W         接近峰值
12:00-13:00    ~100%        ~1500W         正午峰值
14:00-15:00     ~80%        ~1200W         下降
16:00-17:00     ~50%         ~750W         傍晚
18:00-19:00     ~20%         ~300W         日落
19:00-06:00      0%            0W          夜間
```

**負載計算:**
```typescript
PG = baseGeneration * solarEfficiency * randomFactor
PA = PG + (50~150W)   // 負載 A：LED 照明、監控設備
PP = PG + (200~500W)  // 負載 P：泵浦、冷卻系統
```

**效率計算（後端）:**
```typescript
PAG = ((PA - PG) / PG) * 100  // 負載 A 效率 (%)
PPG = ((PP - PG) / PG) * 100  // 負載 P 效率 (%)
```

### GPS 數據生成

**基準位置:** 台北市中心
```
Latitude:  25.033671
Longitude: 121.564427
Altitude:  100m
```

**移動模擬:**
```typescript
// 每次移動 ~1.1 公尺
velocity = 0.00001 度

// 隨機方向
direction = random(0, 2π)

// 新位置
new_lat = current_lat + sin(direction) * velocity
new_lon = current_lon + cos(direction) * velocity
```

---

## 🎯 5. 未來 IoT 設備整合

當實際的 IoT 設備（如 Pi Zero 2W）準備好後，只需要按照相同的格式發送 MQTT 數據即可無縫整合。

### Python 範例（Pi Zero 2W）

```python
#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import time
from datetime import datetime

# 連接 MQTT
client = mqtt.Client("solar-6001")
client.connect("72.61.117.219", 1883, 60)
client.loop_start()

def send_power_data(pg, pa, pp):
    """發送功率數據"""
    timestamp = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
    payload = f"{timestamp}/{pg}/{pa}/{pp}"
    client.publish("solar/6001/data", payload)
    print(f"✓ Sent: {payload}")

def send_gps_data(lat, lon, alt, sat):
    """發送 GPS 數據"""
    payload = f"{lat},{lon},{alt},{sat}"
    client.publish("solar/6001/gps", payload)
    print(f"✓ Sent GPS: {payload}")

# 主迴圈
try:
    while True:
        # 讀取實際感測器數據
        pg = read_generation_power()
        pa = read_load_a_power()
        pp = read_load_p_power()

        send_power_data(pg, pa, pp)
        time.sleep(10)  # 每 10 秒發送一次

except KeyboardInterrupt:
    client.loop_stop()
    client.disconnect()
```

### Arduino/ESP32 範例

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

const char* mqtt_server = "72.61.117.219";
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // 連接 WiFi
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // 連接 MQTT
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // 讀取感測器數據
  int pg = readGenerationPower();
  int pa = readLoadAPower();
  int pp = readLoadPPower();

  // 建立 payload
  char timestamp[20];
  getTimestamp(timestamp);

  char payload[100];
  sprintf(payload, "%s/%d/%d/%d", timestamp, pg, pa, pp);

  // 發送
  client.publish("solar/6001/data", payload);
  Serial.println(payload);

  delay(10000);  // 每 10 秒
}
```

---

## 🔧 6. 故障排除

### 問題 1: 模擬器無法連接 MQTT

**檢查 MQTT 服務:**
```bash
ssh root@72.61.117.219
systemctl status mosquitto

# 重啟 MQTT
systemctl restart mosquitto

# 檢查防火牆
ufw allow 1883
```

**測試 MQTT 連接:**
```bash
# 訂閱測試
mosquitto_sub -h 72.61.117.219 -t "solar/#" -v

# 發布測試
mosquitto_pub -h 72.61.117.219 -t "solar/test" -m "hello"
```

### 問題 2: 後端無法寫入資料庫

**檢查資料庫連接:**
```bash
psql -h 72.61.117.219 -U admin -d solar_db
# 密碼: solar123456
```

**檢查後端日誌:**
```bash
cd backend
npm run dev

# 應該看到:
# ✅ Database connected
# ✅ MQTT Connected
```

**檢查防火牆:**
```bash
ssh root@72.61.117.219
ufw allow 5432  # PostgreSQL
```

### 問題 3: 數據未進入資料庫

**檢查 MQTT 訂閱:**
```bash
# 在 VPS 上監聽 MQTT
mosquitto_sub -t "solar/#" -v

# 應該看到模擬器發送的數據
```

**檢查後端解析:**
```bash
# 查看後端日誌
# 應該有 "Data Parser" 和 "Power data saved" 訊息
```

**手動驗證數據格式:**
```bash
# 測試發送
mosquitto_pub -t "solar/6001/data" -m "2025_11_13_14_30_00/1500/1650/1850"

# 查詢資料庫
psql -h 72.61.117.219 -U admin -d solar_db -c "SELECT * FROM power_data ORDER BY timestamp DESC LIMIT 1;"
```

---

## 📋 7. 檢查清單

**VPS 資料庫:**
- [x] PostgreSQL 服務運行
- [x] solar_db 資料庫已建立
- [x] admin 用戶已建立並授權
- [x] 6 個資料表已建立
- [x] 默認設備與配置已插入
- [x] 防火牆規則已設置

**IoT 模擬器:**
- [x] iot-simulator.ts 已創建（500+ lines）
- [x] package.json 已配置
- [x] README.md 已完成
- [x] .env.example 已提供
- [x] 功率數據生成邏輯完成
- [x] GPS 數據生成邏輯完成
- [x] MQTT 發送機制完成

**測試準備:**
- [ ] 後端服務已啟動
- [ ] 模擬器已啟動
- [ ] MQTT 連接成功
- [ ] 數據寫入資料庫
- [ ] GPS 數據寫入資料庫

---

## 🚀 8. 下一步

### 立即可做的測試

**完整數據流測試:**
```bash
# 終端 1: 啟動後端（在本地或 VPS）
cd backend
npm run dev

# 終端 2: 啟動模擬器
cd tools
npm start

# 終端 3: 監控 MQTT（可選）
ssh root@72.61.117.219
mosquitto_sub -t "solar/#" -v

# 終端 4: 查詢資料庫
watch -n 5 "psql -h 72.61.117.219 -U admin -d solar_db -c 'SELECT COUNT(*) FROM power_data;'"
```

### 多設備壓力測試

```bash
# 同時運行 2 個設備
npm run multi-device

# 或手動啟動
npx ts-node iot-simulator.ts --device=6001 --interval=5 &
npx ts-node iot-simulator.ts --device=6002 --interval=7 &
```

### 歷史數據導入

```bash
# 模擬過去 1 小時的數據（60 條，每分鐘一條）
npx ts-node iot-simulator.ts --batch=60 --interval=60
```

---

## 🎉 總結

### 已完成:

✅ **VPS 資料庫完全準備好**
- PostgreSQL 運行正常
- solar_db 已建立
- 6 個資料表 + 索引
- 默認設備與配置

✅ **IoT 模擬器功能完整**
- 逼真的太陽能發電模擬
- GPS 移動軌跡模擬
- 完全兼容 Node-RED 格式
- 支援批量與多設備

✅ **未來設備整合路徑清晰**
- Python 範例（Pi Zero 2W）
- Arduino/ESP32 範例
- 數據格式已標準化

### 準備就緒:

🚀 **可以開始完整測試**
- 後端 ↔ MQTT ↔ 資料庫
- 模擬器 → 真實數據流
- 多設備並發測試

---

**版本**: Database + Simulator Complete
**日期**: 2025-11-13
**狀態**: ✅ 準備就緒，可開始測試
