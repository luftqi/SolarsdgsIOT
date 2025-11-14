# flows.json 完整提取 - 资源索引

生成时间: 2025-11-14
源文件: flows.json (2650 行, 121 个 flows)
总资源: 9 个文件, 约 147 KB

---

## 快速导航

### 文档
| 文件 | 大小 | 说明 |
|------|------|------|
| FLOWS_ANALYSIS_REPORT.md | 8.7 KB | 详细分析报告 |
| FLOWS_EXTRACTION_SUMMARY.txt | 6 KB | 提取总结 |
| FLOWS_EXTRACTION_INDEX.md | 本文件 | 资源导航 |

### 前端资源

#### HTML 模板 (3 个)
| 文件 | 大小 | 用途 |
|------|------|------|
| FLOWS_EXTRACT_TEMPLATE1_HTML.txt | 34 KB | Dashboard 仪表板 |
| FLOWS_EXTRACT_TEMPLATE3_HTML.txt | 22 KB | Login 登录表单 |
| FLOWS_EXTRACT_TEMPLATE4_HTML.txt | 32 KB | Admin 管理面板 |

#### CSS 样式 (3 个)
| 文件 | 大小 | 用途 |
|------|------|------|
| FLOWS_EXTRACT_TEMPLATE2_CSS.txt | 14 KB | Dashboard 样式 |
| FLOWS_EXTRACT_TEMPLATE5_CSS.txt | 11 KB | Login 样式 |
| FLOWS_EXTRACT_TEMPLATE6_CSS.txt | 14 KB | Admin 样式 |

#### Logo 资源
| 文件 | 大小 | 格式 |
|------|------|------|
| SOLARSDGS_LOGO_BASE64.txt | 11 KB | PNG Base64 |

---

## 关键数据总结

### UI 主题
- 主色: #0094CE (蓝色)
- 背景: #ffffff (白色)
- 页面背景: #eeeeee (灰色)
- 边框: #cccccc
- 间距: 12px

### 页面路由
- /page1 → Solar Monitor Dashboard
- /login → Login Page
- /admin → Customer Management

### 图表 (5 个)
- PG (功率, 0-500W, linear)
- PA (功率, 0-500W, linear)
- PP (功率, 0-500W, linear)
- PAG (效率, 0-100%, step)
- PPG (效率, 0-100%, step)

### 图表颜色
#0095ff, #ff0000, #ff7f0e, #2ca02c, #a347e1, #d62728, #ff9896, #9467bd, #c5b0d5

---

## Vue 3 重建指南

### 推荐目录结构

frontend/src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardPage.vue (from TEMPLATE1)
│   │   ├── Charts/ (PGChart, PAChart, PPChart, PAGChart, PPGChart)
│   ├── Login/
│   │   └── LoginPage.vue (from TEMPLATE3)
│   └── Admin/
│       └── AdminPage.vue (from TEMPLATE4)
├── styles/
│   ├── theme.css (from TEMPLATE2_CSS)
│   ├── login.css (from TEMPLATE5_CSS)
│   └── admin.css (from TEMPLATE6_CSS)
├── assets/
│   └── logo.ts (from SOLARSDGS_LOGO_BASE64)
└── router/
    └── index.ts

### 快速开始步骤

1. 复制 HTML 模板到 Vue 组件
2. 复制 CSS 样式到 scoped styles
3. 配置主题颜色变量
4. 创建 Chart 组件
5. 设置 WebSocket 连接
6. 配置路由

---

## 文件完整性

✓ HTML 模板 (3 个, 84,459 字符)
✓ CSS 样式 (3 个, 35,863 字符)
✓ SOLARSDGS Logo (1 个, 11,060 字符)
✓ 页面配置 (3 个路由)
✓ 图表配置 (5 个图表)
✓ 颜色主题 (5 种颜色)

提取率: 100%
完整度: 100%

---

更多详情请查看:
- FLOWS_ANALYSIS_REPORT.md (详细分析)
- FLOWS_EXTRACTION_SUMMARY.txt (技术规格)

