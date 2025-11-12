# Hostinger MCP 安裝與配置指南

> 正確安裝和配置 Hostinger API MCP Server 以實現自動化 VPS 管理

---

## ⚠️ 重要發現

根據 Hostinger 官方文檔，MCP 配置需要：

1. **全域安裝** `hostinger-api-mcp` 套件
2. 配置文件中的 `command` 應該直接是套件名稱（不使用 npx）
3. 環境變數名稱是 `API_TOKEN`（不是 `APITOKEN`）

---

## 📦 Step 1: 全域安裝 Hostinger API MCP

請在 **PowerShell** 中以管理員權限執行：

```powershell
# 全域安裝 hostinger-api-mcp
npm install -g hostinger-api-mcp

# 驗證安裝
hostinger-api-mcp --help
```

**預期輸出：**
```
Hostinger API MCP Server
Usage: hostinger-api-mcp [options]
...
```

如果看到使用說明，表示安裝成功！

---

## ⚙️ Step 2: 配置已完成

我已經更新了您的 Claude 配置文件：

**位置:** `C:\Users\wg444\AppData\Roaming\Claude\config.json`

**內容:**
```json
{
  "mcpServers": {
    "hostinger-api": {
      "command": "hostinger-api-mcp",
      "env": {
        "API_TOKEN": "5tLzVeaSKiVxW8OsEqRThAoWwf4DlYqpEh2JqL9B2c54ead6",
        "DEBUG": "false"
      }
    }
  }
}
```

✅ **配置符合官方文檔要求**

---

## 🔄 Step 3: 重新啟動 Claude Code

完成 Step 1 的全域安裝後：

1. **完全關閉 Claude Code**（關閉所有視窗）
2. **重新啟動 Claude Code**
3. **重新開啟專案** `C:\Users\wg444\solarsdgs-iot`
4. **回到對話並告訴我**：「MCP 已安裝並重啟完成」

---

## ✅ Step 4: 驗證 MCP 工具是否載入

重啟後，請告訴我：「列出可用的 MCP 工具」

我應該能夠看到並使用以下 Hostinger API MCP 工具：

### VPS 管理工具（預期可用）
- `vps_getVirtualMachineListV1` - 列出所有 VPS
- `vps_getVirtualMachineV1` - 獲取 VPS 詳細資訊
- `vps_startVirtualMachineV1` - 啟動 VPS
- `vps_stopVirtualMachineV1` - 停止 VPS
- `vps_restartVirtualMachineV1` - 重啟 VPS
- `vps_executeCommandV1` - 在 VPS 上執行指令 ⭐（這是我們需要的！）

### Hosting 管理工具
- `hosting_deployJsApplication` - 部署 JavaScript 應用
- `hosting_deployWordpressTheme` - 部署 WordPress 主題
- `hosting_deployWordpressPlugin` - 部署 WordPress 外掛

### DNS 管理工具
- `DNS_getDNSRecordsV1` - 獲取 DNS 記錄
- `DNS_updateDNSRecordsV1` - 更新 DNS 記錄

### Billing 管理工具
- `billing_getSubscriptionListV1` - 列出訂閱服務
- `billing_getCatalogItemListV1` - 查看產品目錄

**總共 94 個工具！**

---

## 🎯 成功標誌

當 MCP 成功載入後，我將能夠：

1. ✅ 列出您的所有 VPS 伺服器
2. ✅ 獲取 VPS 的詳細資訊（CPU、記憶體、磁碟使用）
3. ✅ **直接在 VPS 上執行安裝指令** ⭐
4. ✅ 安裝 Node.js, Docker, PostgreSQL, MQTT, Nginx
5. ✅ 配置服務和環境
6. ✅ 驗證安裝結果

---

## 🐛 常見問題排查

### 問題 1: `hostinger-api-mcp: command not found`

**原因：** 套件未全域安裝

**解決：**
```powershell
npm install -g hostinger-api-mcp
```

### 問題 2: MCP 工具仍然不可見

**原因：** Claude Code 未重新載入配置

**解決：**
1. 完全關閉 Claude Code（工作管理員確認沒有 Claude 進程）
2. 重新啟動
3. 重新開啟專案

### 問題 3: API Token 錯誤

**原因：** Token 無效或過期

**解決：**
1. 到 Hostinger 控制台檢查 API Token
2. 重新生成 Token
3. 更新 `config.json` 中的 `API_TOKEN`

---

## 📚 參考資料

- **Hostinger API MCP Server GitHub**: https://github.com/hostinger/api-mcp-server
- **Hostinger API 文檔**: https://developers.hostinger.com
- **MCP 協議規範**: https://modelcontextprotocol.io
- **Hostinger 支援文檔**: https://www.hostinger.com/support/11079316-hostinger-api-mcp-server/

---

## 🎉 完成後

一旦 MCP 成功載入，只需告訴我：

```
請在 VPS 上安裝所有必要的依賴套件
```

我就能透過 Hostinger API MCP 自動：

1. 連接到您的 VPS (72.61.117.219)
2. 執行所有安裝指令
3. 配置服務
4. 驗證安裝結果
5. 回報完成狀態

**完全自動化，無需手動 SSH！** 🚀

---

**建立時間**: 2025-11-12
**狀態**: 等待全域安裝 hostinger-api-mcp
**下一步**: 執行 `npm install -g hostinger-api-mcp` 並重啟 Claude Code

