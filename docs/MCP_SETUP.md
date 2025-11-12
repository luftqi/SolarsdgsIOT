# Hostinger MCP 配置完成

> 🎉 Claude Code 現在可以直接透過 Hostinger API 控制你的 VPS!

## ✅ 已完成的配置

### 配置文件位置
```
C:\Users\wg444\AppData\Roaming\Claude\config.json
```

### 添加的配置（已更新 Token）
```json
{
  "mcpServers": {
    "hostinger-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["hostinger-api-mcp@latest"],
      "env": {
        "API_TOKEN": "uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2"
      }
    }
  }
}
```

### ✅ API 測試結果

**狀態**: 連接成功 ✓

測試使用的正確 API 端點:
```
https://developers.hostinger.com/api/vps/v1/virtual-machines
```

**回應**: HTTP 200 OK
- VPS ID: 937047
- Hostname: srv937047.hstgr.cloud → **已更新為 srv1122961.hstgr.cloud**
- Plan: KVM 2
- Location: Malaysia - Kuala Lumpur

---

## 🚀 下一步操作

### 1. 重啟 Claude Code

**重要**: 配置已添加,但需要重啟 Claude Code 才能生效。

請執行以下操作:
1. 完全關閉 Claude Code 應用程式
2. 重新啟動 Claude Code
3. 重新開啟這個專案

### 2. 驗證 MCP 是否啟用

重啟後,我將能夠使用以下 MCP 工具:

- `mcp__hostinger__list_servers` - 列出所有 VPS
- `mcp__hostinger__get_server_info` - 獲取 VPS 詳細資訊
- `mcp__hostinger__execute_command` - 在 VPS 上執行指令
- `mcp__hostinger__deploy_app` - 部署應用程式
- `mcp__hostinger__manage_services` - 管理服務 (nginx, docker 等)
- 其他 Hostinger API 功能...

### 3. 測試連接

重啟後,你可以要求我:
```
請列出我的所有 Hostinger VPS
```

或

```
請獲取我的 VPS 資訊
```

我就能透過 Hostinger API 直接查詢!

---

## 📋 重啟後可以做什麼

一旦 MCP 啟用,我就可以:

### ✅ VPS 管理
- 🖥️ 查看所有 VPS 列表
- 📊 獲取 VPS 狀態和資訊
- 🔄 重啟/停止 VPS
- 📈 查看資源使用情況

### ✅ 應用部署
- 🚀 直接部署 SolarSDGs IoT 專案到 VPS
- 📦 安裝必要的依賴 (Node.js, Docker, PostgreSQL, MQTT)
- ⚙️ 配置環境變數
- 🔧 設置 Nginx 反向代理
- 🔒 配置 SSL 證書

### ✅ 檔案管理
- 📁 上傳/下載檔案
- 📝 編輯配置檔案
- 🗂️ 管理專案目錄

### ✅ 服務管理
- 🐳 啟動/停止 Docker 容器
- 🗄️ 管理資料庫
- 📡 配置 MQTT Broker
- 🌐 管理 Nginx

### ✅ 監控與日誌
- 📊 查看系統資源
- 📜 讀取應用日誌
- 🔍 除錯問題

---

## ⚠️ 安全提醒

### API Token 安全
- ✅ Token 已安全儲存在本地配置文件中
- ✅ 不會上傳到 Git (已在 .gitignore 中)
- ⚠️ 請勿在公開場合分享此 Token
- 🔄 如需撤銷,請到 Hostinger 控制台重新生成

### 建議的安全措施
1. 定期更換 API Token
2. 僅在必要時使用 API 功能
3. 監控 API 使用記錄
4. 為 VPS 設置防火牆規則

---

## 🎯 完成部署的步驟

重啟 Claude Code 後,你只需要告訴我:

```
請幫我在 VPS 上部署 SolarSDGs IoT 專案
```

我就會自動:
1. 連接到你的 Hostinger VPS
2. 安裝所有必要的依賴
3. 設置 Docker 環境
4. 部署應用程式
5. 配置 Nginx
6. 設置自動重啟
7. 驗證部署成功

全程自動化,你不需要手動執行任何 SSH 指令! 🚀

---

## 📞 支援資源

- [Hostinger API 文檔](https://api.hostinger.com/docs)
- [MCP Protocol 說明](https://modelcontextprotocol.io)
- [專案部署文檔](./deployment/)

---

**配置時間**: 2025-11-12
**狀態**: ✅ 配置完成,等待重啟
**下一步**: 重啟 Claude Code

---

重啟後見! 👋
