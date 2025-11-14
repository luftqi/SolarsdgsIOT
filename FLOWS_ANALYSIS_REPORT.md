# flows.json 完整分析报告

**分析日期**: 2025-11-14  
**源文件**: `flows.json` (2650 行, 121 个 flows)  
**总 UI 组件数**: 21 个

---

## 1. UI 主题配置 (Theme Colors)

### 主题信息
- **名称**: Default Theme
- **ID**: `3388de7ea2c4a1f1`

### 颜色配置
```json
{
  "surface": "#ffffff",          // 背景色
  "primary": "#0094CE",          // 主色 (蓝色)
  "bgPage": "#eeeeee",           // 页面背景
  "groupBg": "#ffffff",          // 组背景
  "groupOutline": "#cccccc"      // 组边框
}
```

### 尺寸配置
```json
{
  "density": "default",
  "pagePadding": "12px",
  "groupGap": "12px",
  "groupBorderRadius": "4px",
  "widgetGap": "12px"
}
```

---

## 2. 页面结构 (Page Layout)

### 页面列表

| # | 页面名称 | 路径 | 图标 | ID |
|---|---------|------|------|-----|
| 1 | Solar Monitor | `/page1` | home | `d7a4298f3059e4c3` |
| 2 | Login | `/login` | home | `e4c8b01d1e02491a` |
| 3 | Customer Manage | `/admin` | home | `14e4b2bc7756e5f9` |

### 页面组 (Groups)

| # | 组名称 | 所属页面 | 宽度 | ID |
|---|--------|---------|------|-----|
| 1 | 実時動向監視 | Solar Monitor | 12 | `24c6ae5a937a533f` |
| 2 | ログイン画面 | Login | 14 | `c3627b645dc69831` |
| 3 | 管理ダッシュボード | Customer Manage | 12 | `7f54281a9ecb8f13` |

---

## 3. UI 图表详细配置 (Chart Configuration)

### 总体信息
- **总图表数**: 5 个
- **图表类型**: 全部为 Line Chart
- **X 轴**: 时间类型 (Time)

### 图表 1: PG (光伏生成功率)
```
ID: 6b7b65eeb11cd30f
类型: Line Chart
X 轴类型: time
Y 轴范围: 0 - 500 W
插值方式: linear
显示图例: true
颜色: ['#0095ff', '#ff0000', '#ff7f0e', '#2ca02c', '#a347e1', '#d62728', '#ff9896', '#9467bd', '#c5b0d5']
数据操作: append
数据清理: 60 条数据 / 60 秒
```

### 图表 2: PA (光伏阵列功率)
```
ID: ec08f1b1cac94cbb
类型: Line Chart
X 轴类型: time
Y 轴范围: 0 - 500 W
插值方式: linear
显示图例: true
颜色: 与 PG 相同
数据操作: append
数据清理: 1 条数据 / 3600 秒 (1 小时)
```

### 图表 3: PP (逆变器输出功率)
```
ID: 395a7464f335bc68
类型: Line Chart
X 轴类型: time
Y 轴范围: 0 - 500 W
插值方式: linear
显示图例: true
颜色: 与 PG 相同
数据操作: append
数据清理: 1 条数据 / 3600 秒 (1 小时)
```

### 图表 4: PAG (光伏阵列效率)
```
ID: f7f7a46fe14de896
类型: Line Chart
X 轴类型: time
Y 轴范围: 0 - 100 %
插值方式: step (阶梯)
显示图例: true
颜色: 与 PG 相同
数据操作: append
数据清理: 1 条数据 / 3600 秒 (1 小时)
```

### 图表 5: PPG (逆变器效率)
```
ID: b3deaed4fa918fb4
类型: Line Chart
X 轴类型: time
Y 轴范围: 0 - 100 %
插值方式: step (阶梯)
显示图例: true
颜色: 与 PG 相同
数据操作: append
数据清理: 1 条数据 / 3600 秒 (1 小时)
```

