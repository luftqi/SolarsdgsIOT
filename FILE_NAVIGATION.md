# 📚 SolarSDGs IoT 專案文檔導航

> 快速找到您需要的文檔

---

## 🚀 快速開始（按順序閱讀）

1. **[專案總結](./PROJECT_SUMMARY.md)** ⭐ **從這裡開始！**
   - 📄 了解專案完成狀況
   - 📄 查看交付物清單
   - 📄 了解下一步行動

2. **[README.md](./README.md)** - 專案說明（5 分鐘閱讀）
   - 專案簡介與功能
   - 快速開始指南
   - 技術棧說明
   - 資料庫設計

3. **[CLAUDE.md](./CLAUDE.md)** - 給 Claude Code 的開發指引（10 分鐘閱讀）
   - 核心架構原則
   - Node-RED 遷移對應
   - 程式碼範本
   - 開發檢查清單

4. **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** - 詳細程式碼規範（參考用）
   - HTML/CSS 規範
   - JavaScript/TypeScript 規範
   - Vue.js 規範
   - Python 規範

5. **[完整專案結構](./SOLARSDGS_IOT_PROJECT_STRUCTURE.md)** - 目錄樹結構（參考用）
   - 完整的目錄樹
   - 檔案說明
   - 技術棧詳細說明

---

## 📁 文檔分類

### 給人類開發者

| 文檔 | 用途 | 閱讀時機 |
|------|------|----------|
| `PROJECT_SUMMARY.md` | 專案總結與下一步 | ⭐ 最先閱讀 |
| `README.md` | 專案說明與快速開始 | 開始開發前 |
| `CODING_STANDARDS.md` | 程式碼規範 | 寫程式碼時參考 |
| `SOLARSDGS_IOT_PROJECT_STRUCTURE.md` | 完整目錄結構 | 建立專案結構時 |

### 給 Claude Code AI

| 文檔 | 用途 | 重要性 |
|------|------|--------|
| `CLAUDE.md` | 開發指引與規範 | ⭐⭐⭐⭐⭐ 最重要 |
| `CODING_STANDARDS.md` | 詳細程式碼規範 | ⭐⭐⭐⭐ 重要 |
| `README.md` | 專案背景 | ⭐⭐⭐ 需要了解 |

---

## 🎯 不同角色的閱讀建議

### 專案負責人 / PM

**必讀**:
1. ✅ `PROJECT_SUMMARY.md` - 了解專案狀態
2. ✅ `README.md` - 了解技術架構與功能

**選讀**:
- `SOLARSDGS_IOT_PROJECT_STRUCTURE.md` - 了解詳細結構

**不需閱讀**:
- `CLAUDE.md` (給 AI 用)
- `CODING_STANDARDS.md` (技術細節)

---

### 後端開發者

**必讀**:
1. ✅ `PROJECT_SUMMARY.md` - 了解專案全貌
2. ✅ `README.md` - 快速開始
3. ✅ `CLAUDE.md` - **最重要！** 開發指引
4. ✅ `CODING_STANDARDS.md` (JavaScript/TypeScript 部分)

**重點關注**:
- `CLAUDE.md` 中的「從 Node-RED 到 Node.js 的對應關係」
- `CLAUDE.md` 中的「後端 Service 範本」
- `CODING_STANDARDS.md` 中的「JavaScript/TypeScript 規範」

**開發流程**:
```
1. 讀 CLAUDE.md 了解架構
   ↓
2. 查看 Node-RED Function 節點
   ↓
3. 根據範本撰寫 TypeScript code
   ↓
4. 參考 CODING_STANDARDS.md 檢查程式碼風格
   ↓
5. 提交 (使用 Conventional Commits 格式)
```

---

### 前端開發者

**必讀**:
1. ✅ `PROJECT_SUMMARY.md` - 了解專案全貌
2. ✅ `README.md` - 快速開始
3. ✅ `CLAUDE.md` - 開發指引
4. ✅ `CODING_STANDARDS.md` (Vue.js 部分)

**重點關注**:
- `CLAUDE.md` 中的「Vue 組件範本」
- `CLAUDE.md` 中的「Composable 範本」
- `CODING_STANDARDS.md` 中的「Vue.js 規範」
- `CODING_STANDARDS.md` 中的「HTML/CSS 規範」

**開發流程**:
```
1. 讀 CLAUDE.md 了解架構
   ↓
2. 查看 Dashboard 需求
   ↓
3. 根據範本開發 Vue 組件
   ↓
4. 參考 CODING_STANDARDS.md 檢查程式碼風格
   ↓
5. 提交 (使用 Conventional Commits 格式)
```

---

### 韌體開發者 (Pico W)

**必讀**:
1. ✅ `README.md` - 了解整體架構
2. ✅ `CODING_STANDARDS.md` (Python/PEP 8 部分)

**重點關注**:
- MQTT 數據格式規範
- 韌體端的數據解析邏輯
- Python 命名規範

**注意**:
- 韌體部分保持原有 MicroPython 程式碼
- 只需確保 MQTT 數據格式符合後端預期

---

### DevOps / 系統管理員

**必讀**:
1. ✅ `README.md` - 了解部署需求
2. ✅ `PROJECT_SUMMARY.md` (Phase 4 部分)

**重點關注**:
- Docker 配置
- VPS 部署步驟
- 監控與日誌設置

---

## 🔍 常見問題快速查找

