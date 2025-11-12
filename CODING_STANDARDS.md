# SolarSDGs IoT - 程式碼規範

> 📐 統一的程式碼風格指南 | 基於業界標準 | HTML + JavaScript/TypeScript + Python

**參考標準**:
- HTML: [W3C HTML5](https://www.w3.org/TR/html5/) + [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- JavaScript/TypeScript: [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Python: [PEP 8](https://peps.python.org/pep-0008/)

---

## 📋 目錄

1. [通用規範](#通用規範)
2. [HTML 規範](#html-規範)
3. [CSS 規範](#css-規範)
4. [JavaScript/TypeScript 規範](#javascripttypescript-規範)
5. [Vue.js 規範](#vuejs-規範)
6. [Python 規範](#python-規範)
7. [Git 提交規範](#git-提交規範)
8. [文檔規範](#文檔規範)

---

## 通用規範

### 檔案編碼

```
✅ 使用 UTF-8 (without BOM)
✅ 使用 LF (\n) 作為換行符號
❌ 不要使用 CRLF (\r\n) - Windows 預設
```

### 縮排規則

```javascript
// ✅ 使用 2 個空格縮排
function example() {
  if (condition) {
    doSomething();
  }
}

// ❌ 不要使用 Tab 或 4 個空格
function example() {
    if (condition) {  // ❌ 4 spaces
        doSomething();
    }
}
```

### 檔案命名

```bash
# ✅ 後端檔案 - PascalCase (類別) 或 camelCase
MqttService.ts              # 類別
powerData.types.ts          # 類型定義
helpers.ts                  # 工具函數

# ✅ 前端 Vue 組件 - PascalCase
PowerCard.vue
DeviceList.vue
AppHeader.vue

# ✅ 配置檔案 - kebab-case
docker-compose.yml
vite.config.ts
.env.example

# ❌ 不要使用 snake_case
mqtt_service.ts            # ❌
power_card.vue             # ❌
```

---

## HTML 規範

### 基本規則

#### 1. DOCTYPE 聲明

```html
<!-- ✅ 正確: HTML5 DOCTYPE -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolarSDGs IoT Dashboard</title>
</head>
<body>
  <!-- 內容 -->
</body>
</html>

<!-- ❌ 錯誤: 舊版 DOCTYPE -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">  <!-- ❌ -->
```

#### 2. 語義化標籤

```html
<!-- ✅ 正確: 使用語義化標籤 -->
<header>
  <h1>太陽能監控系統</h1>
  <nav>
    <ul>
      <li><a href="/">首頁</a></li>
      <li><a href="/dashboard">儀表板</a></li>
    </ul>
  </nav>
</header>

<main>
  <section class="power-section">
    <h2>即時功率</h2>
    <article class="power-data">
      <p>發電功率: <strong>150W</strong></p>
    </article>
  </section>
</main>

<footer>
  <p>&copy; 2025 SolarSDGs</p>
</footer>

<!-- ❌ 錯誤: 濫用 div -->
<div class="header">        <!-- ❌ 應該用 <header> -->
  <div class="title">標題</div>  <!-- ❌ 應該用 <h1> -->
  <div class="menu">        <!-- ❌ 應該用 <nav> -->
    <!-- ... -->
  </div>
</div>
```

#### 3. 屬性規則

```html
<!-- ✅ 正確: 屬性使用雙引號 -->
<img src="logo.png" alt="SolarSDGs Logo" width="200" height="100">

<!-- ✅ 正確: 布林屬性可以省略值 -->
<input type="checkbox" checked>
<button disabled>送出</button>

<!-- ❌ 錯誤: 使用單引號 -->
<img src='logo.png' alt='Logo'>  <!-- ❌ -->

<!-- ❌ 錯誤: 屬性沒有引號 -->
<img src=logo.png alt=Logo>      <!-- ❌ -->
```

#### 4. 標籤閉合

```html
<!-- ✅ 正確: 所有標籤都要閉合 -->
<section>
  <p>這是一段文字。</p>
  <p>這是另一段文字。</p>
</section>

<!-- ✅ 正確: 自閉合標籤 (可選擇是否加 /) -->
<img src="image.png" alt="Image">
<img src="image.png" alt="Image" />  <!-- 兩種都可以 -->

<!-- ❌ 錯誤: 沒有閉合標籤 -->
<section>
  <p>這是一段文字。
  <p>這是另一段文字。
</section>
```

#### 5. 無障礙設計

```html
<!-- ✅ 正確: 圖片必須有 alt 屬性 -->
<img src="chart.png" alt="功率變化圖表">

<!-- ✅ 正確: 表單元素必須有 label -->
<label for="device-id">設備編號:</label>
<input type="text" id="device-id" name="deviceId">

<!-- ✅ 正確: 按鈕應該有明確的文字 -->
<button type="submit">提交數據</button>

<!-- ❌ 錯誤: 缺少 alt 屬性 -->
<img src="chart.png">  <!-- ❌ -->

<!-- ❌ 錯誤: 表單元素沒有 label -->
<input type="text" name="deviceId">  <!-- ❌ -->
```

---

## CSS 規範

### 基本規則

#### 1. 選擇器命名

```css
/* ✅ 正確: 使用 kebab-case */
.power-card { }
.device-list { }
.nav-item { }

/* ✅ 正確: BEM 命名法 (Block Element Modifier) */
.power-card { }
.power-card__header { }
.power-card__value { }
.power-card--large { }

/* ❌ 錯誤: 使用 camelCase 或 snake_case */
.powerCard { }      /* ❌ */
.power_card { }     /* ❌ */
```

#### 2. 選擇器優先順序

```css
/* ✅ 正確: 優先使用 class */
.power-card {
  padding: 20px;
}

/* ✅ 正確: 特定情況使用 ID */
#app {
  height: 100vh;
}

/* ❌ 錯誤: 過度使用 ID 選擇器 */
#header { }         /* ❌ 應該用 .header */
#content { }        /* ❌ 應該用 .content */
```

#### 3. 屬性排序

```css
/* ✅ 正確: 相關屬性分組排列 */
.power-card {
  /* 定位 */
  position: relative;
  top: 0;
  left: 0;
  
  /* 盒模型 */
  display: flex;
  width: 300px;
  height: 200px;
  padding: 20px;
  margin: 10px;
  border: 1px solid #ddd;
  
  /* 視覺 */
  background-color: #fff;
  color: #333;
  font-size: 16px;
  
  /* 其他 */
  cursor: pointer;
  transition: all 0.3s;
}
```

---

## JavaScript/TypeScript 規範

### 基於 Airbnb Style Guide

#### 1. 變數聲明

```javascript
// ✅ 正確: 使用 const 和 let
const API_URL = 'https://api.solarsdgs.com';  // 不會變的值用 const
let deviceId = '6001';                         // 會變的值用 let

// ✅ 正確: 一次只聲明一個變數
const powerData = [];
const deviceList = [];

// ❌ 錯誤: 使用 var
var deviceId = '6001';  // ❌

// ❌ 錯誤: 一次聲明多個變數
const powerData = [], deviceList = [];  // ❌ 不易閱讀
```

#### 2. 命名規範

```javascript
// ✅ 正確: 變數和函數使用 camelCase
const deviceId = '6001';
const powerData = [];
function calculateEfficiency() { }

// ✅ 正確: 類別使用 PascalCase
class PowerDataService { }
class MqttClient { }

// ✅ 正確: 常數使用 UPPER_SNAKE_CASE
const API_URL = 'https://api.solarsdgs.com';
const MAX_RETRIES = 5;
const MQTT_BROKER = 'mqtt.alwaysbefound.com';

// ✅ 正確: 私有成員使用 _ 前綴
class PowerDataService {
  private _cache = [];
  private _processData() { }
}

// ❌ 錯誤: 命名不符合規範
const device_id = '6001';           // ❌ 應該用 camelCase
const APIURL = 'https://...';       // ❌ 應該用 UPPER_SNAKE_CASE
class powerDataService { }          // ❌ 應該用 PascalCase
```

#### 3. 函數定義

```javascript
// ✅ 正確: 使用箭頭函數 (簡短函數)
const calculateEfficiency = (pg, pa) => {
  return pg > 0 ? ((pa - pg) / pg) * 100 : 0;
};

// ✅ 正確: 單一參數可省略括號
const square = x => x * x;

// ✅ 正確: 單一表達式可省略 return
const add = (a, b) => a + b;

// ✅ 正確: 函數聲明 (複雜函數)
function processData(data) {
  // 複雜的處理邏輯
  const step1 = validate(data);
  const step2 = transform(step1);
  const step3 = save(step2);
  return step3;
}

// ❌ 錯誤: 使用 function 關鍵字定義簡單函數
const add = function(a, b) {  // ❌ 應該用箭頭函數
  return a + b;
};
```

#### 4. 對象與陣列

```javascript
// ✅ 正確: 對象字面量
const powerData = {
  deviceId: '6001',
  pg: 150,
  pa: 180,
  pp: 170
};

// ✅ 正確: 使用簡寫屬性
const deviceId = '6001';
const status = 'online';

const device = {
  deviceId,     // ✅ 等同於 deviceId: deviceId
  status        // ✅ 等同於 status: status
};

// ✅ 正確: 使用陣列展開運算符
const newData = [...oldData, newItem];

// ✅ 正確: 使用對象展開運算符
const updatedDevice = { ...device, status: 'offline' };

// ✅ 正確: 解構賦值
const { deviceId, pg, pa, pp } = powerData;
const [first, second, ...rest] = dataArray;

// ❌ 錯誤: 使用 new Object() 或 new Array()
const obj = new Object();  // ❌ 應該用 {}
const arr = new Array();   // ❌ 應該用 []
```

#### 5. 字串處理

```javascript
// ✅ 正確: 使用單引號
const deviceId = '6001';
const status = 'online';

// ✅ 正確: 使用模板字串 (有變數時)
const message = `設備 ${deviceId} 的狀態為 ${status}`;
const html = `
  <div class="device">
    <span>${deviceId}</span>
  </div>
`;

// ✅ 正確: 多行字串
const longText = 'This is a very long text ' +
                 'that spans multiple lines.';

// ❌ 錯誤: 使用雙引號 (除非字串中包含單引號)
const deviceId = "6001";  // ❌

// ❌ 錯誤: 字串拼接 (應該用模板字串)
const message = '設備 ' + deviceId + ' 的狀態為 ' + status;  // ❌
```

#### 6. 條件判斷

```javascript
// ✅ 正確: 使用嚴格相等 ===
if (deviceId === '6001') { }
if (value !== null) { }

// ✅ 正確: 三元運算符 (簡單判斷)
const status = isOnline ? 'online' : 'offline';

// ✅ 正確: 短路求值
const value = input || defaultValue;
const result = condition && doSomething();

// ❌ 錯誤: 使用鬆散相等 ==
if (deviceId == '6001') { }  // ❌

// ❌ 錯誤: 巢狀三元運算符
const value = condition1 ? value1 : condition2 ? value2 : value3;  // ❌ 難以閱讀
```

#### 7. 循環

```javascript
// ✅ 正確: 使用 for...of (陣列)
for (const item of dataArray) {
  console.log(item);
}

// ✅ 正確: 使用 forEach (陣列)
dataArray.forEach(item => {
  console.log(item);
});

// ✅ 正確: 使用 for...in (對象)
for (const key in object) {
  if (object.hasOwnProperty(key)) {
    console.log(key, object[key]);
  }
}

// ✅ 正確: 使用陣列方法
const processed = dataArray
  .filter(item => item.pg > 0)
  .map(item => ({ ...item, efficiency: calc(item) }))
  .sort((a, b) => a.timestamp - b.timestamp);

// ❌ 錯誤: 使用傳統 for 迴圈 (除非需要索引)
for (let i = 0; i < dataArray.length; i++) {  // ❌ 應該用 for...of
  console.log(dataArray[i]);
}
```

#### 8. 異步處理

```javascript
// ✅ 正確: 使用 async/await
async function fetchPowerData(deviceId) {
  try {
    const response = await api.get(`/devices/${deviceId}/data`);
    const data = response.data;
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ✅ 正確: Promise 鏈 (簡單情況)
api.get('/devices')
  .then(response => response.data)
  .then(data => processData(data))
  .catch(error => console.error(error));

// ❌ 錯誤: 使用 callback
function fetchData(deviceId, callback) {  // ❌ 應該用 Promise 或 async/await
  api.get(`/devices/${deviceId}`, (err, data) => {
    if (err) return callback(err);
    callback(null, data);
  });
}
```

### TypeScript 特定規範

#### 1. 類型定義

```typescript
// ✅ 正確: 明確的類型定義
interface PowerData {
  device_id: string;
  timestamp: Date;
  pg: number;
  pa: number;
  pp: number;
  pag?: number;  // 可選屬性
  ppg?: number;
}

// ✅ 正確: 函數類型
function calculateEfficiency(
  pg: number,
  pa: number
): number {
  return pg > 0 ? ((pa - pg) / pg) * 100 : 0;
}

// ✅ 正確: 泛型
function getFirst<T>(array: T[]): T | undefined {
  return array[0];
}

// ❌ 錯誤: 使用 any
function process(data: any): any {  // ❌
  return data.value;
}
```

#### 2. Interface vs Type

```typescript
// ✅ 正確: 優先使用 Interface (對象結構)
interface PowerData {
  device_id: string;
  pg: number;
  pa: number;
}

// ✅ 正確: 使用 Type (聯合類型、交叉類型)
type Status = 'online' | 'offline' | 'error';
type ID = string | number;
type Combined = TypeA & TypeB;

// ✅ 正確: Interface 可以繼承
interface ExtendedPowerData extends PowerData {
  pag: number;
  ppg: number;
}
```

---

## Vue.js 規範

### 基於 Vue 3 官方風格指南

#### 1. 組件命名

```vue
<!-- ✅ 正確: 組件名稱使用 PascalCase -->
<script setup lang="ts">
// PowerCard.vue
</script>

<!-- ✅ 正確: 在模板中使用 PascalCase 或 kebab-case -->
<template>
  <PowerCard :value="150" />
  <!-- 或 -->
  <power-card :value="150" />
</template>

<!-- ❌ 錯誤: 單詞組件名 -->
<!-- Card.vue - ❌ 應該是 PowerCard.vue -->

<!-- ❌ 錯誤: 使用 snake_case -->
<!-- power_card.vue - ❌ -->
```

#### 2. Props 定義

```vue
<script setup lang="ts">
// ✅ 正確: 使用 TypeScript 定義 Props
interface Props {
  deviceId: string;
  value: number;
  unit?: string;  // 可選
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'W'  // 預設值
});

// ✅ 正確: 使用運行時驗證
defineProps({
  deviceId: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 0
  }
});

// ❌ 錯誤: 沒有類型定義
const props = defineProps(['deviceId', 'value']);  // ❌
</script>
```

#### 3. Emits 定義

```vue
<script setup lang="ts">
// ✅ 正確: 明確定義 emits
const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'delete', id: string): void
}>();

// 使用
emit('update', 150);
emit('delete', '6001');

// ❌ 錯誤: 沒有定義 emits
const emit = defineEmits();  // ❌
emit('unknownEvent');        // ❌ TypeScript 無法檢查
</script>
```

#### 4. 模板規範

```vue
<template>
  <!-- ✅ 正確: 使用 v-bind 簡寫 -->
  <PowerCard :value="pg" :unit="unit" />
  
  <!-- ✅ 正確: 使用 v-on 簡寫 -->
  <button @click="handleClick">點擊</button>
  
  <!-- ✅ 正確: 條件渲染使用 v-if -->
  <div v-if="isLoading">載入中...</div>
  <div v-else-if="hasError">錯誤: {{ error }}</div>
  <div v-else>{{ data }}</div>
  
  <!-- ✅ 正確: 列表渲染使用 v-for -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
  
  <!-- ❌ 錯誤: 使用完整指令名稱 -->
  <PowerCard v-bind:value="pg" />  <!-- ❌ 應該用 :value -->
  <button v-on:click="handleClick">點擊</button>  <!-- ❌ 應該用 @click -->
  
  <!-- ❌ 錯誤: v-for 沒有 :key -->
  <div v-for="item in items">  <!-- ❌ 缺少 :key -->
    {{ item.name }}
  </div>
</template>
```

#### 5. Composable 規範

```typescript
// ✅ 正確: composables/usePowerData.ts
import { ref, computed } from 'vue';

export function usePowerData() {
  // State
  const data = ref<PowerData[]>([]);
  const loading = ref(false);
  
  // Computed
  const latestData = computed(() => {
    return data.value[data.value.length - 1];
  });
  
  // Methods
  async function fetchData(deviceId: string) {
    loading.value = true;
    try {
      const result = await api.get(deviceId);
      data.value = result.data;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    data,
    loading,
    latestData,
    fetchData
  };
}

// ❌ 錯誤: 直接在組件中寫複雜邏輯
<script setup>
const data = ref([]);
async function fetchData() {
  // 複雜邏輯... ❌ 應該抽取到 composable
}
</script>
```

---

## Python 規範

### 基於 PEP 8

#### 1. 命名規範

```python
# ✅ 正確: 變數和函數使用 snake_case
device_id = '6001'
power_data = []

def calculate_efficiency(pg, pa):
    return ((pa - pg) / pg) * 100

# ✅ 正確: 類別使用 PascalCase
class PowerDataParser:
    def __init__(self):
        self.data = []

# ✅ 正確: 常數使用 UPPER_SNAKE_CASE
MQTT_BROKER = 'mqtt.alwaysbefound.com'
MQTT_PORT = 1883
MAX_RETRIES = 5

# ✅ 正確: 私有成員使用 _ 前綴
class PowerDataService:
    def __init__(self):
        self._cache = []
    
    def _process_data(self, data):
        pass

# ❌ 錯誤: 使用 camelCase (Java/JavaScript 風格)
def calculateEfficiency(pg, pa):  # ❌ 應該用 snake_case
    pass

class powerDataParser:  # ❌ 應該用 PascalCase
    pass
```

#### 2. 縮排與空格

```python
# ✅ 正確: 使用 4 個空格縮排
def process_data(data):
    if data:
        for item in data:
            print(item)

# ✅ 正確: 運算符周圍要有空格
x = 5
y = x + 10
result = (x + y) * 2

# ✅ 正確: 逗號後面要有空格
data = [1, 2, 3, 4, 5]
point = {'x': 10, 'y': 20}

# ❌ 錯誤: 使用 Tab 或 2 個空格
def process_data(data):
  if data:  # ❌ 只有 2 個空格
      for item in data:
          print(item)

# ❌ 錯誤: 運算符周圍沒有空格
x=5  # ❌
y=x+10  # ❌
```

#### 3. 行長度限制

```python
# ✅ 正確: 每行不超過 79 字元
def long_function_name(
    parameter_one, parameter_two,
    parameter_three, parameter_four
):
    print(parameter_one)

# ✅ 正確: 使用括號換行
result = (
    some_long_variable_name +
    another_long_variable_name +
    yet_another_one
)

# ✅ 正確: 字串換行
long_string = (
    'This is a very long string that '
    'spans multiple lines for better '
    'readability.'
)
```

#### 4. 函數定義

```python
# ✅ 正確: 函數應該有 docstring
def calculate_efficiency(pg: int, pa: int) -> float:
    """計算效率
    
    Args:
        pg: 發電功率
        pa: 負載功率
    
    Returns:
        效率百分比
    
    Raises:
        ValueError: 如果 pg 小於等於 0
    """
    if pg <= 0:
        raise ValueError('pg must be greater than 0')
    return ((pa - pg) / pg) * 100

# ✅ 正確: 使用類型提示
def process_data(data: list[dict]) -> dict:
    result = {}
    for item in data:
        result[item['id']] = item
    return result

# ❌ 錯誤: 沒有 docstring 和類型提示
def calculate_efficiency(pg, pa):  # ❌
    return ((pa - pg) / pg) * 100
```

#### 5. 類別定義

```python
# ✅ 正確: 類別定義
class PowerDataParser:
    """功率數據解析器
    
    解析從 Pico W 設備接收的功率數據字串。
    """
    
    def __init__(self, device_id: str):
        """初始化解析器
        
        Args:
            device_id: 設備 ID
        """
        self.device_id = device_id
        self._cache = []
    
    def parse(self, raw_data: str) -> dict:
        """解析原始數據
        
        Args:
            raw_data: 原始數據字串
            
        Returns:
            解析後的字典
        """
        parts = raw_data.split('/')
        return {
            'timestamp': self._parse_timestamp(parts[0]),
            'pg': int(parts[1]),
            'pa': int(parts[2]),
            'pp': int(parts[3])
        }
    
    def _parse_timestamp(self, timestamp_str: str) -> str:
        """解析時間戳（私有方法）"""
        # 實作...
        pass
```

#### 6. Import 規範

```python
# ✅ 正確: Import 順序
# 1. 標準庫
import os
import sys
from datetime import datetime

# 2. 第三方庫
import numpy as np
import pandas as pd
from flask import Flask, request

# 3. 本地模組
from .models import PowerData
from .utils import calculate_efficiency

# ❌ 錯誤: Import 順序混亂
import pandas as pd  # ❌ 第三方庫
import os            # ❌ 標準庫應該在前
from .models import PowerData  # ❌ 本地模組應該在最後
```

---

## Git 提交規範

### Conventional Commits

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型

```bash
feat:     新功能
fix:      錯誤修復
docs:     文檔更新
style:    代碼格式（不影響運行）
refactor: 重構
perf:     效能優化
test:     測試相關
chore:    建構過程或輔助工具
ci:       CI/CD 相關
```

### 範例

```bash
# ✅ 正確: 簡短提交
feat(backend): 新增批次插入功率數據 API

# ✅ 正確: 詳細提交
feat(backend): 新增批次插入功率數據 API

- 實作 PowerDataService.batchCreate() 方法
- 優化 SQL 語句以支援批次插入
- 新增相關單元測試

Closes #123

# ✅ 正確: 修復 bug
fix(frontend): 修復 Dashboard 圖表不更新問題

圖表組件在接收新數據時未重新渲染。
使用 watchEffect 監聽數據變化並強制更新圖表。

Fixes #456

# ❌ 錯誤: 提交訊息不清楚
update files  # ❌
fix bug       # ❌
wip           # ❌
```

---

## 文檔規範

### JSDoc / TSDoc

```typescript
/**
 * 計算效率
 * 
 * @param pg - 發電功率
 * @param pa - 負載功率
 * @returns 效率百分比
 * @throws {AppError} 如果 pg 小於等於 0
 * 
 * @example
 * ```typescript
 * const efficiency = calculateEfficiency(100, 120);
 * console.log(efficiency); // 20
 * ```
 */
function calculateEfficiency(pg: number, pa: number): number {
  if (pg <= 0) {
    throw new AppError(400, 'PG must be greater than 0');
  }
  return ((pa - pg) / pg) * 100;
}
```

### Markdown 文檔

```markdown
# ✅ 正確: 使用清晰的標題層級
# 一級標題
## 二級標題
### 三級標題

# ✅ 正確: 使用代碼區塊
```typescript
const example = 'code here';
```

# ✅ 正確: 使用表格
| 欄位 | 說明 |
|------|------|
| PG   | 發電功率 |
| PA   | 負載功率 |

# ✅ 正確: 使用清單
- 項目一
- 項目二
  - 子項目
  - 子項目

# ❌ 錯誤: 標題層級跳躍
# 一級標題
### 三級標題  # ❌ 跳過了二級標題
```

---

## 🛠️ 工具配置

### ESLint (.eslintrc.json)

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "airbnb-base"
  ],
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-console": "warn",
    "no-unused-vars": "error"
  }
}
```

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### EditorConfig (.editorconfig)

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.py]
indent_size = 4
```

---

## 📚 參考資源

### 官方文檔
- [HTML5 規範](https://www.w3.org/TR/html5/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [PEP 8 – Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Vue.js Style Guide](https://vuejs.org/style-guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 線上檢查工具
- [W3C HTML Validator](https://validator.w3.org/)
- [ESLint Playground](https://eslint.org/play/)
- [PEP 8 Online](http://pep8online.com/)

---

**最後更新**: 2025-11-12  
**版本**: 1.0.0  
**維護者**: SolarSDGs Development Team