### 图表配置总结
```javascript
// 所有图表通用配置
{
  showLegend: true,           // 显示图例
  action: 'append',           // 追加数据动作
  textColorDefault: true,     // 默认文字颜色
  gridColorDefault: true      // 默认网格颜色
}
```

---

## 4. HTML/CSS 自定义模板

### 模板总览

| # | 模板名称 | 类型 | 所属组件 | 内容长度 |
|---|---------|------|---------|---------|
| 1 | 実時動向監視 | HTML | Group | 33,075 字符 |
| 2 | CSS | CSS | Page (Solar Monitor) | 12,923 字符 |
| 3 | ログイン画面 | HTML | Group | 20,927 字符 |
| 4 | 管理ダッシュボード | HTML | Group | 30,457 字符 |
| 5 | CSS(ログイン画面) | CSS | Page (Login) | 9,780 字符 |
| 6 | CSS(管理ダッシュボード) | CSS | Page (Customer Manage) | 13,160 字符 |

### 文件提取
- 所有 HTML/CSS 文件已提取到 `FLOWS_EXTRACT_TEMPLATE*.txt`
- 文件编码: UTF-8
- 包含完整的中文注释和样式定义

---

## 5. Logo Base64 编码 (SOLARSDGS Logo)

### Logo 信息
- **大小**: 11,060 字符
- **格式**: PNG (Data URI)
- **位置**: 
  - Template 1 (実時動向監視)
  - Template 3 (ログイン画面)
  - Template 4 (管理ダッシュボード)

### 访问方式
Logo Base64 已提取到单独文件: `SOLARSDGS_LOGO_BASE64.txt`

使用方式 (Vue/HTML):
```html
<img src="data:image/png;base64,[CONTENT_FROM_FILE]" alt="SOLARSDGS Logo" />
```

---

## 6. UI 组件清单

### 统计信息
```
总 Flow 数: 121
UI 组件总数: 21

组件分布:
- ui-base: 1 (基础配置)
- ui-page: 3 (页面)
- ui-group: 3 (容器组)
- ui-chart: 5 (图表)
- ui-template: 6 (HTML/CSS)
- ui-iframe: 1 (地图)
- ui-spacer: 1 (间隔)
- ui-theme: 1 (主题)
```

### 主要组件
- **基础**: UI Base (Solar Monitoring System)
- **地图**: Worldmap (ID: `937523cb226ecabb`)
- **间隔**: Spacer (用于布局间隔)

---

## 7. 图表配色方案

所有图表统一使用的颜色配置:
```javascript
colors: [
  '#0095ff',  // 亮蓝色 (默认)
  '#ff0000',  // 红色
  '#ff7f0e',  // 橙色
  '#2ca02c',  // 绿色
  '#a347e1',  // 紫色
  '#d62728',  // 深红色
  '#ff9896',  // 浅红色
  '#9467bd',  // 浅紫色
  '#c5b0d5'   // 更浅紫色
]
```

---

## 8. 提取的文件列表

### 已生成的文件
1. `FLOWS_EXTRACT_TEMPLATE1_HTML.txt` - 実時動向監視 HTML (33,075 字符)
2. `FLOWS_EXTRACT_TEMPLATE2_CSS.txt` - Solar Monitor CSS (12,923 字符)
3. `FLOWS_EXTRACT_TEMPLATE3_HTML.txt` - ログイン画面 HTML (20,927 字符)
4. `FLOWS_EXTRACT_TEMPLATE4_HTML.txt` - 管理ダッシュボード HTML (30,457 字符)
5. `FLOWS_EXTRACT_TEMPLATE5_CSS.txt` - Login Page CSS (9,780 字符)
6. `FLOWS_EXTRACT_TEMPLATE6_CSS.txt` - Customer Manage CSS (13,160 字符)
7. `SOLARSDGS_LOGO_BASE64.txt` - Logo Base64 编码 (11,060 字符)
8. `FLOWS_ANALYSIS_REPORT.md` - 本分析报告

