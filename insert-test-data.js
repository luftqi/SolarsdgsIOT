// 簡單的測試數據插入腳本 - 模擬 IoT 設備發送數據
const mqtt = require('mqtt');

const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const DEVICE_ID = process.env.DEVICE_ID || '6001';
const INTERVAL = parseInt(process.env.DATA_INTERVAL || '3') * 1000;

console.log('🚀 IoT 模擬器啟動');
console.log(`📡 MQTT Broker: ${MQTT_BROKER}`);
console.log(`🔧 Device ID: ${DEVICE_ID}`);
console.log(`⏱️  發送間隔: ${INTERVAL/1000} 秒`);

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ 已連接到 MQTT Broker');

  let counter = 0;

  setInterval(() => {
    counter++;

    // 生成模擬數據
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '_').replace(/-/g, '_');
    const pg = Math.floor(Math.random() * 500) + 800; // 800-1300W
    const pa = Math.floor(Math.random() * 300) + 200; // 200-500W
    const pp = Math.floor(Math.random() * 200) + 100; // 100-300W

    // 修正格式: timestamp/pg/pa/pp (4個部分)
    const message = `${timestamp}/${pg}/${pa}/${pp}`;
    const topic = `solar/${DEVICE_ID}/data`;

    client.publish(topic, message, (err) => {
      if (err) {
        console.error(`❌ 發送失敗:`, err);
      } else {
        console.log(`📤 [${new Date().toLocaleTimeString()}] 發送數據: PG=${pg}W, PA=${pa}W, PP=${pp}W`);
      }
    });
  }, INTERVAL);
});

client.on('error', (err) => {
  console.error('❌ MQTT 連接錯誤:', err);
});

client.on('close', () => {
  console.log('🔴 MQTT 連接關閉');
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n⏹️  正在關閉模擬器...');
  client.end();
  process.exit(0);
});
