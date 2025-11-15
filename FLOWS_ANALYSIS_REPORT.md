# Node-RED Flow 完整功能分析報告

## 1. 應用架構概覽

- **總節點數量**: 121
- **節點類型數量**: 22
- **頁面數量**: 3
- **Function 節點數量**: 37

### 頁面清單

- **solar monitor**
  - 路徑: `/page1`
  - 圖標: `home`
  - ID: `d7a4298f3059e4c3`

- **login**
  - 路徑: `/login`
  - 圖標: `home`
  - ID: `e4c8b01d1e02491a`

- **customer manage**
  - 路徑: `/admin`
  - 圖標: `home`
  - ID: `14e4b2bc7756e5f9`

### UI 群組清單

- **主監控區** (屬於頁面: solar monitor)
  - 寬度: 12 | 高度: 8
  - ID: `24c6ae5a937a533f`

- **登入畫面** (屬於頁面: login)
  - 寬度: 14 | 高度: 10
  - ID: `c3627b645dc69831`

- **客戶管理** (屬於頁面: customer manage)
  - 寬度: 12 | 高度: 8
  - ID: `7f54281a9ecb8f13`


## 2. UI 組件分析

### ui-template (6 個)

- **監控畫面**
  - 頁面: solar monitor
  - 群組: 主監控區
  - Scope: local

- **CSS**
  - 頁面: Unknown
  - 群組: Unknown
  - Scope: page:style

- **登入畫面**
  - 頁面: login
  - 群組: 登入畫面
  - Scope: local

- **管理畫面**
  - 頁面: customer manage
  - 群組: 客戶管理
  - Scope: local

- **CSS(登入畫面)**
  - 頁面: Unknown
  - 群組: Unknown
  - Scope: page:style

- **CSS(管理畫面)**
  - 頁面: Unknown
  - 群組: Unknown
  - Scope: page:style

### ui-chart (5 個)

- **PG **
  - 頁面: solar monitor
  - 群組: 主監控區
  - 圖表類型: line

- **PA**
  - 頁面: solar monitor
  - 群組: 主監控區
  - 圖表類型: line

- **PP**
  - 頁面: solar monitor
  - 群組: 主監控區
  - 圖表類型: line

- **PAG **
  - 頁面: solar monitor
  - 群組: 主監控區
  - 圖表類型: line

- **PPG **
  - 頁面: solar monitor
  - 群組: 主監控區
  - 圖表類型: line

### ui-iframe (1 個)

- **Worldmap**
  - 頁面: solar monitor
  - 群組: 主監控區

### worldmap (1 個)

- **GPS 地圖**
  - 頁面: Unknown
  - 群組: Unknown


## 3. MQTT 配置

- **Broker**: Solar MQTT Broker
  - Host: mqtt
  - Port: 1883
  - Client ID: nodered-solar-001

### MQTT In 節點 (2 個)

- **Solar Data Input**
  - Topic: `solar/+/data`
  - QoS: 1

- **GPS DATA INPUT**
  - Topic: `solar/+/gps`
  - QoS: 1

### MQTT Out 節點 (6 個)

- **Send ACK**
  - Topic: ``
  - QoS: 1

- **MQTT DATA TEST**
  - Topic: `solar/6002/data`
  - QoS: 1

- **Send control**
  - Topic: ``
  - QoS: 1

- **Send Config**
  - Topic: ``
  - QoS: 1

- **MQTT GPS TEST**
  - Topic: `solar/6002/gps`
  - QoS: 1

- **MQTT STATUS TEST**
  - Topic: `solar/6002/status`
  - QoS: 1


## 4. HTTP API 端點

- **GET /api/icon-512.png**
  - Name: GET /api/icon-512.png

- **GET /api/icon-192.png**
  - Name: GET /api/icon-192.png

- **GET /api/icon-180.png**
  - Name: GET /api/icon-180.png

- **GET /api/favicon.ico**
  - Name: GET /api/favicon.ico

- **GET /api/manifest.json**
  - Name: GET /api/manifest.json

- **GET /dashboard/pwa-64x64.png**
  - Name: GET /dashboard/pwa-64x64.png

- **GET /dashboard/pwa-192x192.png**
  - Name: GET /dashboard/pwa-192x192.png

- **GET /dashboard/pwa-512x512.png**
  - Name: GET /dashboard/pwa-512x512.png


## 5. PostgreSQL 配置

- **Database**: 
  - Host: postgres
  - Port: 5432
  - Database: solar_db
  - SSL: false


## 6. 關鍵 Function 節點程式碼

### 認證與授權 (4 個)

#### 驗證密碼

- **ID**: `df344886164dbd15`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 驗證密碼 Function - 專門驗證密碼（修正版）
// 位置：PostgreSQL → [這裡] → 處理登入驗證
// 輸出數：1
// =================================================================

node.warn('=====================================');
node.warn('[驗證密碼] 開始驗證');
node.warn('=====================================');

// 檢查是否為登入動作
if (!msg._original_request || msg._original_request.action !== 'customer_login') {
    node.warn('[驗證密碼] 不是登入動作，直接傳遞');
    return msg;
}

const requestedCode = msg._original_request.customer_code;
const requestedPassword = msg._original_request.password;

node.warn('[驗證密碼] 驗證客戶: ' + requestedCode);
node.warn('[驗證密碼] 輸入密碼: ' + requestedPassword);

// 初始化 login_check
msg.login_check = {
    requested_code: requestedCode,
    requested_password: requestedPassword,
    success: false,
    customer_data: null,
    message: ''
};

// 檢查查詢結果
if (!msg.payload || msg.payload.length === 0) {
    // 客戶不存在
    msg.login_check.success = false;
    msg.login_check.message = '客戶代碼不存在或已停用';

    node.warn('[驗證密碼] ❌ 客戶不存在');
    node.status({
        fill: "red",
        shape: "ring",
        text: "客戶不存在"
    });
} else {
    // 客戶存在，比對密碼
    const customer = msg.payload[0];

    node.warn('[驗證密碼] 找到客戶: ' + customer.customer_name);
    node.warn('[驗證密碼] 資料庫密碼: ' + customer.password);

    if (customer.password === requestedPassword) {
        // 密碼正確
        msg.login_check.success = true;
        msg.login_check.customer_data = customer;
        msg.login_check.message = '登入成功';

        node.warn('[驗證密碼] ✅ 密碼正確');
        node.warn('[驗證密碼] 設置 login_check.success = true');

        node.status({
            fill: "green",
            shape: "dot",
            text: "密碼正確"
        });
    } else {
        // 密碼錯誤
        msg.login_check.success = false;
        msg.login_check.message = '密碼錯誤';

        node.warn('[驗證密碼] ❌ 密碼錯誤');
        node.status({
            fill: "red",
            shape: "dot",
            text: "密碼錯誤"
        });
    }
}

node.warn('[驗證密碼] 驗證完成，傳遞到下一個節點');
node.warn('=====================================');

// 傳遞到下一個節點
return msg;
```

#### 處理登入驗證

- **ID**: `513266156844f26e`
- **Outputs**: 2
- **程式碼**:

```javascript
// =================================================================
// 處理登入驗證 Function（完整除錯版）
// 位置：驗證密碼 → [這裡] → 分流
// 輸出數：2
// =================================================================

node.warn('=====================================');
node.warn('[處理登入] 開始處理');
node.warn('=====================================');

// 顯示收到的完整訊息
node.warn('[處理登入] 完整 msg:');
node.warn(JSON.stringify({
    login_check: msg.login_check,
    _original_request: msg._original_request,
    payload: msg.payload
}, null, 2));

// 檢查是否有 login_check
if (!msg.login_check) {
    node.warn('[處理登入] ❌ 沒有 login_check，這不是登入請求');

    // 檢查是否為其他操作
    if (msg._original_request && msg._original_request.target === 'admin_page') {
        node.warn('[處理登入] 這是管理員操作，傳到 Output 2');
        return [null, msg];
    }

    node.warn('[處理登入] 未知請求，傳到 Output 2');
    return [null, msg];
}

node.warn('[處理登入] ✅ 有 login_check，開始處理登入驗證');

// 取得 request_id
const requestId = msg._original_request?.request_id || null;
node.warn(`[處理登入] Request ID: ${requestId}`);

// 檢查登入結果
const success = msg.login_check.success;
const message = msg.login_check.message;

node.warn(`[處理登入] 登入結果: ${success ? '成功' : '失敗'}`);
node.warn(`[處理登入] 訊息: ${message}`);

// 準備回傳給登入頁面的訊息
const loginResponse = {
    payload: {
        login_result: {
            success: success,
            message: message
        },
        request_id: requestId
    }
};

if (success) {
    // 登入成功
    const customer = msg.login_check.customer_data;

    node.warn('[處理登入] ✅ 登入成功處理');
    node.warn(`[處理登入] 客戶代碼: ${customer.customer_code}`);
    node.warn(`[處理登入] 客戶名稱: ${customer.customer_name}`);
    node.warn(`[處理登入] 設備列表: ${JSON.stringify(customer.devices)}`);

    loginResponse.payload.login_result.customer_code = customer.customer_code;
    loginResponse.payload.login_result.customer_name = customer.customer_name;
    loginResponse.payload.login_result.devices = customer.devices;

    node.warn('[處理登入] 準備回傳訊息:');
    node.warn(JSON.stringify(loginResponse, null, 2));

    // 準備記錄登入的訊息
    const logMsg = {
        action: 'log_login',
        customer_code: customer.customer_code,
        need_log: true
    };

    node.warn('[處理登入] 準備記錄登入:');
    node.warn(JSON.stringify(logMsg, null, 2));

    node.status({
        fill: "green",
        shape: "dot",
        text: `✅ ${customer.customer_code} 登入成功`
    });

    node.warn('[處理登入] Output 1: 回登入頁面（成功）');
    node.warn('[處理登入] Output 2: 記錄登入');
    node.warn('=====================================');

    // Output 1: 回登入頁面（成功）
    // Output 2: 記錄登入
    return [loginResponse, logMsg];

} else {
    // 登入失敗
    node.warn('[處理登入] ❌ 登入失敗處理');
    node.warn(`[處理登入] 失敗原因: ${message}`);

    node.warn('[處理登入] 準備回傳失敗訊息:');
    node.warn(JSON.stringify(loginResponse, null, 2));

    node.status({
        fill: "red",
        shape: "dot",
        text: "登入失敗"
    });

    node.warn('[處理登入] Output 1: 回登入頁面（失敗）');
    node.warn('[處理登入] Output 2: null');
    node.warn('=====================================');

    // Output 1: 回登入頁面（失敗）
    // Output 2: null（不需要記錄）
    return [loginResponse, null];
}
```

#### 紀錄登入

- **ID**: `aa53009946c82bc4`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 記錄登入 Function
// 位置：處理登入驗證(Output2) → [這裡] → PostgreSQL → 登入Template
// 輸出數：1
// =================================================================

// 從上一個節點取得資訊
const loginResult = msg.payload?.login_result;

if (!loginResult || !loginResult.success) {
    node.warn('[記錄登入] 無有效的登入資訊');
    return null;
}

node.warn(`[記錄登入] 記錄客戶登入: ${loginResult.customer_code}`);

// 準備更新登入記錄的 SQL
msg.query = `
    UPDATE customers 
    SET last_login = CURRENT_TIMESTAMP,
        login_count = COALESCE(login_count, 0) + 1
    WHERE customer_code = $1
    RETURNING customer_code, last_login, login_count;
`;

msg.params = [loginResult.customer_code];

// 保存登入結果，以便最後回傳給前端
msg._login_result = loginResult;

node.status({
    fill: "blue",
    shape: "ring",
    text: `記錄: ${loginResult.customer_code}`
});

return msg;
```

#### 登入完成處理

- **ID**: `bb6030318f19580d`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 登入完成處理 Function
// 位置：PostgreSQL(記錄登入後) → [這裡] → 登入Template
// 輸出數：1
// =================================================================

// 取回原始的登入結果
const loginResult = msg._login_result;

if (!loginResult) {
    node.warn('[登入完成] 無登入結果資訊');
    return null;
}

node.warn(`[登入完成] 登入記錄已更新: ${loginResult.customer_code}`);

// 回傳最終的成功訊息給前端
msg.payload = {
    login_result: loginResult
};

node.status({
    fill: "green",
    shape: "dot",
    text: `✅ 完成: ${loginResult.customer_code}`
});

return msg;
```

### 數據解析器 (2 個)

#### 數據解析器

- **ID**: `586ca0706858a41b`
- **Outputs**: 3
- **程式碼**:

```javascript
// =================================================================
// MQTT 數據解析器 V8.1 - 加入 Factor 修正
// 位置：MQTT In (solar/+/data) → [這裡] → 3個輸出
// 
// ⭐ 新增：從 flow context 讀取 Factor 並應用到 PA/PP
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

// ========== 步驟 1: 提取 device_id ==========
let deviceId = '6002';
if (msg.topic) {
    const topicParts = msg.topic.split('/');
    if (topicParts.length >= 2 && topicParts[0] === 'solar') {
        deviceId = topicParts[1];
    }
}

log('[Data Parser] ========================================');
log(`[Data Parser] 設備: ${deviceId}`);

// ========== ⭐ 步驟 1.5: 讀取 Factor 配置 ==========
const factorKey = `factor_${deviceId}`;
const factorConfig = flow.get(factorKey) || {
    factor_a: 1.0,
    factor_p: 1.0
};

const factor_a = parseFloat(factorConfig.factor_a) || 1.0;
const factor_p = parseFloat(factorConfig.factor_p) || 1.0;

log(`[Data Parser] Factor 配置: A=${factor_a}, P=${factor_p}`);
log('[Data Parser] ========================================');

// ========== 步驟 2: 解析原始數據 ==========
let rawData = msg.payload;

if (Buffer.isBuffer(rawData)) {
    rawData = rawData.toString('utf-8');
}

if (typeof rawData !== 'string') {
    rawData = String(rawData);
}