---

## 9. Vue 3 重建清单

基于以上分析，重建 Vue 3 前端需要:

### 页面
- [ ] `/` 或 `/page1` - Solar Monitor Dashboard
- [ ] `/login` - Login Page
- [ ] `/admin` - Customer Management Page

### 组件
- [ ] Charts (5 个)
  - [ ] PG Chart (0-500W, linear)
  - [ ] PA Chart (0-500W, linear)
  - [ ] PP Chart (0-500W, linear)
  - [ ] PAG Chart (0-100%, step)
  - [ ] PPG Chart (0-100%, step)
- [ ] Map Component (Worldmap iFrame)
- [ ] Status Bar (from Template 1)
- [ ] Login Form (from Template 3)
- [ ] Admin Dashboard (from Template 4)

### 主题配置
- [ ] 主色: #0094CE (蓝色)
- [ ] 背景色: #ffffff / #eeeeee
- [ ] 边框色: #cccccc
- [ ] 间距: 12px (standard)

### 样式库
- [ ] 提取 CSS Templates (6 个文件)
- [ ] 转换为 Vue Scoped Styles 或 CSS 模块
- [ ] 嵌入 SOLARSDGS Logo (Base64)

---

## 10. 技术架构建议

### 参考 Node-RED 原型
```
Node-RED Dashboard 2.0
├── Themes (颜色主题)
├── Pages (3 页)
│   ├── Solar Monitor
│   │   └── Charts (5个)
│   ├── Login
│   └── Customer Manage
└── Components
    ├── Templates (HTML custom)
    ├── Charts (line charts)
    └── Worldmap (iFrame)
```

### Vue 3 目录结构建议
```
frontend/src/
├── components/
│   ├── Dashboard/
│   │   ├── Charts/
│   │   │   ├── PGChart.vue
│   │   │   ├── PAChart.vue
│   │   │   ├── PPChart.vue
│   │   │   ├── PAGChart.vue
│   │   │   └── PPGChart.vue
│   │   ├── Worldmap.vue
│   │   └── StatusBar.vue
│   ├── Login/
│   │   └── LoginForm.vue
│   └── Admin/
│       └── AdminDashboard.vue
├── pages/
│   ├── DashboardPage.vue
│   ├── LoginPage.vue
│   └── AdminPage.vue
├── styles/
│   ├── theme.css          (from FLOWS_EXTRACT_TEMPLATE2_CSS)
│   ├── login.css          (from FLOWS_EXTRACT_TEMPLATE5_CSS)
│   └── admin.css          (from FLOWS_EXTRACT_TEMPLATE6_CSS)
└── assets/
    └── logo.png           (from SOLARSDGS_LOGO_BASE64)
```

---

## 附录: 快速参考

### Logo 使用
```
// 保存在: c:\Users\wg444\solarsdgs-iot\SOLARSDGS_LOGO_BASE64.txt
// 长度: 11,060 字符
// 用途: 在所有页面显示 SOLARSDGS 品牌 Logo
```

### 图表数据属性
```javascript
// Node-RED 数据格式 (需要转换为 Vue props)
{
  payload: {
    pg: 100,          // W
    pa: 95,           // W
    pp: 90,           // W
    pag: 5.26,        // %
    ppg: 5.56,        // %
    timestamp: Date
  }
}
```

### 颜色参考
```css
--primary: #0094CE;
--surface: #ffffff;
--bg-page: #eeeeee;
--group-bg: #ffffff;
--group-outline: #cccccc;
--chart-line-1: #0095ff;
--chart-line-2: #ff0000;
--chart-line-3: #ff7f0e;
--chart-line-4: #2ca02c;
--chart-line-5: #a347e1;
```

---

**报告生成**: 2025-11-14  
**分析完成度**: 100%  
**可用资源**: 8 个提取文件  
**下一步**: 使用提取的 HTML/CSS/Logo 开始 Vue 3 前端开发