### Q: 如何開始開發？
**A**: 閱讀順序：
1. `PROJECT_SUMMARY.md` (了解全貌)
2. `README.md` (快速開始)
3. `CLAUDE.md` (開發指引)

### Q: 程式碼應該怎麼寫？
**A**: 查看 `CLAUDE.md` 中的程式碼範本：
- 後端 Service 範本
- 前端 Composable 範本
- Vue 組件範本

### Q: 變數應該怎麼命名？
**A**: 查看 `CODING_STANDARDS.md`:
- JavaScript: camelCase (變數), PascalCase (類別), UPPER_SNAKE_CASE (常數)
- Python: snake_case (變數), PascalCase (類別), UPPER_SNAKE_CASE (常數)

### Q: Node-RED Function 節點怎麼轉換？
**A**: 查看 `CLAUDE.md` 中的「從 Node-RED 到 Node.js 的對應關係」表格

### Q: Git Commit 訊息怎麼寫？
**A**: 查看 `CODING_STANDARDS.md` 中的「Git 提交規範」:
```
feat(backend): 新增批次插入功率數據 API
fix(frontend): 修復 Dashboard 圖表不更新問題
```

### Q: 應該用什麼技術棧？
**A**: 查看 `README.md` 中的「技術棧」章節：
- 後端: Node.js + TypeScript + Express
- 前端: Vue 3 + TypeScript + Vite
- 資料庫: PostgreSQL 16

### Q: 怎麼設置開發環境？
**A**: 查看 `README.md` 中的「快速開始」章節

### Q: 專案目錄怎麼建立？
**A**: 查看 `SOLARSDGS_IOT_PROJECT_STRUCTURE.md` 中的完整目錄樹

---

## 📖 閱讀建議

### 第一次接觸專案（30 分鐘）

```
1. [5 分鐘] PROJECT_SUMMARY.md - 快速了解專案
2. [10 分鐘] README.md - 了解功能與架構
3. [15 分鐘] CLAUDE.md 前半部分 - 了解開發規範
```

### 開始開發前（1 小時）

```
1. [20 分鐘] CLAUDE.md 完整閱讀 - 了解開發指引
2. [20 分鐘] CODING_STANDARDS.md (相關部分) - 了解程式碼規範
3. [20 分鐘] 瀏覽專案知識庫中的 Node-RED flows
```

### 日常開發時（隨時參考）

```
寫程式碼時 → 參考 CLAUDE.md 中的範本
不確定命名 → 參考 CODING_STANDARDS.md
遇到錯誤 → 參考 CLAUDE.md 中的「常見錯誤」
提交程式碼 → 參考 CODING_STANDARDS.md 中的「Git 規範」
```

---

## 🎯 文檔維護

### 何時更新這些文檔？

**`README.md`**:
- ✅ 新增功能時
- ✅ 技術棧變更時
- ✅ 部署方式變更時

**`CLAUDE.md`**:
- ✅ 發現新的常見錯誤時
- ✅ 新增程式碼範本時
- ✅ 架構調整時

**`CODING_STANDARDS.md`**:
- ✅ 採用新的程式碼規範時
- ✅ 團隊達成新的共識時

**`PROJECT_SUMMARY.md`**:
- ✅ 完成每個 Phase 時
- ✅ 專案狀態重大變更時

---

## ✅ 文檔完整度檢查

- ✅ `PROJECT_SUMMARY.md` - 專案總結 ⭐
- ✅ `README.md` - 專案說明 ⭐
- ✅ `CLAUDE.md` - Claude Code 記憶檔案 ⭐
- ✅ `CODING_STANDARDS.md` - 程式碼規範 ⭐
- ✅ `SOLARSDGS_IOT_PROJECT_STRUCTURE.md` - 完整目錄結構 ⭐
- ✅ `FILE_NAVIGATION.md` - 本檔案（文檔導航）⭐

**狀態**: ✅ 專案架構設計階段文檔 100% 完成

**下一步**: 開始 Phase 1 後端開發，並建立：
- `docs/phases/phase-1-backend.md` - 詳細開發步驟
- `docs/api/` - API 文檔
- `docs/architecture/` - 架構詳細文檔

---

## 🔗 相關資源

### 外部參考
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [PEP 8 – Python 程式碼風格指南](https://peps.python.org/pep-0008/)
- [Vue.js 風格指南](https://vuejs.org/style-guide/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### 專案連結
- VPS: `gray@31.97.71.140`
- Domain: `alwaysbefound.com`
- MQTT Broker: `mqtt.alwaysbefound.com:1883`

---

**最後更新**: 2025-11-12  
**維護者**: SolarSDGs Development Team

---

## 💡 使用提示

### VSCode 中快速搜尋

```
Ctrl/Cmd + P → 輸入檔案名稱
Ctrl/Cmd + F → 在檔案中搜尋關鍵字
Ctrl/Cmd + Shift + F → 在所有檔案中搜尋
```

### 建議的 VSCode 擴充套件

```
- Markdown All in One (閱讀 Markdown)
- Markdown Preview Enhanced (預覽 Markdown)
- Todo Tree (追蹤 TODO)
- Bookmarks (書籤功能)
```

### 快速跳轉

在任何 Markdown 檔案中，點擊連結可以跳轉到對應的章節或檔案。

例如：點擊 [CLAUDE.md](./CLAUDE.md) 會開啟 Claude Code 記憶檔案。

---

**祝開發順利！有任何問題歡迎隨時參考這些文檔。** 🚀