const cleanData = rawData.replace(/["\s]/g, '').trim();
const finalData = cleanData.endsWith(',') ? cleanData.slice(0, -1) : cleanData;

log(`[Data Parser] 原始數據: ${rawData.substring(0, 100)}...`);
log(`[Data Parser] 清理後: ${finalData.substring(0, 100)}...`);

// ========== 步驟 3: 分割批量數據 ==========
const dataEntries = finalData.includes(',')
    ? finalData.split(',').filter(s => s.trim().length > 0)
    : [finalData];

log(`[Data Parser] 數據條數: ${dataEntries.length}`);

if (dataEntries.length === 0) {
    log('[Data Parser] ❌ 無有效數據');
    setStatus("red", "ring", "無數據");
    return [null, null, null];
}

// ========== 步驟 4: 解析每條數據 ==========
const sqlBatch = [];
let latestChartData = null;
let processedCount = 0;
const errors = [];

for (let i = 0; i < dataEntries.length; i++) {
    const entry = dataEntries[i].trim();

    if (!entry) continue;

    try {
        // 分割數據：timestamp/pg/pa/pp/pag/ppg
        const parts = entry.split('/');

        if (parts.length !== 6 && parts.length !== 4) {
            errors.push(`[${i}] 格式錯誤: ${parts.length}個部分`);
            continue;
        }

        // === 解析時間戳 ===
        const timeParts = parts[0].split('_');
        if (timeParts.length !== 6) {
            errors.push(`[${i}] 時間格式錯誤: ${parts[0]}`);
            continue;
        }

        const [year, month, day, hour, minute, second] = timeParts.map(Number);

        // 驗證時間範圍
        if (year < 2020 || year > 2030 ||
            month < 1 || month > 12 ||
            day < 1 || day > 31 ||
            hour < 0 || hour > 23 ||
            minute < 0 || minute > 59 ||
            second < 0 || second > 59) {
            errors.push(`[${i}] 時間值不合理: ${parts[0]}`);
            continue;
        }

        // 創建 Date 對象
        const timestamp = new Date(year, month - 1, day, hour, minute, second);

        if (isNaN(timestamp.getTime())) {
            errors.push(`[${i}] 無效日期: ${parts[0]}`);
            continue;
        }

        // SQL 格式時間戳
        const sqlTimestamp = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

        // Unix 毫秒時間戳
        const unixTimestamp = timestamp.getTime();

        // === ⭐ 解析功率值並應用 Factor ===
        const pg_raw = parseInt(parts[1]) || 0;
        const pa_raw = parseInt(parts[2]) || 0;
        const pp_raw = parseInt(parts[3]) || 0;

        // 應用 Factor 修正
        const pg = pg_raw;  // PG 保持原值（發電功率不修正）
        const pa = Math.round(pa_raw * factor_a);  // PA 乘以 factor_a
        const pp = Math.round(pp_raw * factor_p);  // PP 乘以 factor_p

        // 驗證功率值範圍
        if (pg < 0 || pg > 10000 || pa < 0 || pa > 10000 || pp < 0 || pp > 10000) {
            errors.push(`[${i}] 功率超出範圍`);
            continue;
        }

        // === 解析或計算效率（使用修正後的值）===
        let pag, ppg;

        if (parts.length === 6) {
            // V6.3 新格式：有效率值，但需要重新計算（因為 PA/PP 已修正）
            // 忽略原始效率，用修正後的功率重新計算
            pag = pg > 0 ? ((pa - pg) * 100 / pg) : 0;
            ppg = pg > 0 ? ((pp - pg) * 100 / pg) : 0;
        } else {
            // 舊格式：需要計算效率
            pag = pg > 0 ? ((pa - pg) * 100 / pg) : 0;
            ppg = pg > 0 ? ((pp - pg) * 100 / pg) : 0;
        }

        // 四捨五入到2位小數
        const pagRounded = Math.round(pag * 100) / 100;
        const ppgRounded = Math.round(ppg * 100) / 100;

        // === 準備 SQL 數據 ===
        const sqlRow = [
            deviceId,
            sqlTimestamp,
            pg,      // 修正後的值
            pa,      // 修正後的值
            pp,      // 修正後的值
            pagRounded,  // 重新計算的效率
            ppgRounded   // 重新計算的效率
        ];

        sqlBatch.push(sqlRow);

        // === 保存最新數據（用於圖表和UI）===
        latestChartData = {
            deviceId: deviceId,
            timestamp: sqlTimestamp,
            unixTimestamp: unixTimestamp,
            pg: pg,
            pa: pa,
            pp: pp,
            pag: pagRounded,
            ppg: ppgRounded
        };

        processedCount++;

        // 詳細日誌（前3條）
        if (i < 3) {
            log(`[Data Parser] [${i}] ${sqlTimestamp}`);
            log(`[Data Parser]   原始: PG:${pg_raw}W PA:${pa_raw}W PP:${pp_raw}W`);
            log(`[Data Parser]   修正: PG:${pg}W PA:${pa}W PP:${pp}W (A×${factor_a}, P×${factor_p})`);
            log(`[Data Parser]   效率: PAG:${pagRounded}% PPG:${ppgRounded}%`);
        }

    } catch (error) {
        errors.push(`[${i}] 異常: ${error.message}`);
    }
}

// ========== 步驟 5: 輸出統計 ==========
log('[Data Parser] ========================================');
log(`[Data Parser] 處理完成: 成功 ${processedCount}/${dataEntries.length}`);

if (errors.length > 0) {
    log(`[Data Parser] 錯誤數: ${errors.length}`);
    if (errors.length <= 5) {
        errors.forEach(err => log(`[Data Parser] ${err}`));
    }
}

// ========== 步驟 6: 檢查是否有有效數據 ==========
if (sqlBatch.length === 0) {
    log('[Data Parser] ❌ 無有效數據可處理');
    setStatus("red", "ring", `失敗: ${errors.length}`);
    return [null, null, null];
}

// ========== 步驟 7: 準備三個輸出 ==========

// === Output 1: 圖表數據 ===
let chartOutput = null;

if (latestChartData) {
    chartOutput = {
        payload: latestChartData,
        device_id: deviceId
    };

    log('[Data Parser] Output 1: 圖表數據 ✅');
    log(`[Data Parser]   時間: ${latestChartData.timestamp}`);
    log(`[Data Parser]   PG: ${latestChartData.pg}W (修正後)`);
    log(`[Data Parser]   PA: ${latestChartData.pa}W (修正後)`);
    log(`[Data Parser]   PP: ${latestChartData.pp}W (修正後)`);
}

// === Output 2: SQL數據 ===
let sqlOutput;

if (sqlBatch.length === 1) {
    sqlOutput = {
        query_type: 'insert_power_data',
        params: sqlBatch[0],
        device_id: deviceId,
        stats: {
            total: dataEntries.length,
            processed: processedCount,
            errors: errors.length
        }
    };
    log('[Data Parser] Output 2: 單條SQL插入 ✅');
} else {
    sqlOutput = {
        query_type: 'batch_insert_power_data',
        batch_data: sqlBatch,
        device_id: deviceId,
        stats: {
            total: dataEntries.length,
            processed: processedCount,
            errors: errors.length
        }
    };
    log(`[Data Parser] Output 2: 批量SQL插入 (${sqlBatch.length}條) ✅`);
}

// === Output 3: 即時UI數據 ===
let uiOutput = null;

if (latestChartData) {
    uiOutput = {
        payload: {
            type: 'realtime',
            device_id: deviceId,
            online: true,
            lastUpdate: new Date().toLocaleTimeString('zh-TW'),
            pg: latestChartData.pg,
            pa: latestChartData.pa,
            pp: latestChartData.pp,
            pag: latestChartData.pag,
            ppg: latestChartData.ppg,
            timestamp: latestChartData.timestamp
        },
        device_id: deviceId
    };

    log('[Data Parser] Output 3: 即時UI數據 ✅');
}

// ========== 步驟 8: 設置狀態 ==========
if (errors.length === 0) {
    setStatus("green", "dot", `✅ ${processedCount}條 (A×${factor_a}, P×${factor_p})`);
} else {
    setStatus("yellow", "dot", `⚠️ ${processedCount}/${dataEntries.length}`);
}

log('[Data Parser] ========================================');
log('[Data Parser] ✅ 三輸出準備完成（已應用 Factor）');
log('[Data Parser] ========================================');

// ========== 步驟 9: 返回三個輸出 ==========
return [chartOutput, sqlOutput, uiOutput];
```

#### gps解析器

- **ID**: `74034cbe63589d95`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// GPS 解析器 - 完整版
// 輸入: solar/6002/gps
// 格式: "25.033671,121.564427,100.5,8"
// 輸出: 
//   Output 1: 資料庫寫入 (msg.query_type = 'upsert_gps_location')
//   Output 2: Dashboard 顯示 (msg.payload = GPS數據)
//   Output 3: Debug 日誌
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

// === 取得設備 ID ===
let deviceId = '6002'; // 預設值

if (msg.topic) {
    const topicParts = msg.topic.split('/');
    // 格式: solar/DEVICE_ID/gps
    if (topicParts.length >= 3 && topicParts[0] === 'solar' && topicParts[2] === 'gps') {
        deviceId = topicParts[1];
    }
}

log(`[GPS Parser] 處理設備 ${deviceId} 的 GPS 數據`);

// === 解析 GPS 數據 ===
let rawData = msg.payload;

// 處理 Buffer
if (Buffer.isBuffer(rawData)) {
    rawData = rawData.toString('utf-8');
}

// 轉換為字串
if (typeof rawData !== 'string') {
    rawData = String(rawData);
}

// 移除引號和空白
const cleanData = rawData.replace(/["\s]/g, '');

log(`[GPS Parser] 原始數據: ${cleanData}`);

// 檢查數據
if (!cleanData || cleanData.length === 0) {
    log('[GPS Parser] GPS 數據為空');
    setStatus("red", "ring", "空數據");
    return null;
}

// 分割數據: latitude,longitude,altitude,satellites
const parts = cleanData.split(',');

if (parts.length < 2) {
    log(`[GPS Parser] GPS 數據格式錯誤: 預期至少2個欄位，實際${parts.length}個`);
    setStatus("red", "ring", "格式錯誤");
    return null;
}

// 解析座標
const latitude = parseFloat(parts[0]);
const longitude = parseFloat(parts[1]);
const altitude = parts.length > 2 ? parseFloat(parts[2]) : 0;
const satellites = parts.length > 3 ? parseInt(parts[3]) : 0;

// 驗證座標
if (isNaN(latitude) || isNaN(longitude)) {
    log('[GPS Parser] 無效的 GPS 座標（非數字）');
    setStatus("yellow", "ring", "座標無效");
    return null;
}

// 檢查座標範圍
if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    log(`[GPS Parser] GPS 座標超出範圍: (${latitude}, ${longitude})`);
    setStatus("yellow", "ring", "座標超範圍");
    return null;
}

log(`[GPS Parser] ✅ 座標: (${latitude.toFixed(6)}, ${longitude.toFixed(6)}), 高度: ${altitude}m, 衛星: ${satellites}`);

// === 準備資料庫寫入數據 ===
const dbMsg = {
    query_type: 'upsert_gps_location',
    params: [
        deviceId,
        latitude,
        longitude,
        altitude || 0,
        satellites || 0,
        new Date().toISOString()
    ],
    device_id: deviceId
};

// === 準備 Dashboard 數據 ===
const dashboardMsg = {
    topic: `dashboard/gps/${deviceId}`,
    payload: {
        device_id: deviceId,
        type: 'gps',
        latitude: latitude,
        longitude: longitude,
        altitude: altitude,
        satellites: satellites,
        timestamp: new Date().toLocaleTimeString('zh-TW'),
        formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
};

// === Debug 訊息 ===
const debugMsg = {
    payload: `[GPS] ${deviceId} - (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) @ ${altitude}m, ${satellites}顆衛星`
};

// 設定節點狀態
setStatus("green", "dot", `GPS: ${satellites}衛星`);

// === 返回三個輸出 ===
return [dbMsg, dashboardMsg, debugMsg];
```

### SQL 生成器 (9 個)

#### SQL生成器

- **ID**: `4e63fc0483df2653`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 動態 SQL 生成器 - 統一版（移除 pizero）
// 版本: V5.0
// 適用於獨立 solar_db 資料庫
// 
// 整合所有 SQL 操作：
// - 功率數據、GPS、配置、設備狀態、統計
// =================================================================

// 確保 msg 物件存在
if (!msg) {
    msg = {};
}

// 檢查是否為資料庫操作
if (!msg.query_type) {
    return msg;
}

// 檢查 params 是否存在
if (!msg.params) {
    msg.params = [];
}

// 日誌輸出
const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 設定狀態
const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log(`[SQL] 類型: ${msg.query_type}, 參數: ${JSON.stringify(msg.params)}`);

try {
    switch (msg.query_type) {
        // ========================================
        // 系統管理 SQL
        // ========================================
        case 'test_connection':
            msg.query = 'SELECT version(), current_database();';
            msg.params = [];
            log('[SQL] 測試資料庫連線');
            break;

        case 'list_tables':
            msg.query = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `;
            msg.params = [];
            log('[SQL] 列出所有資料表');
            break;

        // ========================================
        // 功率數據操作
        // ========================================
        case 'insert_power_data':
            // 確保有 7 個參數
            while (msg.params.length < 7) {
                msg.params.push(null);
            }
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id, timestamp) DO UPDATE SET
                    pg = EXCLUDED.pg,
                    pa = EXCLUDED.pa,
                    pp = EXCLUDED.pp,
                    pga_efficiency = EXCLUDED.pga_efficiency,
                    pgp_efficiency = EXCLUDED.pgp_efficiency
                RETURNING id;
            `;
            log(`[SQL] 插入功率數據: ${msg.params[0]}`);
            break;

        case 'batch_insert_power_data':
            // 批次插入
            if (msg.batch_data && Array.isArray(msg.batch_data) && msg.batch_data.length > 0) {
                const values = msg.batch_data.map((data, idx) => {
                    const offset = idx * 7;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                }).join(',');

                msg.query = `
                    INSERT INTO power_data 
                    (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                    VALUES ${values}
                    ON CONFLICT (device_id, timestamp) DO UPDATE SET
                        pg = EXCLUDED.pg,
                        pa = EXCLUDED.pa,
                        pp = EXCLUDED.pp,
                        pga_efficiency = EXCLUDED.pga_efficiency,
                        pgp_efficiency = EXCLUDED.pgp_efficiency
                    RETURNING id;
                `;
                msg.params = msg.batch_data.flat();
                log(`[SQL] 批次插入 ${msg.batch_data.length} 筆數據`);
            } else {
                log('[SQL] 批次插入失敗：無有效數據');
                msg.query = null;
            }
            break;

        case 'get_latest_data':
            // 確保至少有 2 個參數
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            if (msg.params.length < 2) {
                msg.params.push(10);
            }
            msg.query = `
                SELECT * FROM power_data
                WHERE device_id = $1
                ORDER BY timestamp DESC
                LIMIT $2;
            `;
            log(`[SQL] 查詢最新數據: ${msg.params[0]}`);
            break;

        case 'get_data_by_timerange':
            if (msg.params.length < 3) {
                log('[SQL] 時間範圍查詢需要 3 個參數');
                msg.query = null;
            } else {
                msg.query = `
                    SELECT * FROM power_data
                    WHERE device_id = $1 
                    AND timestamp BETWEEN $2 AND $3
                    ORDER BY timestamp DESC;
                `;
                log(`[SQL] 查詢時間範圍數據: ${msg.params[0]}`);
            }
            break;

        // ========================================
        // 設備管理
        // ========================================
        case 'update_device_status':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                UPDATE devices 
                SET last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $1
                RETURNING device_id, last_seen;
            `;
            log(`[SQL] 更新設備狀態: ${msg.params[0]}`);
            break;

        case 'upsert_device':
            while (msg.params.length < 3) {
                msg.params.push('');
            }
            msg.query = `
                INSERT INTO devices (device_id, device_name, location)
                VALUES ($1, $2, $3)
                ON CONFLICT (device_id) 
                DO UPDATE SET 
                    device_name = EXCLUDED.device_name,
                    location = EXCLUDED.location,
                    last_seen = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 註冊/更新設備: ${msg.params[0]}`);
            break;

        case 'get_all_devices':
            msg.query = `
                SELECT 
                    d.*,
                    c.factor_a,
                    c.factor_p,
                    (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                ORDER BY d.device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有設備狀態');
            break;

        // ========================================
        // 配置管理（移除 pizero）
        // ========================================
        case 'get_config':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    device_id,
                    factor_a,
                    factor_p,
                    updated_at
                FROM config
                WHERE device_id = $1;
            `;
            log(`[SQL] 查詢配置: ${msg.params[0]}`);
            break;

        case 'update_config':
            // 確保有 3 個參數（移除 pizero_on, pizero_off）
            while (msg.params.length < 3) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else {
                    msg.params.push(1.0);
                }
            }
            msg.query = `
                INSERT INTO config 
                (device_id, factor_a, factor_p, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    factor_a = EXCLUDED.factor_a,
                    factor_p = EXCLUDED.factor_p,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 更新配置: ${msg.params[0]}`);
            log(`[SQL]   Factor_A: ${msg.params[1]}`);
            log(`[SQL]   Factor_P: ${msg.params[2]}`);
            break;

        case 'get_device_info':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    d.device_id,
                    d.device_name,
                    d.location,
                    d.last_seen,
                    c.factor_a,
                    c.factor_p
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                WHERE d.device_id = $1;
            `;
            log(`[SQL] 查詢設備完整資訊: ${msg.params[0]}`);
            break;

        // ========================================
        // 統計查詢
        // ========================================
        case 'get_hourly_stats':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE_TRUNC('hour', timestamp) as hour,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    MAX(pg) as max_pg,
                    MIN(pg) as min_pg,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour, device_id
                ORDER BY hour DESC;
            `;
            log(`[SQL] 查詢小時統計: ${msg.params[0]}`);
            break;

        case 'get_daily_summary':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE(timestamp) as date,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    SUM(pg) as total_pg,
                    AVG(pga_efficiency) as avg_pga_eff,
                    AVG(pgp_efficiency) as avg_pgp_eff,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date, device_id
                ORDER BY date DESC;
            `;
            log(`[SQL] 查詢每日總結: ${msg.params[0]}`);
            break;

        // ========================================
        // GPS 位置管理
        // ========================================
        case 'upsert_gps_location':
            while (msg.params.length < 6) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else if (msg.params.length <= 2) {
                    msg.params.push(0);
                } else if (msg.params.length === 3) {
                    msg.params.push(0);
                } else if (msg.params.length === 4) {
                    msg.params.push(0);
                } else {
                    msg.params.push(new Date().toISOString());
                }
            }

            msg.query = `
                INSERT INTO gps_locations 
                (device_id, latitude, longitude, altitude, satellites, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    altitude = EXCLUDED.altitude,
                    satellites = EXCLUDED.satellites,
                    timestamp = EXCLUDED.timestamp,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            log(`[SQL] 插入/更新 GPS: ${msg.params[0]} (${msg.params[1]}, ${msg.params[2]})`);
            break;

        case 'get_gps_location':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }

            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                WHERE device_id = $1;
            `;

            log(`[SQL] 查詢 GPS: ${msg.params[0]}`);
            break;

        case 'get_all_gps_locations':
            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                ORDER BY device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有 GPS');
            break;

        case 'create_gps_table':
            msg.query = `
                CREATE TABLE IF NOT EXISTS gps_locations (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION DEFAULT 0,
                    satellites INTEGER DEFAULT 0,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_device_gps UNIQUE (device_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_gps_device ON gps_locations(device_id);
                CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
            `;
            msg.params = [];
            log('[SQL] 建立 GPS 表格');
            break;

        // ========================================
        // 測試數據
        // ========================================
        case 'insert_test_data':
            const now = new Date();
            const deviceId = msg.params[0] || '6002';
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            msg.params = [
                deviceId,
                now.toISOString(),
                Math.floor(Math.random() * 50) + 150,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 180,
                Math.random() * 20 + 30,
                Math.random() * 20 + 20
            ];
            log('[SQL] 插入測試數據');
            break;

        default:
            log(`[SQL] 未處理的查詢類型: ${msg.query_type}`);
            msg.query = null;
            break;
    }

    // 設定狀態
    if (msg.query) {
        setStatus("green", "dot", `SQL: ${msg.query_type}`);
    } else {
        setStatus("yellow", "ring", "無 SQL");
    }

} catch (error) {
    log(`[SQL] 錯誤: ${error.message}`);
    msg.error = error.message;
    setStatus("red", "ring", "錯誤");
}

return msg;

// =================================================================
// 📋 支援的查詢類型清單
// =================================================================
//
// 【系統管理】
//   test_connection, list_tables, create_gps_table
//
// 【功率數據】
//   insert_power_data, batch_insert_power_data, 
//   get_latest_data, get_data_by_timerange
//
// 【設備管理】
//   update_device_status, upsert_device, get_all_devices
//
// 【配置管理】（移除 pizero）
//   get_config, update_config, get_device_info
//
// 【統計查詢】
//   get_hourly_stats, get_daily_summary
//
// 【GPS 位置】
//   upsert_gps_location, get_gps_location, get_all_gps_locations
//
// 【測試】
//   insert_test_data
//
// =================================================================
```

#### SQL生成器

- **ID**: `4d7bb9d2a4c09c70`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 動態 SQL 生成器 - 統一版（移除 pizero）
// 版本: V5.0
// 適用於獨立 solar_db 資料庫
// 
// 整合所有 SQL 操作：
// - 功率數據、GPS、配置、設備狀態、統計
// =================================================================

// 確保 msg 物件存在
if (!msg) {
    msg = {};
}

// 檢查是否為資料庫操作
if (!msg.query_type) {
    return msg;
}

// 檢查 params 是否存在
if (!msg.params) {
    msg.params = [];
}

// 日誌輸出
const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 設定狀態
const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log(`[SQL] 類型: ${msg.query_type}, 參數: ${JSON.stringify(msg.params)}`);

try {
    switch (msg.query_type) {
        // ========================================
        // 系統管理 SQL
        // ========================================
        case 'test_connection':
            msg.query = 'SELECT version(), current_database();';
            msg.params = [];
            log('[SQL] 測試資料庫連線');
            break;

        case 'list_tables':
            msg.query = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `;
            msg.params = [];
            log('[SQL] 列出所有資料表');
            break;

        // ========================================
        // 功率數據操作
        // ========================================
        case 'insert_power_data':
            // 確保有 7 個參數
            while (msg.params.length < 7) {
                msg.params.push(null);
            }
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id, timestamp) DO UPDATE SET
                    pg = EXCLUDED.pg,
                    pa = EXCLUDED.pa,
                    pp = EXCLUDED.pp,
                    pga_efficiency = EXCLUDED.pga_efficiency,
                    pgp_efficiency = EXCLUDED.pgp_efficiency
                RETURNING id;
            `;
            log(`[SQL] 插入功率數據: ${msg.params[0]}`);
            break;

        case 'batch_insert_power_data':
            // 批次插入
            if (msg.batch_data && Array.isArray(msg.batch_data) && msg.batch_data.length > 0) {
                const values = msg.batch_data.map((data, idx) => {
                    const offset = idx * 7;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                }).join(',');

                msg.query = `
                    INSERT INTO power_data 
                    (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                    VALUES ${values}
                    ON CONFLICT (device_id, timestamp) DO UPDATE SET
                        pg = EXCLUDED.pg,
                        pa = EXCLUDED.pa,
                        pp = EXCLUDED.pp,
                        pga_efficiency = EXCLUDED.pga_efficiency,
                        pgp_efficiency = EXCLUDED.pgp_efficiency
                    RETURNING id;
                `;
                msg.params = msg.batch_data.flat();
                log(`[SQL] 批次插入 ${msg.batch_data.length} 筆數據`);
            } else {
                log('[SQL] 批次插入失敗：無有效數據');
                msg.query = null;
            }
            break;

        case 'get_latest_data':
            // 確保至少有 2 個參數
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            if (msg.params.length < 2) {
                msg.params.push(10);
            }
            msg.query = `
                SELECT * FROM power_data
                WHERE device_id = $1
                ORDER BY timestamp DESC
                LIMIT $2;
            `;
            log(`[SQL] 查詢最新數據: ${msg.params[0]}`);
            break;

        case 'get_data_by_timerange':
            if (msg.params.length < 3) {
                log('[SQL] 時間範圍查詢需要 3 個參數');
                msg.query = null;
            } else {
                msg.query = `
                    SELECT * FROM power_data
                    WHERE device_id = $1 
                    AND timestamp BETWEEN $2 AND $3
                    ORDER BY timestamp DESC;
                `;
                log(`[SQL] 查詢時間範圍數據: ${msg.params[0]}`);
            }
            break;

        // ========================================
        // 設備管理
        // ========================================
        case 'update_device_status':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                UPDATE devices 
                SET last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $1
                RETURNING device_id, last_seen;
            `;
            log(`[SQL] 更新設備狀態: ${msg.params[0]}`);
            break;

        case 'upsert_device':
            while (msg.params.length < 3) {
                msg.params.push('');
            }
            msg.query = `
                INSERT INTO devices (device_id, device_name, location)
                VALUES ($1, $2, $3)
                ON CONFLICT (device_id) 
                DO UPDATE SET 
                    device_name = EXCLUDED.device_name,
                    location = EXCLUDED.location,
                    last_seen = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 註冊/更新設備: ${msg.params[0]}`);
            break;

        case 'get_all_devices':
            msg.query = `
                SELECT 
                    d.*,
                    c.factor_a,
                    c.factor_p,
                    (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                ORDER BY d.device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有設備狀態');
            break;

        // ========================================
        // 配置管理（移除 pizero）
        // ========================================
        case 'get_config':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    device_id,
                    factor_a,
                    factor_p,
                    updated_at
                FROM config
                WHERE device_id = $1;
            `;
            log(`[SQL] 查詢配置: ${msg.params[0]}`);
            break;

        case 'update_config':
            // 確保有 3 個參數（移除 pizero_on, pizero_off）
            while (msg.params.length < 3) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else {
                    msg.params.push(1.0);
                }
            }
            msg.query = `
                INSERT INTO config 
                (device_id, factor_a, factor_p, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    factor_a = EXCLUDED.factor_a,
                    factor_p = EXCLUDED.factor_p,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 更新配置: ${msg.params[0]}`);
            log(`[SQL]   Factor_A: ${msg.params[1]}`);
            log(`[SQL]   Factor_P: ${msg.params[2]}`);
            break;

        case 'get_device_info':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    d.device_id,
                    d.device_name,
                    d.location,
                    d.last_seen,
                    c.factor_a,
                    c.factor_p
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                WHERE d.device_id = $1;
            `;
            log(`[SQL] 查詢設備完整資訊: ${msg.params[0]}`);
            break;

        // ========================================
        // 統計查詢
        // ========================================
        case 'get_hourly_stats':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE_TRUNC('hour', timestamp) as hour,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    MAX(pg) as max_pg,
                    MIN(pg) as min_pg,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour, device_id
                ORDER BY hour DESC;
            `;
            log(`[SQL] 查詢小時統計: ${msg.params[0]}`);
            break;

        case 'get_daily_summary':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE(timestamp) as date,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    SUM(pg) as total_pg,
                    AVG(pga_efficiency) as avg_pga_eff,
                    AVG(pgp_efficiency) as avg_pgp_eff,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date, device_id
                ORDER BY date DESC;
            `;
            log(`[SQL] 查詢每日總結: ${msg.params[0]}`);
            break;

        // ========================================
        // GPS 位置管理
        // ========================================
        case 'upsert_gps_location':
            while (msg.params.length < 6) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else if (msg.params.length <= 2) {
                    msg.params.push(0);
                } else if (msg.params.length === 3) {
                    msg.params.push(0);
                } else if (msg.params.length === 4) {
                    msg.params.push(0);
                } else {
                    msg.params.push(new Date().toISOString());
                }
            }

            msg.query = `
                INSERT INTO gps_locations 
                (device_id, latitude, longitude, altitude, satellites, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    altitude = EXCLUDED.altitude,
                    satellites = EXCLUDED.satellites,
                    timestamp = EXCLUDED.timestamp,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            log(`[SQL] 插入/更新 GPS: ${msg.params[0]} (${msg.params[1]}, ${msg.params[2]})`);
            break;

        case 'get_gps_location':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }

            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                WHERE device_id = $1;
            `;

            log(`[SQL] 查詢 GPS: ${msg.params[0]}`);
            break;

        case 'get_all_gps_locations':
            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                ORDER BY device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有 GPS');
            break;

        case 'create_gps_table':
            msg.query = `
                CREATE TABLE IF NOT EXISTS gps_locations (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION DEFAULT 0,
                    satellites INTEGER DEFAULT 0,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_device_gps UNIQUE (device_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_gps_device ON gps_locations(device_id);
                CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
            `;
            msg.params = [];
            log('[SQL] 建立 GPS 表格');
            break;

        // ========================================
        // 測試數據
        // ========================================
        case 'insert_test_data':
            const now = new Date();
            const deviceId = msg.params[0] || '6002';
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            msg.params = [
                deviceId,
                now.toISOString(),
                Math.floor(Math.random() * 50) + 150,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 180,
                Math.random() * 20 + 30,
                Math.random() * 20 + 20
            ];
            log('[SQL] 插入測試數據');
            break;

        default:
            log(`[SQL] 未處理的查詢類型: ${msg.query_type}`);
            msg.query = null;
            break;
    }

    // 設定狀態
    if (msg.query) {
        setStatus("green", "dot", `SQL: ${msg.query_type}`);
    } else {
        setStatus("yellow", "ring", "無 SQL");
    }

} catch (error) {
    log(`[SQL] 錯誤: ${error.message}`);
    msg.error = error.message;
    setStatus("red", "ring", "錯誤");
}

return msg;

// =================================================================
// 📋 支援的查詢類型清單
// =================================================================
//
// 【系統管理】
//   test_connection, list_tables, create_gps_table
//
// 【功率數據】
//   insert_power_data, batch_insert_power_data, 
//   get_latest_data, get_data_by_timerange
//
// 【設備管理】
//   update_device_status, upsert_device, get_all_devices
//
// 【配置管理】（移除 pizero）
//   get_config, update_config, get_device_info
//
// 【統計查詢】
//   get_hourly_stats, get_daily_summary
//
// 【GPS 位置】
//   upsert_gps_location, get_gps_location, get_all_gps_locations
//
// 【測試】
//   insert_test_data
//
// =================================================================
```

#### SQL生成器

- **ID**: `b71bb8b4f401e6c3`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 動態 SQL 生成器 - 統一版（移除 pizero）
// 版本: V5.0
// 適用於獨立 solar_db 資料庫
// 
// 整合所有 SQL 操作：
// - 功率數據、GPS、配置、設備狀態、統計
// =================================================================

// 確保 msg 物件存在
if (!msg) {
    msg = {};
}

// 檢查是否為資料庫操作
if (!msg.query_type) {
    return msg;
}

// 檢查 params 是否存在
if (!msg.params) {
    msg.params = [];
}

// 日誌輸出
const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 設定狀態
const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log(`[SQL] 類型: ${msg.query_type}, 參數: ${JSON.stringify(msg.params)}`);

try {
    switch (msg.query_type) {
        // ========================================
        // 系統管理 SQL
        // ========================================
        case 'test_connection':
            msg.query = 'SELECT version(), current_database();';
            msg.params = [];
            log('[SQL] 測試資料庫連線');
            break;

        case 'list_tables':
            msg.query = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `;
            msg.params = [];
            log('[SQL] 列出所有資料表');
            break;

        // ========================================
        // 功率數據操作
        // ========================================
        case 'insert_power_data':
            // 確保有 7 個參數
            while (msg.params.length < 7) {
                msg.params.push(null);
            }
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id, timestamp) DO UPDATE SET
                    pg = EXCLUDED.pg,
                    pa = EXCLUDED.pa,
                    pp = EXCLUDED.pp,
                    pga_efficiency = EXCLUDED.pga_efficiency,
                    pgp_efficiency = EXCLUDED.pgp_efficiency
                RETURNING id;
            `;
            log(`[SQL] 插入功率數據: ${msg.params[0]}`);
            break;

        case 'batch_insert_power_data':
            // 批次插入
            if (msg.batch_data && Array.isArray(msg.batch_data) && msg.batch_data.length > 0) {
                const values = msg.batch_data.map((data, idx) => {
                    const offset = idx * 7;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                }).join(',');

                msg.query = `
                    INSERT INTO power_data 
                    (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                    VALUES ${values}
                    ON CONFLICT (device_id, timestamp) DO UPDATE SET
                        pg = EXCLUDED.pg,
                        pa = EXCLUDED.pa,
                        pp = EXCLUDED.pp,
                        pga_efficiency = EXCLUDED.pga_efficiency,
                        pgp_efficiency = EXCLUDED.pgp_efficiency
                    RETURNING id;
                `;
                msg.params = msg.batch_data.flat();
                log(`[SQL] 批次插入 ${msg.batch_data.length} 筆數據`);
            } else {
                log('[SQL] 批次插入失敗：無有效數據');
                msg.query = null;
            }
            break;

        case 'get_latest_data':
            // 確保至少有 2 個參數
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            if (msg.params.length < 2) {
                msg.params.push(10);
            }
            msg.query = `
                SELECT * FROM power_data
                WHERE device_id = $1
                ORDER BY timestamp DESC
                LIMIT $2;
            `;
            log(`[SQL] 查詢最新數據: ${msg.params[0]}`);
            break;

        case 'get_data_by_timerange':
            if (msg.params.length < 3) {
                log('[SQL] 時間範圍查詢需要 3 個參數');
                msg.query = null;
            } else {
                msg.query = `
                    SELECT * FROM power_data
                    WHERE device_id = $1 
                    AND timestamp BETWEEN $2 AND $3
                    ORDER BY timestamp DESC;
                `;
                log(`[SQL] 查詢時間範圍數據: ${msg.params[0]}`);
            }
            break;

        // ========================================
        // 設備管理
        // ========================================
        case 'update_device_status':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                UPDATE devices 
                SET last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $1
                RETURNING device_id, last_seen;
            `;
            log(`[SQL] 更新設備狀態: ${msg.params[0]}`);
            break;

        case 'upsert_device':
            while (msg.params.length < 3) {
                msg.params.push('');
            }
            msg.query = `
                INSERT INTO devices (device_id, device_name, location)
                VALUES ($1, $2, $3)
                ON CONFLICT (device_id) 
                DO UPDATE SET 
                    device_name = EXCLUDED.device_name,
                    location = EXCLUDED.location,
                    last_seen = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 註冊/更新設備: ${msg.params[0]}`);
            break;

        case 'get_all_devices':
            msg.query = `
                SELECT 
                    d.*,
                    c.factor_a,
                    c.factor_p,
                    (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                ORDER BY d.device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有設備狀態');
            break;

        // ========================================
        // 配置管理（移除 pizero）
        // ========================================
        case 'get_config':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    device_id,
                    factor_a,
                    factor_p,
                    updated_at
                FROM config
                WHERE device_id = $1;
            `;
            log(`[SQL] 查詢配置: ${msg.params[0]}`);
            break;

        case 'update_config':
            // 確保有 3 個參數（移除 pizero_on, pizero_off）
            while (msg.params.length < 3) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else {
                    msg.params.push(1.0);
                }
            }
            msg.query = `
                INSERT INTO config 
                (device_id, factor_a, factor_p, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    factor_a = EXCLUDED.factor_a,
                    factor_p = EXCLUDED.factor_p,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 更新配置: ${msg.params[0]}`);
            log(`[SQL]   Factor_A: ${msg.params[1]}`);
            log(`[SQL]   Factor_P: ${msg.params[2]}`);
            break;

        case 'get_device_info':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    d.device_id,
                    d.device_name,
                    d.location,
                    d.last_seen,
                    c.factor_a,
                    c.factor_p
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                WHERE d.device_id = $1;
            `;
            log(`[SQL] 查詢設備完整資訊: ${msg.params[0]}`);
            break;

        // ========================================
        // 統計查詢
        // ========================================
        case 'get_hourly_stats':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE_TRUNC('hour', timestamp) as hour,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    MAX(pg) as max_pg,
                    MIN(pg) as min_pg,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour, device_id
                ORDER BY hour DESC;
            `;
            log(`[SQL] 查詢小時統計: ${msg.params[0]}`);
            break;

        case 'get_daily_summary':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE(timestamp) as date,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    SUM(pg) as total_pg,
                    AVG(pga_efficiency) as avg_pga_eff,
                    AVG(pgp_efficiency) as avg_pgp_eff,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date, device_id
                ORDER BY date DESC;
            `;
            log(`[SQL] 查詢每日總結: ${msg.params[0]}`);
            break;

        // ========================================
        // GPS 位置管理
        // ========================================
        case 'upsert_gps_location':
            while (msg.params.length < 6) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else if (msg.params.length <= 2) {
                    msg.params.push(0);
                } else if (msg.params.length === 3) {
                    msg.params.push(0);
                } else if (msg.params.length === 4) {
                    msg.params.push(0);
                } else {
                    msg.params.push(new Date().toISOString());
                }
            }

            msg.query = `
                INSERT INTO gps_locations 
                (device_id, latitude, longitude, altitude, satellites, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    altitude = EXCLUDED.altitude,
                    satellites = EXCLUDED.satellites,
                    timestamp = EXCLUDED.timestamp,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            log(`[SQL] 插入/更新 GPS: ${msg.params[0]} (${msg.params[1]}, ${msg.params[2]})`);
            break;

        case 'get_gps_location':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }

            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                WHERE device_id = $1;
            `;

            log(`[SQL] 查詢 GPS: ${msg.params[0]}`);
            break;

        case 'get_all_gps_locations':
            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                ORDER BY device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有 GPS');
            break;

        case 'create_gps_table':
            msg.query = `
                CREATE TABLE IF NOT EXISTS gps_locations (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION DEFAULT 0,
                    satellites INTEGER DEFAULT 0,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_device_gps UNIQUE (device_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_gps_device ON gps_locations(device_id);
                CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
            `;
            msg.params = [];
            log('[SQL] 建立 GPS 表格');
            break;

        // ========================================
        // 測試數據
        // ========================================
        case 'insert_test_data':
            const now = new Date();
            const deviceId = msg.params[0] || '6002';
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            msg.params = [
                deviceId,
                now.toISOString(),
                Math.floor(Math.random() * 50) + 150,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 180,
                Math.random() * 20 + 30,
                Math.random() * 20 + 20
            ];
            log('[SQL] 插入測試數據');
            break;

        default:
            log(`[SQL] 未處理的查詢類型: ${msg.query_type}`);
            msg.query = null;
            break;
    }

    // 設定狀態
    if (msg.query) {
        setStatus("green", "dot", `SQL: ${msg.query_type}`);
    } else {
        setStatus("yellow", "ring", "無 SQL");
    }

} catch (error) {
    log(`[SQL] 錯誤: ${error.message}`);
    msg.error = error.message;
    setStatus("red", "ring", "錯誤");
}

return msg;

// =================================================================
// 📋 支援的查詢類型清單
// =================================================================
//
// 【系統管理】
//   test_connection, list_tables, create_gps_table
//
// 【功率數據】
//   insert_power_data, batch_insert_power_data, 
//   get_latest_data, get_data_by_timerange
//
// 【設備管理】
//   update_device_status, upsert_device, get_all_devices
//
// 【配置管理】（移除 pizero）
//   get_config, update_config, get_device_info
//
// 【統計查詢】
//   get_hourly_stats, get_daily_summary
//
// 【GPS 位置】
//   upsert_gps_location, get_gps_location, get_all_gps_locations
//
// 【測試】
//   insert_test_data
//
// =================================================================
```

#### SQL生成器

- **ID**: `d96f189b2b19cb3d`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 動態 SQL 生成器 - 統一版（移除 pizero）
// 版本: V5.0
// 適用於獨立 solar_db 資料庫
// 
// 整合所有 SQL 操作：
// - 功率數據、GPS、配置、設備狀態、統計
// =================================================================

// 確保 msg 物件存在
if (!msg) {
    msg = {};
}

// 檢查是否為資料庫操作
if (!msg.query_type) {
    return msg;
}

// 檢查 params 是否存在
if (!msg.params) {
    msg.params = [];
}

// 日誌輸出
const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 設定狀態
const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log(`[SQL] 類型: ${msg.query_type}, 參數: ${JSON.stringify(msg.params)}`);

try {
    switch (msg.query_type) {
        // ========================================
        // 系統管理 SQL
        // ========================================
        case 'test_connection':
            msg.query = 'SELECT version(), current_database();';
            msg.params = [];
            log('[SQL] 測試資料庫連線');
            break;

        case 'list_tables':
            msg.query = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `;
            msg.params = [];
            log('[SQL] 列出所有資料表');
            break;

        // ========================================
        // 功率數據操作
        // ========================================
        case 'insert_power_data':
            // 確保有 7 個參數
            while (msg.params.length < 7) {
                msg.params.push(null);
            }
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id, timestamp) DO UPDATE SET
                    pg = EXCLUDED.pg,
                    pa = EXCLUDED.pa,
                    pp = EXCLUDED.pp,
                    pga_efficiency = EXCLUDED.pga_efficiency,
                    pgp_efficiency = EXCLUDED.pgp_efficiency
                RETURNING id;
            `;
            log(`[SQL] 插入功率數據: ${msg.params[0]}`);
            break;

        case 'batch_insert_power_data':
            // 批次插入
            if (msg.batch_data && Array.isArray(msg.batch_data) && msg.batch_data.length > 0) {
                const values = msg.batch_data.map((data, idx) => {
                    const offset = idx * 7;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                }).join(',');

                msg.query = `
                    INSERT INTO power_data 
                    (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                    VALUES ${values}
                    ON CONFLICT (device_id, timestamp) DO UPDATE SET
                        pg = EXCLUDED.pg,
                        pa = EXCLUDED.pa,
                        pp = EXCLUDED.pp,
                        pga_efficiency = EXCLUDED.pga_efficiency,
                        pgp_efficiency = EXCLUDED.pgp_efficiency
                    RETURNING id;
                `;
                msg.params = msg.batch_data.flat();
                log(`[SQL] 批次插入 ${msg.batch_data.length} 筆數據`);
            } else {
                log('[SQL] 批次插入失敗：無有效數據');
                msg.query = null;
            }
            break;

        case 'get_latest_data':
            // 確保至少有 2 個參數
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            if (msg.params.length < 2) {
                msg.params.push(10);
            }
            msg.query = `
                SELECT * FROM power_data
                WHERE device_id = $1
                ORDER BY timestamp DESC
                LIMIT $2;
            `;
            log(`[SQL] 查詢最新數據: ${msg.params[0]}`);
            break;

        case 'get_data_by_timerange':
            if (msg.params.length < 3) {
                log('[SQL] 時間範圍查詢需要 3 個參數');
                msg.query = null;
            } else {
                msg.query = `
                    SELECT * FROM power_data
                    WHERE device_id = $1 
                    AND timestamp BETWEEN $2 AND $3
                    ORDER BY timestamp DESC;
                `;
                log(`[SQL] 查詢時間範圍數據: ${msg.params[0]}`);
            }
            break;

        // ========================================
        // 設備管理
        // ========================================
        case 'update_device_status':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                UPDATE devices 
                SET last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $1
                RETURNING device_id, last_seen;
            `;
            log(`[SQL] 更新設備狀態: ${msg.params[0]}`);
            break;

        case 'upsert_device':
            while (msg.params.length < 3) {
                msg.params.push('');
            }
            msg.query = `
                INSERT INTO devices (device_id, device_name, location)
                VALUES ($1, $2, $3)
                ON CONFLICT (device_id) 
                DO UPDATE SET 
                    device_name = EXCLUDED.device_name,
                    location = EXCLUDED.location,
                    last_seen = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 註冊/更新設備: ${msg.params[0]}`);
            break;

        case 'get_all_devices':
            msg.query = `
                SELECT 
                    d.*,
                    c.factor_a,
                    c.factor_p,
                    (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                ORDER BY d.device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有設備狀態');
            break;

        // ========================================
        // 配置管理（移除 pizero）
        // ========================================
        case 'get_config':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    device_id,
                    factor_a,
                    factor_p,
                    updated_at
                FROM config
                WHERE device_id = $1;
            `;
            log(`[SQL] 查詢配置: ${msg.params[0]}`);
            break;

        case 'update_config':
            // 確保有 3 個參數（移除 pizero_on, pizero_off）
            while (msg.params.length < 3) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else {
                    msg.params.push(1.0);
                }
            }
            msg.query = `
                INSERT INTO config 
                (device_id, factor_a, factor_p, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    factor_a = EXCLUDED.factor_a,
                    factor_p = EXCLUDED.factor_p,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 更新配置: ${msg.params[0]}`);
            log(`[SQL]   Factor_A: ${msg.params[1]}`);
            log(`[SQL]   Factor_P: ${msg.params[2]}`);
            break;

        case 'get_device_info':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    d.device_id,
                    d.device_name,
                    d.location,
                    d.last_seen,
                    c.factor_a,
                    c.factor_p
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                WHERE d.device_id = $1;
            `;
            log(`[SQL] 查詢設備完整資訊: ${msg.params[0]}`);
            break;

        // ========================================
        // 統計查詢
        // ========================================
        case 'get_hourly_stats':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE_TRUNC('hour', timestamp) as hour,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    MAX(pg) as max_pg,
                    MIN(pg) as min_pg,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour, device_id
                ORDER BY hour DESC;
            `;
            log(`[SQL] 查詢小時統計: ${msg.params[0]}`);
            break;

        case 'get_daily_summary':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE(timestamp) as date,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    SUM(pg) as total_pg,
                    AVG(pga_efficiency) as avg_pga_eff,
                    AVG(pgp_efficiency) as avg_pgp_eff,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date, device_id
                ORDER BY date DESC;
            `;
            log(`[SQL] 查詢每日總結: ${msg.params[0]}`);
            break;

        // ========================================
        // GPS 位置管理
        // ========================================
        case 'upsert_gps_location':
            while (msg.params.length < 6) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else if (msg.params.length <= 2) {
                    msg.params.push(0);
                } else if (msg.params.length === 3) {
                    msg.params.push(0);
                } else if (msg.params.length === 4) {
                    msg.params.push(0);
                } else {
                    msg.params.push(new Date().toISOString());
                }
            }

            msg.query = `
                INSERT INTO gps_locations 
                (device_id, latitude, longitude, altitude, satellites, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    altitude = EXCLUDED.altitude,
                    satellites = EXCLUDED.satellites,
                    timestamp = EXCLUDED.timestamp,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            log(`[SQL] 插入/更新 GPS: ${msg.params[0]} (${msg.params[1]}, ${msg.params[2]})`);
            break;

        case 'get_gps_location':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }

            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                WHERE device_id = $1;
            `;

            log(`[SQL] 查詢 GPS: ${msg.params[0]}`);
            break;

        case 'get_all_gps_locations':
            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                ORDER BY device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有 GPS');
            break;

        case 'create_gps_table':
            msg.query = `
                CREATE TABLE IF NOT EXISTS gps_locations (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION DEFAULT 0,
                    satellites INTEGER DEFAULT 0,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_device_gps UNIQUE (device_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_gps_device ON gps_locations(device_id);
                CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
            `;
            msg.params = [];
            log('[SQL] 建立 GPS 表格');
            break;

        // ========================================
        // 測試數據
        // ========================================
        case 'insert_test_data':
            const now = new Date();
            const deviceId = msg.params[0] || '6002';
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            msg.params = [
                deviceId,
                now.toISOString(),
                Math.floor(Math.random() * 50) + 150,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 180,
                Math.random() * 20 + 30,
                Math.random() * 20 + 20
            ];
            log('[SQL] 插入測試數據');
            break;

        default:
            log(`[SQL] 未處理的查詢類型: ${msg.query_type}`);
            msg.query = null;
            break;
    }

    // 設定狀態
    if (msg.query) {
        setStatus("green", "dot", `SQL: ${msg.query_type}`);
    } else {
        setStatus("yellow", "ring", "無 SQL");
    }

} catch (error) {
    log(`[SQL] 錯誤: ${error.message}`);
    msg.error = error.message;
    setStatus("red", "ring", "錯誤");
}

return msg;

// =================================================================
// 📋 支援的查詢類型清單
// =================================================================
//
// 【系統管理】
//   test_connection, list_tables, create_gps_table
//
// 【功率數據】
//   insert_power_data, batch_insert_power_data, 
//   get_latest_data, get_data_by_timerange
//
// 【設備管理】
//   update_device_status, upsert_device, get_all_devices
//
// 【配置管理】（移除 pizero）
//   get_config, update_config, get_device_info
//
// 【統計查詢】
//   get_hourly_stats, get_daily_summary
//
// 【GPS 位置】
//   upsert_gps_location, get_gps_location, get_all_gps_locations
//
// 【測試】
//   insert_test_data
//
// =================================================================
```

#### SQL生成器

- **ID**: `849a5c2380d839b8`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 動態 SQL 生成器 - 統一版（移除 pizero）
// 版本: V5.0
// 適用於獨立 solar_db 資料庫
// 
// 整合所有 SQL 操作：
// - 功率數據、GPS、配置、設備狀態、統計
// =================================================================

// 確保 msg 物件存在
if (!msg) {
    msg = {};
}

// 檢查是否為資料庫操作
if (!msg.query_type) {
    return msg;
}

// 檢查 params 是否存在
if (!msg.params) {
    msg.params = [];
}

// 日誌輸出
const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 設定狀態
const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log(`[SQL] 類型: ${msg.query_type}, 參數: ${JSON.stringify(msg.params)}`);

try {
    switch (msg.query_type) {
        // ========================================
        // 系統管理 SQL
        // ========================================
        case 'test_connection':
            msg.query = 'SELECT version(), current_database();';
            msg.params = [];
            log('[SQL] 測試資料庫連線');
            break;

        case 'list_tables':
            msg.query = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            `;
            msg.params = [];
            log('[SQL] 列出所有資料表');
            break;

        // ========================================
        // 功率數據操作
        // ========================================
        case 'insert_power_data':
            // 確保有 7 個參數
            while (msg.params.length < 7) {
                msg.params.push(null);
            }
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id, timestamp) DO UPDATE SET
                    pg = EXCLUDED.pg,
                    pa = EXCLUDED.pa,
                    pp = EXCLUDED.pp,
                    pga_efficiency = EXCLUDED.pga_efficiency,
                    pgp_efficiency = EXCLUDED.pgp_efficiency
                RETURNING id;
            `;
            log(`[SQL] 插入功率數據: ${msg.params[0]}`);
            break;

        case 'batch_insert_power_data':
            // 批次插入
            if (msg.batch_data && Array.isArray(msg.batch_data) && msg.batch_data.length > 0) {
                const values = msg.batch_data.map((data, idx) => {
                    const offset = idx * 7;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                }).join(',');

                msg.query = `
                    INSERT INTO power_data 
                    (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                    VALUES ${values}
                    ON CONFLICT (device_id, timestamp) DO UPDATE SET
                        pg = EXCLUDED.pg,
                        pa = EXCLUDED.pa,
                        pp = EXCLUDED.pp,
                        pga_efficiency = EXCLUDED.pga_efficiency,
                        pgp_efficiency = EXCLUDED.pgp_efficiency
                    RETURNING id;
                `;
                msg.params = msg.batch_data.flat();
                log(`[SQL] 批次插入 ${msg.batch_data.length} 筆數據`);
            } else {
                log('[SQL] 批次插入失敗：無有效數據');
                msg.query = null;
            }
            break;

        case 'get_latest_data':
            // 確保至少有 2 個參數
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            if (msg.params.length < 2) {
                msg.params.push(10);
            }
            msg.query = `
                SELECT * FROM power_data
                WHERE device_id = $1
                ORDER BY timestamp DESC
                LIMIT $2;
            `;
            log(`[SQL] 查詢最新數據: ${msg.params[0]}`);
            break;

        case 'get_data_by_timerange':
            if (msg.params.length < 3) {
                log('[SQL] 時間範圍查詢需要 3 個參數');
                msg.query = null;
            } else {
                msg.query = `
                    SELECT * FROM power_data
                    WHERE device_id = $1 
                    AND timestamp BETWEEN $2 AND $3
                    ORDER BY timestamp DESC;
                `;
                log(`[SQL] 查詢時間範圍數據: ${msg.params[0]}`);
            }
            break;

        // ========================================
        // 設備管理
        // ========================================
        case 'update_device_status':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                UPDATE devices 
                SET last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $1
                RETURNING device_id, last_seen;
            `;
            log(`[SQL] 更新設備狀態: ${msg.params[0]}`);
            break;

        case 'upsert_device':
            while (msg.params.length < 3) {
                msg.params.push('');
            }
            msg.query = `
                INSERT INTO devices (device_id, device_name, location)
                VALUES ($1, $2, $3)
                ON CONFLICT (device_id) 
                DO UPDATE SET 
                    device_name = EXCLUDED.device_name,
                    location = EXCLUDED.location,
                    last_seen = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 註冊/更新設備: ${msg.params[0]}`);
            break;

        case 'get_all_devices':
            msg.query = `
                SELECT 
                    d.*,
                    c.factor_a,
                    c.factor_p,
                    (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                ORDER BY d.device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有設備狀態');
            break;

        // ========================================
        // 配置管理（移除 pizero）
        // ========================================
        case 'get_config':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    device_id,
                    factor_a,
                    factor_p,
                    updated_at
                FROM config
                WHERE device_id = $1;
            `;
            log(`[SQL] 查詢配置: ${msg.params[0]}`);
            break;

        case 'update_config':
            // 確保有 3 個參數（移除 pizero_on, pizero_off）
            while (msg.params.length < 3) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else {
                    msg.params.push(1.0);
                }
            }
            msg.query = `
                INSERT INTO config 
                (device_id, factor_a, factor_p, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    factor_a = EXCLUDED.factor_a,
                    factor_p = EXCLUDED.factor_p,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;
            log(`[SQL] 更新配置: ${msg.params[0]}`);
            log(`[SQL]   Factor_A: ${msg.params[1]}`);
            log(`[SQL]   Factor_P: ${msg.params[2]}`);
            break;

        case 'get_device_info':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    d.device_id,
                    d.device_name,
                    d.location,
                    d.last_seen,
                    c.factor_a,
                    c.factor_p
                FROM devices d
                LEFT JOIN config c ON d.device_id = c.device_id
                WHERE d.device_id = $1;
            `;
            log(`[SQL] 查詢設備完整資訊: ${msg.params[0]}`);
            break;

        // ========================================
        // 統計查詢
        // ========================================
        case 'get_hourly_stats':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE_TRUNC('hour', timestamp) as hour,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    MAX(pg) as max_pg,
                    MIN(pg) as min_pg,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour, device_id
                ORDER BY hour DESC;
            `;
            log(`[SQL] 查詢小時統計: ${msg.params[0]}`);
            break;

        case 'get_daily_summary':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }
            msg.query = `
                SELECT 
                    DATE(timestamp) as date,
                    device_id,
                    AVG(pg) as avg_pg,
                    AVG(pa) as avg_pa,
                    AVG(pp) as avg_pp,
                    SUM(pg) as total_pg,
                    AVG(pga_efficiency) as avg_pga_eff,
                    AVG(pgp_efficiency) as avg_pgp_eff,
                    COUNT(*) as data_points
                FROM power_data
                WHERE device_id = $1
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY date, device_id
                ORDER BY date DESC;
            `;
            log(`[SQL] 查詢每日總結: ${msg.params[0]}`);
            break;

        // ========================================
        // GPS 位置管理
        // ========================================
        case 'upsert_gps_location':
            while (msg.params.length < 6) {
                if (msg.params.length === 0) {
                    msg.params.push('6002');
                } else if (msg.params.length <= 2) {
                    msg.params.push(0);
                } else if (msg.params.length === 3) {
                    msg.params.push(0);
                } else if (msg.params.length === 4) {
                    msg.params.push(0);
                } else {
                    msg.params.push(new Date().toISOString());
                }
            }

            msg.query = `
                INSERT INTO gps_locations 
                (device_id, latitude, longitude, altitude, satellites, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    altitude = EXCLUDED.altitude,
                    satellites = EXCLUDED.satellites,
                    timestamp = EXCLUDED.timestamp,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            log(`[SQL] 插入/更新 GPS: ${msg.params[0]} (${msg.params[1]}, ${msg.params[2]})`);
            break;

        case 'get_gps_location':
            if (msg.params.length < 1) {
                msg.params = ['6002'];
            }

            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                WHERE device_id = $1;
            `;

            log(`[SQL] 查詢 GPS: ${msg.params[0]}`);
            break;

        case 'get_all_gps_locations':
            msg.query = `
                SELECT 
                    device_id,
                    latitude,
                    longitude,
                    altitude,
                    satellites,
                    timestamp,
                    updated_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))/3600 as hours_ago
                FROM gps_locations
                ORDER BY device_id;
            `;
            msg.params = [];
            log('[SQL] 查詢所有 GPS');
            break;

        case 'create_gps_table':
            msg.query = `
                CREATE TABLE IF NOT EXISTS gps_locations (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(50) NOT NULL,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    altitude DOUBLE PRECISION DEFAULT 0,
                    satellites INTEGER DEFAULT 0,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_device_gps UNIQUE (device_id)
                );
                
                CREATE INDEX IF NOT EXISTS idx_gps_device ON gps_locations(device_id);
                CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_locations(timestamp DESC);
            `;
            msg.params = [];
            log('[SQL] 建立 GPS 表格');
            break;

        // ========================================
        // 測試數據
        // ========================================
        case 'insert_test_data':
            const now = new Date();
            const deviceId = msg.params[0] || '6002';
            msg.query = `
                INSERT INTO power_data 
                (device_id, timestamp, pg, pa, pp, pga_efficiency, pgp_efficiency)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            msg.params = [
                deviceId,
                now.toISOString(),
                Math.floor(Math.random() * 50) + 150,
                Math.floor(Math.random() * 50) + 200,
                Math.floor(Math.random() * 50) + 180,
                Math.random() * 20 + 30,
                Math.random() * 20 + 20
            ];
            log('[SQL] 插入測試數據');
            break;

        default:
            log(`[SQL] 未處理的查詢類型: ${msg.query_type}`);
            msg.query = null;
            break;
    }

    // 設定狀態
    if (msg.query) {
        setStatus("green", "dot", `SQL: ${msg.query_type}`);
    } else {
        setStatus("yellow", "ring", "無 SQL");
    }

} catch (error) {
    log(`[SQL] 錯誤: ${error.message}`);
    msg.error = error.message;
    setStatus("red", "ring", "錯誤");
}

return msg;

// =================================================================
// 📋 支援的查詢類型清單
// =================================================================
//
// 【系統管理】
//   test_connection, list_tables, create_gps_table
//
// 【功率數據】
//   insert_power_data, batch_insert_power_data, 
//   get_latest_data, get_data_by_timerange
//
// 【設備管理】
//   update_device_status, upsert_device, get_all_devices
//
// 【配置管理】（移除 pizero）
//   get_config, update_config, get_device_info
//
// 【統計查詢】
//   get_hourly_stats, get_daily_summary
//
// 【GPS 位置】
//   upsert_gps_location, get_gps_location, get_all_gps_locations
//
// 【測試】
//   insert_test_data
//
// =================================================================
```

#### UI->SQL(登入)

- **ID**: `751f2d49f9d3373d`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// UI→SQL 轉換器 - 修正大小寫問題
// 在 Node-RED 的 UI->SQL 節點中修改
// =================================================================

const action = msg.payload?.action;

if (!action) {
    node.warn('無動作類型');
    return null;
}

node.warn(`[UI→SQL] 動作: ${action}`);

switch (action) {
    // ========== 客戶登入查詢（不分大小寫版）==========
    case 'customer_login':
        // 保持原始輸入，不轉換大小寫
        let customerCode = msg.payload.customer_code;

        // 使用不分大小寫的 SQL 查詢
        msg.query = `
            SELECT 
                customer_code,
                customer_name,
                password,
                devices,
                is_active
            FROM customers
            WHERE LOWER(customer_code) = LOWER($1)
            AND is_active = true;
        `;
        msg.params = [customerCode];

        // 保存原始請求資料（包括 request_id）
        msg._original_request = {
            action: 'customer_login',
            customer_code: customerCode,  // 保持原始大小寫
            password: msg.payload.password,
            request_id: msg.payload.request_id
        };

        node.warn(`[UI→SQL] 查詢客戶: ${customerCode} (不分大小寫)`);
        if (msg.payload.request_id) {
            node.warn(`[UI→SQL] Request ID: ${msg.payload.request_id}`);
        }
        break;

    // ========== 查詢客戶列表 ==========
    case 'list_customers':
        msg.query = `
            SELECT 
                customer_code,
                customer_name,
                array_length(devices, 1) as device_count,
                devices,
                is_active,
                last_login,
                login_count
            FROM customers
            WHERE LOWER(customer_code) != 'admin'
            ORDER BY customer_code;
        `;
        msg.params = [];
        msg._original_request = {
            action: 'list_customers',
            target: 'admin_page'
        };
        break;

    // ========== 新增客戶 ==========
    case 'add_customer':
        msg.query = `
            INSERT INTO customers 
            (customer_code, customer_name, password, devices)
            VALUES (UPPER($1), $2, $3, $4)
            ON CONFLICT (customer_code) DO NOTHING
            RETURNING *;
        `;
        msg.params = [
            msg.payload.customer_code,  // SQL 中轉大寫
            msg.payload.customer_name,
            msg.payload.password || 'default123',
            msg.payload.devices || []
        ];
        msg._original_request = {
            action: 'add_customer',
            target: 'admin_page'
        };
        break;

    default:
        node.warn(`未處理的動作: ${action}`);
        return null;
}

node.status({
    fill: "blue",
    shape: "dot",
    text: action
});

return msg;
```

#### UI->SQL(管理員)

- **ID**: `0fd0fd6e38884b98`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// UI→SQL 轉換器（管理員完整版）
// 位置：Template(管理畫面) → [這裡] → PostgreSQL
// 輸出數：1
// =================================================================

const action = msg.payload?.action;

if (!action) {
    node.warn('[UI→SQL] 無動作類型');
    return null;
}

node.warn('[UI→SQL] 動作: ' + action);

switch (action) {
    // ========== 客戶登入查詢 ==========
    case 'customer_login':
        let customerCode = msg.payload.customer_code;
        msg.query = `
            SELECT 
                customer_code,
                customer_name,
                password,
                devices,
                is_active
            FROM customers
            WHERE LOWER(customer_code) = LOWER($1)
            AND is_active = true;
        `;
        msg.params = [customerCode];
        msg._original_request = {
            action: 'customer_login',
            customer_code: customerCode,
            password: msg.payload.password,
            request_id: msg.payload.request_id
        };
        node.warn('[UI→SQL] 查詢客戶: ' + customerCode);
        break;

    // ========== 查詢客戶列表 ==========
    case 'list_customers':
        msg.query = `
            SELECT 
                customer_code,
                customer_name,
                array_length(devices, 1) as device_count,
                devices,
                is_active,
                last_login,
                login_count,
                created_at
            FROM customers
            WHERE LOWER(customer_code) != 'admin'
            ORDER BY customer_code;
        `;
        msg.params = [];
        msg._original_request = {
            action: 'list_customers',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 查詢客戶列表');
        break;

    // ========== 新增客戶 ==========
    case 'add_customer':
        msg.query = `
            INSERT INTO customers 
            (customer_code, customer_name, password, devices, is_active)
            VALUES (UPPER($1), $2, $3, $4, true)
            ON CONFLICT (customer_code) DO NOTHING
            RETURNING *;
        `;
        msg.params = [
            msg.payload.customer_code,
            msg.payload.customer_name,
            msg.payload.password || 'default123',
            msg.payload.devices || []
        ];
        msg._original_request = {
            action: 'add_customer',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 新增客戶: ' + msg.payload.customer_code);
        break;

    // ========== 更新客戶資料 ==========
    case 'update_customer':
        if (msg.payload.password && msg.payload.password.trim() !== '') {
            msg.query = `
                UPDATE customers 
                SET customer_name = $2,
                    password = $3,
                    devices = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE customer_code = $1
                RETURNING *;
            `;
            msg.params = [
                msg.payload.customer_code,
                msg.payload.customer_name,
                msg.payload.password,
                msg.payload.devices || []
            ];
        } else {
            msg.query = `
                UPDATE customers 
                SET customer_name = $2,
                    devices = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE customer_code = $1
                RETURNING *;
            `;
            msg.params = [
                msg.payload.customer_code,
                msg.payload.customer_name,
                msg.payload.devices || []
            ];
        }
        msg._original_request = {
            action: 'update_customer',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 更新客戶: ' + msg.payload.customer_code);
        break;

    // ========== 啟用/停用客戶 ==========
    case 'toggle_customer':
        msg.query = `
            UPDATE customers 
            SET is_active = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE customer_code = $1
            RETURNING *;
        `;
        msg.params = [
            msg.payload.customer_code,
            msg.payload.is_active
        ];
        msg._original_request = {
            action: 'toggle_customer',
            target: 'admin_page'
        };
        const status = msg.payload.is_active ? '啟用' : '停用';
        node.warn('[UI→SQL] ' + status + '客戶: ' + msg.payload.customer_code);
        break;

    // ========== 查詢所有設備 ==========
    case 'list_all_devices':
        msg.query = `
            SELECT 
                d.device_id,
                d.device_name,
                d.location,
                d.last_seen,
                d.created_at,
                (SELECT COUNT(*) FROM power_data WHERE device_id = d.device_id) as data_count,
                (SELECT MAX(timestamp) FROM power_data WHERE device_id = d.device_id) as last_data_time
            FROM devices d
            ORDER BY d.device_id;
        `;
        msg.params = [];
        msg._original_request = {
            action: 'list_all_devices',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 查詢所有設備列表');
        break;

    // ========== 新增設備 ==========
    case 'add_device':
        msg.query = `
            INSERT INTO devices (device_id, device_name, location, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (device_id) DO NOTHING
            RETURNING *;
        `;
        msg.params = [
            msg.payload.device_id,
            msg.payload.device_name || '',
            msg.payload.location || ''
        ];
        msg._original_request = {
            action: 'add_device',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 新增設備: ' + msg.payload.device_id);
        break;

    // ========== 更新設備 ==========
    case 'update_device':
        msg.query = `
            UPDATE devices 
            SET device_name = $2,
                location = $3,
                last_seen = CURRENT_TIMESTAMP
            WHERE device_id = $1
            RETURNING *;
        `;
        msg.params = [
            msg.payload.device_id,
            msg.payload.device_name || '',
            msg.payload.location || ''
        ];
        msg._original_request = {
            action: 'update_device',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 更新設備: ' + msg.payload.device_id);
        break;

    // ========== 刪除設備 ==========
    case 'delete_device':
        msg.query = `
            DELETE FROM devices
            WHERE device_id = $1
            RETURNING *;
        `;
        msg.params = [msg.payload.device_id];
        msg._original_request = {
            action: 'delete_device',
            target: 'admin_page'
        };
        node.warn('[UI→SQL] 刪除設備: ' + msg.payload.device_id);
        break;

    default:
        node.warn('[UI→SQL] 未處理的動作: ' + action);
        return null;
}

node.status({
    fill: "blue",
    shape: "dot",
    text: action
});

return msg;

// =================================================================
// 📋 支援的動作清單
// =================================================================
//
// 【客戶管理】
//   customer_login       - 客戶登入驗證
//   list_customers       - 查詢客戶列表
//   add_customer         - 新增客戶
//   update_customer      - 更新客戶資料
//   toggle_customer      - 啟用/停用客戶
//
// 【設備管理】
//   list_all_devices     - 查詢所有設備
//   add_device           - 新增設備
//   update_device        - 更新設備
//   delete_device        - 刪除設備
//
// =================================================================
```

#### 測試POSTGRESQL 會員登入

- **ID**: `b861867b1a0c0a32`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 測試 PostgreSQL 連接
// 建立獨立測試流程：[Inject] → [這個Function] → [PostgreSQL] → [Debug]
// =================================================================

// 測試 1: 簡單查詢所有客戶
msg.query = "SELECT * FROM customers";
msg.params = [];

node.warn('🧪 測試 PostgreSQL 連接');
node.warn(`查詢: ${msg.query}`);

return msg;

/* 
// 測試 2: 查詢特定 admin
msg.query = "SELECT * FROM customers WHERE customer_code = $1";
msg.params = ['admin'];

// 測試 3: 完整的登入查詢
msg.query = `
    SELECT 
        customer_code,
        customer_name,
        password,
        devices,
        is_active
    FROM customers
    WHERE customer_code = $1 
    AND is_active = true
    LIMIT 1
`;
msg.params = ['admin'];
*/
```

#### Postgresql結果診斷

- **ID**: `37c26e67b16a93cc`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// PostgreSQL 結果診斷 Function
// 位置：PostgreSQL → [這裡] → 驗證密碼
// 輸出數：1
// =================================================================

node.warn('=====================================');
node.warn('[診斷] PostgreSQL 結果');
node.warn('=====================================');

// 檢查各種可能的格式
node.warn(`[診斷] msg.payload 類型: ${typeof msg.payload}`);
node.warn(`[診斷] msg.payload 是陣列: ${Array.isArray(msg.payload)}`);

if (msg.payload === undefined) {
    node.warn('[診斷] ❌ msg.payload = undefined');
} else if (msg.payload === null) {
    node.warn('[診斷] ❌ msg.payload = null');
} else if (Array.isArray(msg.payload)) {
    node.warn(`[診斷] ✅ 陣列長度: ${msg.payload.length}`);
    if (msg.payload.length > 0) {
        node.warn('[診斷] 第一筆資料:');
        node.warn(JSON.stringify(msg.payload[0], null, 2));
    } else {
        node.warn('[診斷] ⚠️ 空陣列（查無資料）');
    }
} else {
    node.warn('[診斷] 其他格式:');
    node.warn(JSON.stringify(msg.payload, null, 2));
}

// 檢查原始請求
if (msg._original_request) {
    node.warn('[診斷] 原始請求資訊:');
    node.warn(`  action: ${msg._original_request.action}`);
    node.warn(`  customer_code: ${msg._original_request.customer_code}`);
    node.warn(`  有密碼: ${msg._original_request.password ? '是' : '否'}`);
} else {
    node.warn('[診斷] ⚠️ 沒有 _original_request');
}

// 檢查錯誤
if (msg.error) {
    node.warn('[診斷] ❌ 有錯誤:');
    node.warn(JSON.stringify(msg.error, null, 2));
}

node.warn('=====================================');

// 原封不動傳遞
return msg;
```

### UI 格式化 (3 個)

#### 格式化圖表數據

- **ID**: `b8c1b92e2877575f`
- **Outputs**: 5
- **程式碼**:

```javascript
// =================================================================
// 格式化图表数据 - 配套解析器输出版 V10.0
// 位置：数据解析器 Output 2 → [这里] → 5个 ui-chart
// 
// 输入格式：msg.payload = {
//     deviceId, timestamp, unixTimestamp, pg, pa, pp, pag, ppg
// }
// 
// 输出数量：5
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

// ========== 步骤 1: 验证输入 ==========
if (!msg.payload) {
    log('[Chart Formatter] ❌ msg.payload 不存在');
    setStatus("red", "ring", "无数据");
    return [null, null, null, null, null];
}

const data = msg.payload;

log('[Chart Formatter] ========================================');
log('[Chart Formatter] 开始格式化图表数据');
log('[Chart Formatter] ========================================');

// 列出数据字段
log('[Chart Formatter] 📦 接收到的数据:');
Object.keys(data).forEach(key => {
    log(`[Chart Formatter]    ${key}: ${data[key]}`);
});

// ========== 步骤 2: 提取时间戳 ==========
let timestampValue;

// 优先使用 unixTimestamp（毫秒）
if (data.unixTimestamp) {
    timestampValue = data.unixTimestamp;
    log(`[Chart Formatter] ⏰ 使用 unixTimestamp: ${timestampValue}`);
}
// 备选：使用 timestamp 字符串
else if (data.timestamp) {
    try {
        timestampValue = new Date(data.timestamp).getTime();
        log(`[Chart Formatter] ⏰ 从 timestamp 转换: ${timestampValue}`);
    } catch (error) {
        log(`[Chart Formatter] ❌ 时间戳转换失败: ${error.message}`);
        timestampValue = Date.now();
    }
}
// 最后备选：当前时间
else {
    log('[Chart Formatter] ⚠️ 无时间戳，使用当前时间');
    timestampValue = Date.now();
}

// 验证时间戳
if (isNaN(timestampValue) || timestampValue <= 0) {
    log(`[Chart Formatter] ❌ 时间戳无效: ${timestampValue}`);
    setStatus("red", "ring", "时间错误");
    return [null, null, null, null, null];
}

// 确保是毫秒级
if (timestampValue < 10000000000) {
    timestampValue = timestampValue * 1000;
    log(`[Chart Formatter] ⏰ 秒级转毫秒: ${timestampValue}`);
}

const formattedTime = new Date(timestampValue).toLocaleString('zh-TW');
log(`[Chart Formatter] ✅ 时间戳: ${timestampValue} (${formattedTime})`);

// ========== 步骤 3: 提取功率和效率值 ==========
const pgValue = parseInt(data.pg) || 0;
const paValue = parseInt(data.pa) || 0;
const ppValue = parseInt(data.pp) || 0;
const pagValue = parseFloat(data.pag) || 0;
const ppgValue = parseFloat(data.ppg) || 0;

log('[Chart Formatter] ⚡ 数据值:');
log(`[Chart Formatter]    PG: ${pgValue}W`);
log(`[Chart Formatter]    PA: ${paValue}W`);
log(`[Chart Formatter]    PP: ${ppValue}W`);
log(`[Chart Formatter]    PAG: ${pagValue.toFixed(2)}%`);
log(`[Chart Formatter]    PPG: ${ppgValue.toFixed(2)}%`);

// ========== 步骤 4: 构建输出 ==========
// 完全匹配 ui-chart Line 图的配置：
// - Series: msg.topic
// - X: timestamp
// - Y: msg.payload

const output1 = {
    topic: 'PG',
    timestamp: timestampValue,
    payload: pgValue
};

const output2 = {
    topic: 'PA',
    timestamp: timestampValue,
    payload: paValue
};

const output3 = {
    topic: 'PP',
    timestamp: timestampValue,
    payload: ppValue
};

const output4 = {
    topic: 'PAG',
    timestamp: timestampValue,
    payload: pagValue
};

const output5 = {
    topic: 'PPG',
    timestamp: timestampValue,
    payload: ppgValue
};

// ========== 步骤 5: 验证输出 ==========
log('[Chart Formatter] ========================================');
log('[Chart Formatter] 输出验证:');

const outputs = [
    [output1, 'PG'],
    [output2, 'PA'],
    [output3, 'PP'],
    [output4, 'PAG'],
    [output5, 'PPG']
];

let allValid = true;

outputs.forEach(([output, name]) => {
    const checks = {
        'topic是字符串': typeof output.topic === 'string',
        'timestamp是数字': typeof output.timestamp === 'number',
        'payload是数字': typeof output.payload === 'number',
        'timestamp是毫秒级': output.timestamp > 1000000000000,
        'payload不是NaN': !isNaN(output.payload)
    };

    const valid = Object.values(checks).every(v => v === true);

    if (valid) {
        log(`[Chart Formatter] ✅ ${name}: 验证通过`);
    } else {
        log(`[Chart Formatter] ❌ ${name}: 验证失败`);
        Object.entries(checks).forEach(([desc, pass]) => {
            if (!pass) {
                log(`[Chart Formatter]    ✗ ${desc}`);
            }
        });
        allValid = false;
    }
});

// ========== 步骤 6: 设置状态 ==========
if (allValid) {
    const timeStr = new Date(timestampValue).toLocaleTimeString('zh-TW');
    setStatus("green", "dot", `✅ ${timeStr} | PG:${pgValue}W`);
    log('[Chart Formatter] ========================================');
    log('[Chart Formatter] ✅ 处理完成，所有输出有效');
    log('[Chart Formatter] ========================================');
} else {
    setStatus("yellow", "ring", "⚠️ 部分输出异常");
    log('[Chart Formatter] ========================================');
    log('[Chart Formatter] ⚠️ 处理完成，但有警告');
    log('[Chart Formatter] ========================================');
}

// ========== 步骤 7: 返回 5 个输出 ==========
return [output1, output2, output3, output4, output5];

// =================================================================
// 📋 输出格式
// =================================================================
//
// 每个输出的格式：
// {
//     topic: "PG",              // 字符串：系列名称
//     timestamp: 1697198400000, // 数字：Unix 毫秒时间戳
//     payload: 146              // 数字：功率值或效率值
// }
//
// =================================================================
// 🔌 连接方式
// =================================================================
//
// [数据解析器 Output 2]
//     ↓
// [此节点]
//     ├─ Output 1 → [ui-chart PG]
//     ├─ Output 2 → [ui-chart PA]
//     ├─ Output 3 → [ui-chart PP]
//     ├─ Output 4 → [ui-chart PAG]
//     └─ Output 5 → [ui-chart PPG]
//
// =================================================================
// 🎯 ui-chart 配置要求（所有 5 个图表）
// =================================================================
//
// Type: Line
// X-Axis Type: Timescale
// 
// Properties:
// - Series: msg.topic
// - X: timestamp
// - Y: msg.payload
//
// =================================================================
```

#### 格式化GPS

- **ID**: `12d85328bb538f23`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 格式化GPS給worldmap - 完整版 V3.0
// 位置：SQL生成器-GPS → PostgreSQL → [這裡] → worldmap
// 
// 功能：將資料庫的 GPS 數據轉換為 worldmap 格式
// 輸入：PostgreSQL 執行結果（包含 msg._gps_data）
// 輸出：worldmap 格式的數據
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log('[GPS Format] ========================================');

// ========== 步驟 1: 驗證 PostgreSQL 結果 ==========
if (!msg.payload) {
    log('[GPS Format] ❌ msg.payload 不存在');
    setStatus("red", "ring", "無結果");
    return null;
}

if (Array.isArray(msg.payload) && msg.payload.length === 0) {
    log('[GPS Format] ⚠️ PostgreSQL 返回空陣列');
    setStatus("yellow", "ring", "無數據");
    return null;
}

// ========== 步驟 2: 取得 GPS 數據 ==========
// 優先從 msg._gps_data 取得（SQL生成器保存的原始數據）
let gps = msg._gps_data;

// 如果沒有 _gps_data，嘗試從 payload 取得
if (!gps && Array.isArray(msg.payload) && msg.payload.length > 0) {
    gps = msg.payload[0];  // 取第一筆
    log('[GPS Format] ⚠️ 從 payload 取得 GPS 數據（備援）');
}

// 最終驗證
if (!gps) {
    log('[GPS Format] ❌ 無 GPS 數據可用');
    setStatus("red", "ring", "無GPS");
    return null;
}

// ========== 步驟 3: 驗證 GPS 數據完整性 ==========
const requiredFields = ['device_id', 'latitude', 'longitude'];
const missingFields = [];

for (const field of requiredFields) {
    if (gps[field] === undefined || gps[field] === null) {
        missingFields.push(field);
    }
}

if (missingFields.length > 0) {
    log(`[GPS Format] ❌ 缺少必要欄位: ${missingFields.join(', ')}`);
    setStatus("red", "ring", "欄位缺失");
    return null;
}

// ========== 步驟 4: 提取並驗證數據 ==========
const deviceId = String(gps.device_id);
const latitude = parseFloat(gps.latitude);
const longitude = parseFloat(gps.longitude);
const altitude = parseFloat(gps.altitude) || 0;
const satellites = parseInt(gps.satellites) || 0;

// 驗證座標範圍
if (isNaN(latitude) || isNaN(longitude)) {
    log('[GPS Format] ❌ 座標值無效（NaN）');
    setStatus("red", "ring", "座標無效");
    return null;
}

if (latitude < -90 || latitude > 90) {
    log(`[GPS Format] ❌ 緯度超出範圍: ${latitude}`);
    setStatus("red", "ring", "緯度錯誤");
    return null;
}

if (longitude < -180 || longitude > 180) {
    log(`[GPS Format] ❌ 經度超出範圍: ${longitude}`);
    setStatus("red", "ring", "經度錯誤");
    return null;
}

log('[GPS Format] ----------------------------------------');
log(`[GPS Format] 設備: ${deviceId}`);
log(`[GPS Format] 座標: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
log(`[GPS Format] 高度: ${altitude.toFixed(1)} m`);
log(`[GPS Format] 衛星: ${satellites} 顆`);

// ========== 步驟 5: 準備 worldmap 格式數據 ==========
// worldmap 要求的格式
msg.payload = {
    // === 必要欄位 ===
    name: `設備${deviceId}`,  // 唯一識別碼
    lat: latitude,
    lon: longitude,

    // === 圖標設定 ===
    // 選項 1: 經典定位標記（推薦）✅
    icon: "map-marker",       // Font Awesome 圖標
    iconColor: "red",         // 可選：red, blue, green, orange, yellow, violet, grey, black

    // 選項 2: GPS 箭頭（如果設備會移動）
    // icon: "arrow",
    // iconColor: "blue",
    // bearing: 0,            // 方向（0-360度）

    // 選項 3: 不指定（使用預設紅色 marker）
    // 註解掉上面的 icon 和 iconColor

    // === 圖層設定（可選）===
    layer: "設備位置",        // 在 worldmap 上的圖層名稱

    // === Popup 內容 ===
    popup: `
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #2196F3;">
                🔋 設備 ${deviceId}
            </h3>
            <table style="width: 100%; font-size: 13px;">
                <tr>
                    <td style="padding: 3px 0;"><strong>📍 座標</strong></td>
                    <td style="padding: 3px 0; text-align: right;">
                        ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 3px 0;"><strong>📏 高度</strong></td>
                    <td style="padding: 3px 0; text-align: right;">
                        ${altitude.toFixed(1)} m
                    </td>
                </tr>
                <tr>
                    <td style="padding: 3px 0;"><strong>🛰️ 衛星</strong></td>
                    <td style="padding: 3px 0; text-align: right;">
                        ${satellites} 顆
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 8px 0 0 0; border-top: 1px solid #eee;">
                        <small style="color: #666;">
                            ⏰ 更新時間: ${new Date().toLocaleString('zh-TW')}
                        </small>
                    </td>
                </tr>
            </table>
        </div>
    `,

    // === 其他可選欄位 ===
    // tooltip: `設備${deviceId}`,  // 滑鼠懸停顯示
    // draggable: false,             // 是否可拖動
    // addtoheatmap: false,          // 是否加入熱力圖
};

// ========== 步驟 6: 輸出日誌 ==========
log('[GPS Format] ----------------------------------------');
log('[GPS Format] worldmap 數據已準備:');
log(`[GPS Format]   名稱: ${msg.payload.name}`);
log(`[GPS Format]   圖標: ${msg.payload.icon}`);
log(`[GPS Format]   顏色: ${msg.payload.iconColor}`);
log(`[GPS Format]   圖層: ${msg.payload.layer}`);

// ========== 步驟 7: 設置節點狀態 ==========
const statusText = `📍 ${deviceId} (${satellites}衛星)`;
setStatus("green", "dot", statusText);

log('[GPS Format] ========================================');
log('[GPS Format] ✅ 格式化完成，發送到 worldmap');

// ========== 步驟 8: 返回數據 ==========
return msg;

// =================================================================
// 📋 輸出格式說明
// =================================================================
//
// msg.payload = {
//     name: "設備6002",                    // 唯一識別碼
//     lat: 25.033671,                      // 緯度
//     lon: 121.564427,                     // 經度
//     icon: "map-marker",                  // Font Awesome 圖標
//     iconColor: "red",                    // 圖標顏色
//     layer: "設備位置",                    // 圖層名稱
//     popup: "<div>...</div>"              // 點擊時顯示的 HTML
// }
//
// =================================================================
// 🔌 連線方式
// =================================================================
//
// [GPS解析器] 
//     ↓
// [SQL生成器-GPS] (保存 msg._gps_data)
//     ↓
// [PostgreSQL]
//     ↓
// [此節點: 格式化GPS]
//     ↓
// [worldmap 節點]
//
// =================================================================
// 🎨 圖標選項
// =================================================================
//
// Font Awesome 圖標（不帶 fa- 前綴，會顯示在圓形標記內）:
// - "map-marker"      📍 經典地圖標記（推薦）
// - "location-arrow"  🧭 方向箭頭
// - "crosshairs"      ⊕ 十字準星
// - "map-pin"         📌 圖釘
//
// 內建特殊圖標（會根據方向旋轉）:
// - "arrow"           GPS 箭頭（推薦移動設備）
// - "plane"           飛機
// - "ship"            船
// - "car"             汽車
// - "uav"             無人機
//
// 不指定 icon：使用預設紅色 marker
//
// =================================================================
// 🎨 顏色選項
// =================================================================
//
// iconColor 可選值:
// "red", "blue", "green", "orange", "yellow", 
// "violet", "grey", "black"
//
// =================================================================
// ⚙️ 節點設定
// =================================================================
//
// 名稱: 格式化GPS
// 輸出數量: 1
//
// =================================================================
// 🔍 故障排除
// =================================================================
//
// 1. 如果圖標沒顯示：
//    - 檢查 icon 值是否正確
//    - 檢查是否有拼字錯誤
//    - 嘗試不指定 icon（使用預設）
//
// 2. 如果顏色沒變：
//    - 確認 iconColor 值在支援列表中
//    - 檢查拼字（英文）
//
// 3. 如果地圖上沒有標記：
//    - 檢查座標是否在合理範圍內
//    - 檢查 worldmap 節點是否正常運行
//    - 查看 worldmap 頁面的瀏覽器 console
//
// =================================================================
```

#### 格式化

- **ID**: `89b11649a31bc4f0`
- **Outputs**: 1
- **程式碼**:

```javascript
// 只處理初始化的訊息
if (!msg._send_to_ui) {
    return null;
}

// 取得配置
let config;

if (msg.payload && msg.payload.length > 0) {
    config = msg.payload[0];
    node.warn(`[Init] 配置: A=${config.factor_a}, P=${config.factor_p}`);
} else {
    config = {
        device_id: '6002',
        factor_a: 1.0,
        factor_p: 1.0
    };
    node.warn(`[Init] 無配置，用預設值`);
}

// 格式化成 Template 可接收的格式
msg.payload = {
    type: 'config',
    device_id: config.device_id,
    factor_a: parseFloat(config.factor_a) || 1.0,
    factor_p: parseFloat(config.factor_p) || 1.0
};

node.warn(`[Init] 發送: ${JSON.stringify(msg.payload)}`);

return msg;
```

### 配置同步 (5 個)

#### 配置同步器

- **ID**: `7da3f2087ba1505c`
- **Outputs**: 1
- **程式碼**:

```javascript
// 配置同步器 V3.0 - 移除 pizero 功能
// 輸入: PostgreSQL 查詢結果
// 輸出: 1個 (MQTT 通知)

const log = (msg) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(msg);
    }
};

// ========== 1. 檢查查詢結果 ==========
if (!msg.payload || msg.payload.length === 0) {
    log('[Config] 無配置資料，使用預設值');

    const defaultConfig = {
        device_id: msg.params ? msg.params[0] : '6002',
        factor_a: 1.0,
        factor_p: 1.0
    };

    msg.payload = [defaultConfig];
}

// ========== 2. 取得配置 ==========
const config = msg.payload[0];
const deviceId = config.device_id || '6002';
const factorA = parseFloat(config.factor_a) || 1.0;
const factorP = parseFloat(config.factor_p) || 1.0;

log(`[Config] 設備: ${deviceId}`);
log(`[Config] Factor_A: ${factorA}`);
log(`[Config] Factor_P: ${factorP}`);

// ========== 3. 儲存到 flow context ==========
const factorKey = `factor_${deviceId}`;
const configData = {
    factor_a: factorA,
    factor_p: factorP,
    updated_at: new Date().toISOString()
};

flow.set(factorKey, configData);

log(`[Config] ✅ 已儲存到 flow.${factorKey}`);

// ========== 4. 準備 MQTT 通知 ==========
const mqttOutput = {
    topic: `solar/${deviceId}/config/updated`,
    payload: JSON.stringify({
        device_id: deviceId,
        factor_a: factorA,
        factor_p: factorP,
        timestamp: configData.updated_at,
        message: '配置已更新'
    }),
    qos: 1,
    retain: false
};

// ========== 5. 設定節點狀態 ==========
node.status({
    fill: "green",
    shape: "dot",
    text: `✅ ${deviceId}: A=${factorA} P=${factorP}`
});

log(`[Config] ✅ 配置同步完成`);

// ========== 6. 返回輸出 ==========
return mqttOutput;
```

#### 配置回傳器

- **ID**: `c64de7ea6674c63a`
- **Outputs**: 1
- **程式碼**:

```javascript
// 配置回傳器 V2.0 - 支援多設備
// 位置：PostgreSQL-查詢 → [這裡] → template

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

// 檢查是否需要返回 UI
if (!msg._return_to_ui) {
    return null;
}

// 取得設備 ID
const deviceId = msg.device_id || '6002';

log(`[Config Return] 處理設備 ${deviceId} 的數據返回`);

// 根據查詢類型處理
if (msg._source === 'ui_get_config') {
    // 配置數據
    if (!msg.payload || msg.payload.length === 0) {
        log(`[Config Return] 設備 ${deviceId} 無配置，使用預設值`);

        return {
            payload: {
                type: 'config',
                device_id: deviceId,
                factor_a: 1.0,
                factor_p: 1.0
            }
        };
    }

    const config = msg.payload[0];

    return {
        payload: {
            type: 'config',
            device_id: deviceId,
            factor_a: parseFloat(config.factor_a) || 1.0,
            factor_p: parseFloat(config.factor_p) || 1.0
        }
    };
}

if (msg._source === 'ui_get_data') {
    // 最新功率數據
    if (!msg.payload || msg.payload.length === 0) {
        log(`[Config Return] 設備 ${deviceId} 無數據`);

        return {
            payload: {
                type: 'realtime',
                device_id: deviceId,
                online: false,
                pg: 0,
                pa: 0,
                pp: 0,
                pag: 0,
                ppg: 0,
                lastUpdate: '無數據'
            }
        };
    }

    const data = msg.payload[0];

    return {
        payload: {
            type: 'realtime',
            device_id: deviceId,
            online: true,
            pg: parseInt(data.pg) || 0,
            pa: parseInt(data.pa) || 0,
            pp: parseInt(data.pp) || 0,
            pag: parseFloat(data.pga_efficiency) || 0,
            ppg: parseFloat(data.pgp_efficiency) || 0,
            lastUpdate: new Date(data.timestamp).toLocaleTimeString('zh-TW')
        }
    };
}

if (msg._source === 'ui_get_info') {
    // 設備資訊
    if (!msg.payload || msg.payload.length === 0) {
        return {
            payload: {
                type: 'device_info',
                device_id: deviceId,
                device_name: `設備 ${deviceId}`,
                location: '未設定'
            }
        };
    }

    const info = msg.payload[0];

    return {
        payload: {
            type: 'device_info',
            device_id: deviceId,
            device_name: info.device_name || `設備 ${deviceId}`,
            location: info.location || '未設定'
        }
    };
}

log(`[Config Return] 未知的來源: ${msg._source}`);
return null;
```

#### creat config table

- **ID**: `d992ce3e081aa0bf`
- **Outputs**: 1
- **程式碼**:

```javascript
// ============================================================
// 建立 config 表 + 確保設備存在
// ============================================================

msg.query = `
    -- 步驟 1: 先確保 devices 表中有設備（不存在才插入）
    INSERT INTO devices (device_id, device_name, location)
    VALUES 
        ('6001', 'SolarSDGs 6001', '未設定'),
        ('6002', 'SolarSDGs 6002', '未設定'),
        ('6003', 'SolarSDGs 6003', '未設定')
    ON CONFLICT (device_id) DO NOTHING;
    
    -- 步驟 2: 建立 config 表
    CREATE TABLE IF NOT EXISTS config (
        device_id VARCHAR(50) PRIMARY KEY REFERENCES devices(device_id),
        factor_a DOUBLE PRECISION DEFAULT 1.0,
        factor_p DOUBLE PRECISION DEFAULT 1.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 步驟 3: 建立索引
    CREATE INDEX IF NOT EXISTS idx_config_device ON config(device_id);
    
    -- 步驟 4: 插入預設配置
    INSERT INTO config (device_id, factor_a, factor_p)
    VALUES 
        ('6001', 1.0, 1.0),
        ('6002', 1.0, 1.0),
        ('6003', 1.0, 1.0)
    ON CONFLICT (device_id) DO NOTHING;
`;

msg.params = [];

node.warn('🔧 建立 config 表格（含設備檢查）');
node.warn('   步驟 1: 確保設備存在於 devices 表');
node.warn('   步驟 2: 建立 config 表（含外鍵）');
node.warn('   步驟 3: 建立索引');
node.warn('   步驟 4: 插入預設配置');

return msg;
```

#### check config

- **ID**: `9596483be8b41939`
- **Outputs**: 1
- **程式碼**:

```javascript
// Function: CHECK_CONFIG
// 查詢 config 表內容

msg.query = `
    SELECT 
        device_id,
        factor_a,
        factor_p,
        updated_at
    FROM config 
    ORDER BY device_id;
`;

msg.params = [];

node.warn('📊 查詢 config 表內容');

return msg;
```

#### 查詢所有配置

- **ID**: `a7346c19c2ba206f`
- **Outputs**: 1
- **程式碼**:

```javascript
// Function: 直接查詢配置
// 名稱: DB-查詢所有配置

msg.query = `
    SELECT 
        device_id,
        factor_a,
        factor_p,
        updated_at,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - updated_at))/60 as minutes_ago
    FROM config 
    ORDER BY device_id;
`;
msg.params = [];

node.warn('[DB Query] 查詢所有設備配置');

return msg;
```

### 其他功能 (14 個)

#### LIST

- **ID**: `624e02a3dcdcb213`
- **Outputs**: 1
- **程式碼**:

```javascript
// Function: LIST_TABLES_DEBUG
// 列出所有表格 + 完整 Debug

msg.query = `
    SELECT 
        table_name,
        table_schema
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
`;

msg.params = [];

node.warn('📋 列出所有表格');
node.warn('   Query: ' + msg.query.substring(0, 100) + '...');
node.warn('   等待 PostgreSQL 回應...');

// 標記這是查詢請求
msg._debug_label = 'LIST_TABLES';

return msg;
```

#### 結果處理器

- **ID**: `c673737c2a561213`
- **Outputs**: 2
- **程式碼**:

```javascript
// =================================================================
// 結果處理器 V4.0 - 完整版（移除配置查詢）
// 位置：PostgreSQL → [這裡] → 2個輸出
// 
// 功能：處理資料庫操作結果，發送ACK和更新狀態
// 輸入：來自 PostgreSQL 的執行結果
// 輸出：2個（ACK, 更新狀態）
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log('[Result] ========================================');

// ========== 步驟 1: 檢查是否有錯誤 ==========
if (msg.error) {
    log(`[Result] ❌ 資料庫錯誤: ${msg.error}`);
    setStatus("red", "ring", "錯誤");

    // 取得設備 ID
    const deviceId = msg.device_id || '6002';

    // 準備錯誤通知
    const errorOutput = {
        topic: `solar/${deviceId}/error`,
        payload: JSON.stringify({
            error: msg.error,
            timestamp: new Date().toISOString(),
            source: 'postgresql'
        }),
        qos: 1
    };

    log(`[Result] 發送錯誤通知到: solar/${deviceId}/error`);
    log('[Result] ========================================');

    // 返回兩個輸出（只有第一個有值）
    return [errorOutput, null];
}

// ========== 步驟 2: 檢查插入結果 ==========
if (!msg.payload) {
    log('[Result] ⚠️ msg.payload 為空');
    setStatus("yellow", "ring", "無結果");
    return [null, null];
}

if (Array.isArray(msg.payload) && msg.payload.length === 0) {
    log('[Result] ⚠️ 無資料插入（空陣列）');
    setStatus("yellow", "ring", "無資料");
    return [null, null];
}

// ========== 步驟 3: 統計插入結果 ==========
const insertedCount = Array.isArray(msg.payload) ? msg.payload.length : 1;
log(`[Result] ✅ 成功插入 ${insertedCount} 筆數據到資料庫`);

// ========== 步驟 4: 取得設備 ID ==========
const deviceId = msg.device_id || '6002';
log(`[Result] 設備 ID: ${deviceId}`);

// ========== 步驟 5: 顯示統計資訊（如果有）==========
if (msg.stats) {
    log('[Result] ----------------------------------------');
    log(`[Result] 統計資訊:`);
    log(`[Result]   總數: ${msg.stats.total || 0}`);
    log(`[Result]   成功: ${msg.stats.processed || 0}`);
    log(`[Result]   錯誤: ${msg.stats.errors || 0}`);

    if (msg.stats.errors > 0) {
        const successRate = ((msg.stats.processed / msg.stats.total) * 100).toFixed(1);
        log(`[Result]   成功率: ${successRate}%`);
    }
}

log('[Result] ----------------------------------------');

// ========== 步驟 6: 準備兩個輸出 ==========

// === Output 1: 發送 ACK 到設備 ===
const ackOutput = {
    topic: `solar/${deviceId}/ack`,
    payload: 'OK',
    qos: 1
};

log(`[Result] Output 1: 發送 ACK`);
log(`[Result]   主題: solar/${deviceId}/ack`);
log(`[Result]   內容: OK`);

// === Output 2: 更新設備最後上線時間 ===
const updateStatusOutput = {
    query_type: 'update_device_status',
    params: [deviceId],
    device_id: deviceId,
    _source: 'result_processor'
};

log(`[Result] Output 2: 更新設備狀態`);
log(`[Result]   設備: ${deviceId}`);
log(`[Result]   動作: 更新 last_seen 時間戳`);

// ========== 步驟 7: 設置節點狀態 ==========
let statusText;
if (msg.stats && msg.stats.errors > 0) {
    statusText = `⚠️ ${deviceId}: ${msg.stats.processed}/${msg.stats.total}`;
    setStatus("yellow", "dot", statusText);
} else {
    statusText = `✅ ${deviceId}: ${insertedCount}筆`;
    setStatus("green", "dot", statusText);
}

log('[Result] ========================================');
log(`[Result] ✅ 兩個輸出準備完成`);
log('[Result] ========================================');

// ========== 步驟 8: 返回兩個輸出 ==========
return [ackOutput, updateStatusOutput];

// =================================================================
// 📋 輸出說明
// =================================================================
//
// Output 1 (ACK): 發送到 [Send ACK] MQTT Out
// {
//     topic: "solar/6002/ack",
//     payload: "OK",
//     qos: 1
// }
//
// Output 2 (更新狀態): 發送到 [SQL生成器-更新狀態] → [PostgreSQL]
// {
//     query_type: 'update_device_status',
//     params: ['6002'],
//     device_id: '6002',
//     _source: 'result_processor'
// }
//
// =================================================================
// 🔌 連線方式
// =================================================================
//
// [PostgreSQL]
//     ↓
// [此節點: 結果處理器] (輸出數: 2) ⭐ 重要！
//     ├─ Output 1 → [Send ACK] (MQTT Out)
//     └─ Output 2 → [SQL生成器-更新狀態] → [PostgreSQL-更新狀態]
//
// =================================================================
// ⚙️ 節點設定
// =================================================================
//
// 名稱: 結果處理器
// 輸出數量: 2  ⭐ 重要！（從3改為2）
//
// =================================================================
// 📝 版本變更
// =================================================================
//
// V4.0 (新版):
// - 移除 Output 3（配置查詢）
// - 配置同步改由 UI 更新時觸發
// - 減少不必要的資料庫查詢
//
// V3.0 (舊版):
// - 有 Output 3 查詢配置
// - 每次數據上傳都查詢（浪費資源）
//
// =================================================================
```

#### 功率數據模擬器

- **ID**: `c4e07c78e9c9ab76`
- **Outputs**: 1
- **程式碼**:

```javascript
// ====================================================================
// 功率數據模擬器 - 模擬 Pico W 發送到 solar/6002/data
// 放置位置: Inject節點 → [這裡] → MQTT Out (solar/6002/data)
// 輸出格式: "2025_10_13_14_30_0/150/200/180/33.3/20.0"
// ====================================================================

// === 設定 ===
const DEVICE_ID = "6002";  // 設備 ID
const SIMULATE_REAL_TIME = true;  // true=使用當前時間，false=使用固定時間

// === 工具函數 ===
const pad = (num) => String(num).padStart(2, '0');

// === 生成時間戳 ===
let timestamp;
if (SIMULATE_REAL_TIME) {
    const now = new Date();
    timestamp = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
} else {
    // 固定時間（用於測試）
    timestamp = "2025_10_13_14_30_0";
}

// === 模擬日間發電曲線 ===
const hour = new Date().getHours();
let dayFactor = 1;

// 6:00 - 18:00 日間發電（正弦曲線）
if (hour >= 6 && hour <= 18) {
    // 正午最高（hour=12 時 dayFactor=1）
    dayFactor = Math.sin((hour - 6) * Math.PI / 12);
} else {
    // 夜間低功率
    dayFactor = 0.05;
}

// === 生成功率數據（帶隨機波動）===
// PG: 發電功率 (0-200W)
const pg = Math.max(0, Math.floor(150 * dayFactor + Math.random() * 50));

// PA: 負載A功率（通常高於PG，表示需要電池補充）
const pa = Math.max(0, Math.floor(pg * 1.25 + Math.random() * 30));

// PP: 負載P功率（通常高於PG）
const pp = Math.max(0, Math.floor(pg * 1.15 + Math.random() * 25));

// === 計算效率 ===
let pag, ppg;
if (pg > 0) {
    pag = ((pa - pg) / pg * 100).toFixed(2);
    ppg = ((pp - pg) / pg * 100).toFixed(2);
} else {
    pag = "0.00";
    ppg = "0.00";
}

// 確保效率不超過合理範圍
pag = Math.min(100, Math.max(-100, parseFloat(pag))).toFixed(2);
ppg = Math.min(100, Math.max(-100, parseFloat(ppg))).toFixed(2);

// === 組合數據 ===
// 格式: "年_月_日_時_分_秒/pg/pa/pp/pag/ppg"
const payload = `${timestamp}/${pg}/${pa}/${pp}/${pag}/${ppg}`;

// === 設定 MQTT 訊息 ===
msg.topic = `solar/${DEVICE_ID}/data`;
msg.payload = payload;  // 注意：不要加引號！
msg.qos = 1;

// === 日誌輸出 ===
node.warn(`[Power Sim] 設備: ${DEVICE_ID}`);
node.warn(`[Power Sim] 時間: ${timestamp}`);
node.warn(`[Power Sim] 功率: PG=${pg}W, PA=${pa}W, PP=${pp}W`);
node.warn(`[Power Sim] 效率: PAG=${pag}%, PPG=${ppg}%`);
node.warn(`[Power Sim] 完整數據: ${payload}`);

// 設定節點狀態
node.status({
    fill: "green",
    shape: "dot",
    text: `PG:${pg}W 日照:${(dayFactor * 100).toFixed(0)}%`
});

return msg;
```

#### UI->MQTT轉換

- **ID**: `26326e9c4ff0218a`
- **Outputs**: 2
- **程式碼**:

```javascript
// =================================================================
// UI→MQTT轉換 V4.1 - 支援單層和雙層 payload
// 輸出數量: 2
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

log('========================================');
log('[UI→MQTT] V4.1 啟動');

// ========== 步驟 1: 智能識別 payload 格式 ==========
let event;

// 檢查是否為雙層 payload (Dashboard 2.0 格式)
if (msg.payload && msg.payload.payload && typeof msg.payload.payload === 'object') {
    event = msg.payload.payload;
    log('[UI→MQTT] ✅ 識別為 Dashboard 2.0 格式（雙層 payload）');
}
// 檢查是否為單層 payload (直接注入格式)
else if (msg.payload && msg.payload.action) {
    event = msg.payload;
    log('[UI→MQTT] ✅ 識別為直接注入格式（單層 payload）');
}
// 無效格式
else {
    log('[UI→MQTT] ❌ 無有效 payload');
    log('[UI→MQTT] msg.payload 內容: ' + JSON.stringify(msg.payload));
    node.status({ fill: "red", shape: "ring", text: "無效格式" });
    return [null, null];
}

// ========== 步驟 2: 提取設備 ID（支援多種寫法）==========
const deviceId = event.device_id || event.deviceId || event.DEVICE_ID || '6002';

log(`[UI→MQTT] 📱 設備: ${deviceId}`);
log(`[UI→MQTT] 🎯 指令: ${event.action || 'unknown'}`);

// ========== 步驟 3: 初始化輸出 ==========
let mqttMsg = null;  // Output 1: 發送到 MQTT Broker
let dbMsg = null;    // Output 2: 發送到資料庫

// ========== 步驟 4: 根據不同指令處理 ==========
switch (event.action) {
    // ========== MQTT 控制類 ==========
    case 'reboot':
        mqttMsg = {
            topic: `solar/${deviceId}/control`,
            payload: 'reboot',
            qos: 1
        };
        log(`[UI→MQTT] 🔄 發送重啟指令到設備 ${deviceId}`);
        node.status({ fill: "blue", shape: "dot", text: `重啟 ${deviceId}` });
        break;

    case 'ota':
        mqttMsg = {
            topic: `solar/${deviceId}/admin/run_ota`,
            payload: 'start',
            qos: 1
        };
        log(`[UI→MQTT] 📡 發送 OTA 指令到設備 ${deviceId}`);
        node.status({ fill: "yellow", shape: "dot", text: `OTA ${deviceId}` });
        break;

    case 'request_gps':
        mqttMsg = {
            topic: `solar/${deviceId}/control`,
            payload: 'get_gps',
            qos: 1
        };
        log(`[UI→MQTT] 📍 請求 GPS 定位: ${deviceId}`);
        node.status({ fill: "green", shape: "dot", text: `GPS ${deviceId}` });
        break;

    // ========== 資料庫操作類 ==========
    case 'update_config':
        // 確保數值為浮點數
        const config = {
            factor_a: parseFloat(event.factor_a) || 1.0,
            factor_p: parseFloat(event.factor_p) || 1.0
        };

        dbMsg = {
            query_type: 'update_config',
            params: [
                deviceId,
                config.factor_a,
                config.factor_p
            ],
            device_id: deviceId,
            _source: 'ui_config_update',
            _config: config
        };

        log(`[UI→MQTT] 🔧 更新設備 ${deviceId} 配置`);
        log(`[UI→MQTT]   ├─ Factor_A: ${config.factor_a}`);
        log(`[UI→MQTT]   └─ Factor_P: ${config.factor_p}`);
        node.status({ fill: "green", shape: "dot", text: `Config ${deviceId}` });
        break;

    case 'get_config':
        dbMsg = {
            query_type: 'get_config',
            params: [deviceId],
            device_id: deviceId,
            _source: 'ui_get_config',
            _return_to_ui: true
        };

        log(`[UI→MQTT] 📖 讀取設備 ${deviceId} 配置`);
        node.status({ fill: "blue", shape: "ring", text: `讀取 ${deviceId}` });
        break;

    case 'get_latest':
    case 'get_latest_data':
        const limit = event.limit || 1;
        dbMsg = {
            query_type: 'get_latest_data',
            params: [deviceId, limit],
            device_id: deviceId,
            _source: 'ui_get_data',
            _return_to_ui: true
        };

        log(`[UI→MQTT] 📊 取得設備 ${deviceId} 最新數據（${limit}筆）`);
        node.status({ fill: "blue", shape: "ring", text: `數據 ${deviceId}` });
        break;

    case 'get_device_info':
        dbMsg = {
            query_type: 'get_device_info',
            params: [deviceId],
            device_id: deviceId,
            _source: 'ui_get_info',
            _return_to_ui: true
        };

        log(`[UI→MQTT] ℹ️ 取得設備 ${deviceId} 資訊`);
        node.status({ fill: "blue", shape: "ring", text: `資訊 ${deviceId}` });
        break;

    case 'refresh_data':
        // 重新載入最新數據
        dbMsg = {
            query_type: 'get_latest_data',
            params: [deviceId, 1],
            device_id: deviceId,
            _source: 'ui_refresh',
            _return_to_ui: true
        };

        log(`[UI→MQTT] 🔄 刷新設備 ${deviceId} 數據`);
        node.status({ fill: "green", shape: "dot", text: `刷新 ${deviceId}` });
        break;

    default:
        log(`[UI→MQTT] ❌ 未知的控制指令: ${event.action}`);
        log(`[UI→MQTT] 完整 event: ${JSON.stringify(event)}`);
        node.status({ fill: "red", shape: "ring", text: "未知指令" });
        return [null, null];
}

// ========== 步驟 5: 輸出日誌 ==========
if (mqttMsg) {
    log('[UI→MQTT] ✅ Output 1 (MQTT): ' + JSON.stringify(mqttMsg));
}
if (dbMsg) {
    log('[UI→MQTT] ✅ Output 2 (Database): ' + JSON.stringify(dbMsg));
}
log('========================================');

// ========== 步驟 6: 返回兩個輸出 ==========
return [mqttMsg, dbMsg];

// =================================================================
// 📋 使用說明
// =================================================================
//
// 支援的 payload 格式：
//
// 格式 1: Dashboard 2.0 (雙層)
// {
//     "payload": {
//         "payload": {
//             "action": "update_config",
//             "device_id": "6002",
//             "factor_a": 1.5,
//             "factor_p": 2.0
//         }
//     }
// }
//
// 格式 2: 直接注入 (單層)
// {
//     "action": "update_config",
//     "device_id": "6002",
//     "factor_a": 1.5,
//     "factor_p": 2.0
// }
//
// 兩種格式都可以正常工作！
//
// =================================================================
// 🔌 連線方式
// =================================================================
//
// [Template 節點] 或 [Inject 節點]
//     ↓
// [此節點: UI→MQTT 轉換]
//     ├─ Output 1 → [MQTT Out] (控制指令)
//     └─ Output 2 → [SQL生成器] → [PostgreSQL] (資料庫操作)
//
// =================================================================
// ⚙️ 節點設定
// =================================================================
//
// 名稱: UI→MQTT轉換
// 類型: function
// 輸出數量: 2
//
// =================================================================
// 📝 版本歷史
// =================================================================
//
// V4.1 (2025-10-16):
// - ✅ 支援單層和雙層 payload 格式
// - ✅ 更詳細的日誌輸出
// - ✅ 更好的錯誤處理
// - ✅ 支援 device_id 和 deviceId 兩種寫法
// - ✅ 新增 refresh_data 指令
//
// V4.0:
// - 多設備版本
// - 雙輸出設計
//
// =================================================================
```

#### MQTT->UI轉換

- **ID**: `c75e089718b69008`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// MQTT->UI轉換 V3.0 - 即時數值顯示專用
// 位置：數據解析器 Output 3 → [這裡] → [template]
// 
// 功能：接收即時數據並轉發給 Dashboard
// 輸入：來自數據解析器的即時數據
// 輸出：1個（發送到 template）
// =================================================================

const log = (message) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(message);
    }
};

const setStatus = (fill, shape, text) => {
    if (typeof node !== 'undefined' && node.status) {
        node.status({ fill, shape, text });
    }
};

log('[UI轉換] ========================================');

// ========== 步驟 1: 驗證輸入 ==========
if (!msg || !msg.payload) {
    log('[UI轉換] ❌ 無 payload');
    setStatus("red", "ring", "無數據");
    return null;
}

const data = msg.payload;

// ========== 步驟 2: 驗證數據類型 ==========
if (data.type !== 'realtime') {
    log(`[UI轉換] ⚠️ 數據類型錯誤: ${data.type || 'undefined'}`);
    log('[UI轉換] 預期: realtime');
    setStatus("yellow", "ring", "類型錯誤");
    return null;
}

// ========== 步驟 3: 驗證必要欄位 ==========
const requiredFields = ['device_id', 'pg', 'pa', 'pp', 'pag', 'ppg'];
const missingFields = [];

for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
        missingFields.push(field);
    }
}

if (missingFields.length > 0) {
    log(`[UI轉換] ❌ 缺少必要欄位: ${missingFields.join(', ')}`);
    setStatus("red", "ring", "欄位缺失");
    return null;
}

// ========== 步驟 4: 驗證數據範圍 ==========
const deviceId = data.device_id;
const pg = parseInt(data.pg) || 0;
const pa = parseInt(data.pa) || 0;
const pp = parseInt(data.pp) || 0;
const pag = parseFloat(data.pag) || 0;
const ppg = parseFloat(data.ppg) || 0;

// 驗證功率範圍（0-10000W）
if (pg < 0 || pg > 10000 || pa < 0 || pa > 10000 || pp < 0 || pp > 10000) {
    log(`[UI轉換] ⚠️ 功率值超出範圍: PG=${pg}, PA=${pa}, PP=${pp}`);
}

// 驗證效率範圍（-100% ~ 200%）
if (pag < -100 || pag > 200 || ppg < -100 || ppg > 200) {
    log(`[UI轉換] ⚠️ 效率值超出範圍: PAG=${pag}%, PPG=${ppg}%`);
}

// ========== 步驟 5: 輸出詳細日誌 ==========
log(`[UI轉換] 設備: ${deviceId}`);
log(`[UI轉換] 時間: ${data.lastUpdate || '未知'}`);
log(`[UI轉換] 狀態: ${data.online ? '在線' : '離線'}`);
log('[UI轉換] ----------------------------------------');
log('[UI轉換] 功率數據:');
log(`[UI轉換]   PG (發電): ${pg} W`);
log(`[UI轉換]   PA (負載A): ${pa} W`);
log(`[UI轉換]   PP (負載P): ${pp} W`);
log('[UI轉換] ----------------------------------------');
log('[UI轉換] 效率數據:');
log(`[UI轉換]   PAG (負載A效率): ${pag.toFixed(2)} %`);
log(`[UI轉換]   PPG (負載P效率): ${ppg.toFixed(2)} %`);
log('[UI轉換] ========================================');

// ========== 步驟 6: 準備輸出數據 ==========
// 確保數據格式正確
msg.payload = {
    type: 'realtime',
    device_id: deviceId,
    online: data.online !== false,  // 預設為 true
    lastUpdate: data.lastUpdate || new Date().toLocaleTimeString('zh-TW'),
    pg: pg,
    pa: pa,
    pp: pp,
    pag: parseFloat(pag.toFixed(2)),
    ppg: parseFloat(ppg.toFixed(2)),
    timestamp: data.timestamp || new Date().toISOString()
};

// ========== 步驟 7: 設置節點狀態 ==========
const statusText = `${deviceId}: PG=${pg}W PA=${pa}W PP=${pp}W`;
setStatus("green", "dot", statusText);

log(`[UI轉換] ✅ 數據已準備完成，發送到 template`);

// ========== 步驟 8: 返回數據 ==========
return msg;

// =================================================================
// 📋 輸出格式
// =================================================================
//
// msg.payload = {
//     type: 'realtime',
//     device_id: '6002',
//     online: true,
//     lastUpdate: '下午4:04:47',
//     pg: 150,
//     pa: 200,
//     pp: 180,
//     pag: 33.33,
//     ppg: 20.00,
//     timestamp: '2025-10-13 16:04:47'
// }
//
// =================================================================
// 🔌 連線方式
// =================================================================
//
// [數據解析器 Output 3]
//     ↓
// [此節點]
//     ↓
// [template] + [CSS]
//
// =================================================================
// ⚙️ 節點設定
// =================================================================
//
// 名稱: MQTT->UI轉換
// 輸出數量: 1
//
// =================================================================
```

#### GPS數據模擬器

- **ID**: `7daaff891e9f2c6c`
- **Outputs**: 1
- **程式碼**:

```javascript
// ====================================================================
// GPS 數據模擬器 - 模擬 Pico W 發送到 solar/6002/gps
// 放置位置: Inject節點 → [這裡] → MQTT Out (solar/6002/gps)
// 輸出格式: "25.033671,121.564427,100.5,8"
// ====================================================================

// === 設定 ===
const DEVICE_ID = "6002";  // 設備 ID
const USE_RANDOM_LOCATION = false;  // true=隨機位置，false=固定位置

// === 固定位置（台北） ===
let latitude = 25.033671;
let longitude = 121.564427;
let altitude = 100.5;
let satellites = 8;

// === 或使用隨機位置（模擬GPS漂移）===
if (USE_RANDOM_LOCATION) {
    // 台灣範圍內隨機位置
    latitude = 22.0 + Math.random() * 3.5;   // 22-25.5N
    longitude = 120.0 + Math.random() * 2.5;  // 120-122.5E
    altitude = Math.random() * 200;           // 0-200m
    satellites = Math.floor(6 + Math.random() * 6);  // 6-12 顆衛星
}

// 模擬小幅度GPS漂移（±10米）
if (!USE_RANDOM_LOCATION) {
    latitude += (Math.random() - 0.5) * 0.0001;  // ±10m
    longitude += (Math.random() - 0.5) * 0.0001;
}

// === 組合 GPS 數據 ===
// 格式: "緯度,經度,海拔,衛星數"
const payload = `${latitude.toFixed(6)},${longitude.toFixed(6)},${altitude.toFixed(1)},${satellites}`;

// === 設定 MQTT 訊息 ===
msg.topic = `solar/${DEVICE_ID}/gps`;
msg.payload = payload;  // 注意：不要加引號！
msg.qos = 1;

// === 日誌輸出 ===
node.warn(`[GPS Sim] 設備: ${DEVICE_ID}`);
node.warn(`[GPS Sim] 座標: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
node.warn(`[GPS Sim] 高度: ${altitude.toFixed(1)}m`);
node.warn(`[GPS Sim] 衛星: ${satellites} 顆`);
node.warn(`[GPS Sim] 完整數據: ${payload}`);

// 設定節點狀態
node.status({
    fill: "blue",
    shape: "dot",
    text: `GPS: ${satellites}衛星`
});

return msg;
```

#### 設備狀態模擬器

- **ID**: `c51a3a1234503394`
- **Outputs**: 1
- **程式碼**:

```javascript
// ====================================================================
// 設備狀態模擬器 - 模擬 Pico W 發送到 solar/6002/status
// 放置位置: Inject節點 → [這裡] → MQTT Out (solar/6002/status)
// 輸出格式: "online" 或 "sleeping"
// ====================================================================

// === 設定 ===
const DEVICE_ID = "6002";

// === 根據時間判斷狀態 ===
const hour = new Date().getHours();
let status;

// 夜間休眠（19:00 - 06:00）
if (hour >= 19 || hour < 6) {
    status = "sleeping";
} else {
    status = "online";
}

// === 設定 MQTT 訊息 ===
msg.topic = `solar/${DEVICE_ID}/status`;
msg.payload = status;
msg.qos = 1;

// === 日誌輸出 ===
node.warn(`[Status Sim] 設備: ${DEVICE_ID}`);
node.warn(`[Status Sim] 狀態: ${status}`);
node.warn(`[Status Sim] 時間: ${hour}:00`);

// 設定節點狀態
const statusColor = status === "online" ? "green" : "yellow";
node.status({
    fill: statusColor,
    shape: "dot",
    text: status
});

return msg;
```

#### check flow_context

- **ID**: `c589e2866244d2cf`
- **Outputs**: 1
- **程式碼**:

```javascript
// Function: CHECK_FLOW_CONTEXT
const deviceIds = ['6001', '6002', '6003'];
const result = {};

deviceIds.forEach(id => {
    const factorKey = `factor_${id}`;
    const config = flow.get(factorKey);
    result[id] = config || 'NOT FOUND';
});

msg.payload = result;
return msg;
```

#### 準備查詢

- **ID**: `dc0ff4ccba4378ad`
- **Outputs**: 1
- **程式碼**:

```javascript
const deviceId = '6002';

node.warn(`[Init] 載入配置: ${deviceId}`);

msg.query_type = 'get_config';
msg.params = [deviceId];
msg.device_id = deviceId;
msg._send_to_ui = true;

return msg;
```

#### creat customer table

- **ID**: `1f67587604d21083`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 建立客戶管理表 - 簡單版
// =================================================================

// 設定查詢類型
msg.query_type = 'create_customers_table';

// 建立客戶表的 SQL
msg.query = `
-- 刪除舊表（開發階段使用，正式環境要小心）
DROP TABLE IF EXISTS customers CASCADE;

-- 建立客戶表
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE NOT NULL,   -- A001, B001, admin
    customer_name VARCHAR(100) NOT NULL,         -- 公司名稱
    password VARCHAR(100) NOT NULL,              -- 密碼（暫時明碼）
    devices TEXT[],                              -- 設備陣列 ['6001','6002']
    is_active BOOLEAN DEFAULT true,              -- 是否啟用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,                        -- 最後登入時間
    login_count INTEGER DEFAULT 0                -- 登入次數
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_active ON customers(is_active);

-- 插入初始資料
INSERT INTO customers (customer_code, customer_name, password, devices) VALUES
('admin', '系統管理員', '82767419', ARRAY['ALL']),
('Solarsdgs', '加加減減', '96762364', ARRAY['6001', '6002']),
('TEST', '測試客戶', 'test123', ARRAY['6001', '6002']),
('A001', '台積電', 'tsmc2024', ARRAY['6001']),
('B001', '友達光電', 'auo2024', ARRAY['6002']),
('C001', '群創光電', 'innolux2024', ARRAY['6003'])
ON CONFLICT (customer_code) DO NOTHING;

-- 建立登入日誌表（選用）
CREATE TABLE IF NOT EXISTS login_logs (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(20),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_ip VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20)  -- success/failed
);
`;

msg.params = [];

// 設定節點狀態
node.status({
    fill: "blue",
    shape: "dot",
    text: "建立客戶表"
});

return msg;
```

#### list all customers

- **ID**: `054a07ba89e15327`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 查詢所有客戶資料
// =================================================================

msg.query = `
    SELECT 
        id,
        customer_code,
        customer_name,
        array_length(devices, 1) as device_count,
        devices,
        is_active,
        last_login,
        login_count,
        created_at
    FROM customers
    ORDER BY 
        CASE 
            WHEN customer_code = 'admin' THEN 0
            ELSE 1
        END,
        customer_code ASC;
`;

msg.params = [];

node.status({
    fill: "green",
    shape: "dot",
    text: "查詢客戶列表"
});

return msg;
```

#### 管理員結果處理

- **ID**: `6131c7aa6f672e7d`
- **Outputs**: 1
- **程式碼**:

```javascript
// =================================================================
// 管理員結果處理程式（完整版）
// 位置：PostgreSQL → [這裡] → UI Template
// 輸出數：1
// =================================================================

const log = (msg) => {
    if (typeof node !== 'undefined' && node.warn) {
        node.warn(msg);
    }
};

log('=====================================');
log('[管理員結果] 開始處理');
log('=====================================');

// ========== 檢查是否為管理員操作 ==========
const isAdminOperation = msg._original_request?.target === 'admin_page';

if (!isAdminOperation) {
    log('[管理員結果] 不是管理員操作，跳過');
    return null;
}

const action = msg._original_request.action;
log(`[管理員結果] 處理動作: ${action}`);

// ========== 檢查 PostgreSQL 錯誤 ==========
if (msg.error) {
    log(`[管理員結果] ❌ 資料庫錯誤: ${msg.error}`);

    return {
        payload: {
            action: action,
            error: msg.error,
            success: false
        }
    };
}

// ========== 檢查查詢結果 ==========
if (!msg.payload) {
    log('[管理員結果] ⚠️ payload 為空');

    return {
        payload: {
            action: action,
            data: [],
            success: true
        }
    };
}

// ========== 處理不同的動作 ==========
let result;

if (Array.isArray(msg.payload)) {
    // 陣列結果（列表查詢）
    log(`[管理員結果] ✅ 查詢到 ${msg.payload.length} 筆資料`);

    result = {
        payload: msg.payload  // 直接回傳 PostgreSQL 結果
    };

} else if (msg.payload && typeof msg.payload === 'object') {
    // 物件結果（單筆操作）
    log('[管理員結果] ✅ 操作成功');

    result = {
        payload: {
            action: action,
            data: msg.payload,
            success: true
        }
    };

} else {
    // 其他情況
    log('[管理員結果] ⚠️ 未知的結果格式');

    result = {
        payload: {
            action: action,
            data: msg.payload,
            success: true
        }
    };
}

// ========== 除錯資訊 ==========
if (action === 'list_customers') {
    log('[管理員結果] 客戶列表資料:');
    if (Array.isArray(msg.payload) && msg.payload.length > 0) {
        log(`  - 第一筆: ${JSON.stringify(msg.payload[0])}`);
    }
}

if (action === 'get_all_devices') {
    log('[管理員結果] 設備列表資料:');
    if (Array.isArray(msg.payload) && msg.payload.length > 0) {
        log(`  - 第一筆: ${JSON.stringify(msg.payload[0])}`);
    }
}

log('[管理員結果] 回傳資料到 UI Template');
log('=====================================');

// ========== 設置節點狀態 ==========
if (typeof node !== 'undefined' && node.status) {
    let statusText;
    if (Array.isArray(msg.payload)) {
        statusText = `✅ ${action}: ${msg.payload.length}筆`;
    } else {
        statusText = `✅ ${action}`;
    }

    node.status({
        fill: "green",
        shape: "dot",
        text: statusText
    });
}

return result;

// =================================================================
// 📋 使用說明
// =================================================================
//
// 1. 在 Node-RED 中創建一個新的 Function 節點
// 2. 名稱：管理員結果處理
// 3. 將此程式碼複製進去
// 4. 輸出數：1
// 5. 連線方式：
//    [PostgreSQL] → [管理員結果處理] → [UI Template (admin)]
//
// =================================================================
// 🔍 處理的動作
// =================================================================
//
// - list_customers      查詢客戶列表
// - add_customer        新增客戶
// - update_customer     更新客戶
// - toggle_customer     啟用/停用客戶
// - delete_customer     刪除客戶
// - reset_password      重設密碼
// - get_all_devices     查詢所有設備
//
// =================================================================
// 📊 回傳格式
// =================================================================
//
// 列表查詢（list_customers, get_all_devices）：
// {
//     payload: [
//         {customer_code: 'A001', ...},
//         {customer_code: 'B002', ...}
//     ]
// }
//
// 單筆操作（add_customer, update_customer）：
// {
//     payload: {
//         action: 'add_customer',
//         data: {...},
//         success: true
//     }
// }
//
// 錯誤情況：
// {
//     payload: {
//         action: 'xxx',
//         error: '錯誤訊息',
//         success: false
//     }
// }
//
// =================================================================
```

#### Return Logo Base64

- **ID**: `func_return_icon`
- **Outputs**: 1
- **程式碼**:

```javascript
// ⚠️ 請將你複製的 Base64 貼在下面這行（替換整個字串）
const logoBase64 = "data:image/png;base64,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";

// 將 Base64 轉換為 Buffer
const base64Data = logoBase64.split(',')[1];
const imageBuffer = Buffer.from(base64Data, 'base64');

// 設定回應
msg.payload = imageBuffer;
msg.headers = {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=31536000',
    'Access-Control-Allow-Origin': '*'
};

return msg;
```

#### Generate manifest.json

- **ID**: `func_manifest`
- **Outputs**: 1
- **程式碼**:

```javascript
// PWA Manifest 設定
msg.payload = {
    "name": "SOLARSDGS 太陽能監控系統",
    "short_name": "SOLARSDGS",
    "description": "專業的太陽能發電即時監控平台",
    "start_url": "/dashboard/login",
    "display": "standalone",
    "background_color": "#2c3e50",
    "theme_color": "#FFD700",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "/api/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/api/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/api/icon-180.png",
            "sizes": "180x180",
            "type": "image/png"
        }
    ],
    "scope": "/",
    "categories": ["productivity", "utilities", "energy"]
};

msg.headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*"
};

return msg;
```


## 7. UI 主題配置

- **Theme**: Default Theme
  - Primary: `#0094CE`
  - Background: `N/A`
  - Background Page: `#eeeeee`


## 8. UI Base 配置

- **Path**: `/dashboard`
- **Title**: Dashboard

