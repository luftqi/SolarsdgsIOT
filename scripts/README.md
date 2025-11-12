# SolarSDGs IoT - 部署腳本說明

> 🚀 自動化部署工具集

---

## 📦 腳本清單

### 1. `connect-and-install.ps1` ⭐ 推薦

**交互式 VPS 連接與安裝腳本**

- 適合：首次部署、需要輸入密碼的情況
- 功能：引導式安裝，會提示輸入 SSH 密碼
- 執行時間：10-15 分鐘

**使用方法**:

```powershell
# 在專案根目錄執行
.\scripts\connect-and-install.ps1
```

**執行流程**:
1. 顯示歡迎訊息和確認
2. 上傳安裝腳本（會提示輸入密碼）
3. 自動執行安裝（會再次提示密碼）
4. 驗證安裝結果
5. 顯示後續步驟

---

### 2. `deploy-to-vps.ps1`

**完整自動部署腳本**

- 適合：已設置 SSH 金鑰的情況
- 功能：完全自動化，無需手動輸入密碼
- 執行時間：10-15 分鐘

**使用方法**:

```powershell
# 完整部署
.\scripts\deploy-to-vps.ps1

# 只上傳腳本
.\scripts\deploy-to-vps.ps1 -SkipInstall

# 只執行安裝
.\scripts\deploy-to-vps.ps1 -SkipUpload

# 顯示幫助
.\scripts\deploy-to-vps.ps1 -Help
```

---

### 3. `install-vps-dependencies.sh`

**VPS 依賴安裝腳本（在 VPS 上執行）**

- 適合：手動部署
- 功能：安裝所有必要的依賴項
- 執行時間：10-15 分鐘

**使用方法**:

```bash
# 1. 先上傳到 VPS
scp scripts/install-vps-dependencies.sh root@72.61.117.219:/tmp/

# 2. SSH 連接到 VPS
ssh root@72.61.117.219

# 3. 執行安裝
sudo bash /tmp/install-vps-dependencies.sh
```

**安裝內容**:
- ✅ 系統更新
- ✅ 基礎工具（git, curl, wget, vim）
- ✅ Node.js 20 LTS
- ✅ Docker & Docker Compose
- ✅ PostgreSQL 16
- ✅ Eclipse Mosquitto MQTT
- ✅ Caddy（反向代理）
- ✅ 防火牆配置
- ✅ 專案目錄建立

---

### 4. `setup-vps.sh`

**舊版設置腳本（已被 install-vps-dependencies.sh 取代）**

---

### 5. `test-mcp.js`

**MCP 連接測試腳本**

測試 Hostinger API 連接。

```bash
node scripts/test-mcp.js
```

---

## 🎯 快速開始指南

### 情境 A: 首次部署（需要密碼）

```powershell
# 1. 打開 PowerShell
cd C:\Users\wg444\solarsdgs-iot

# 2. 執行交互式腳本
.\scripts\connect-and-install.ps1

# 3. 按照提示操作
# - 確認繼續安裝
# - 輸入 SSH 密碼（上傳腳本時）
# - 再次輸入密碼（執行安裝時）
# - 等待安裝完成（10-15 分鐘）
```

### 情境 B: 已設置 SSH 金鑰

```powershell
# 1. 執行自動部署
.\scripts\deploy-to-vps.ps1

# 2. 腳本會自動完成所有步驟
```

### 情境 C: 手動部署

```powershell
# 1. 上傳腳本
scp scripts/install-vps-dependencies.sh root@72.61.117.219:/tmp/

# 2. 連接 VPS
ssh root@72.61.117.219

# 3. 執行安裝
sudo bash /tmp/install-vps-dependencies.sh
```

---

## 📋 部署步驟概覽

### 階段 1: VPS 準備（使用腳本）
- 更新系統
- 安裝依賴
- 配置服務
- 建立目錄

### 階段 2: 資料庫配置（手動）

```bash
# SSH 連接到 VPS
ssh root@72.61.117.219

# 配置 PostgreSQL
sudo -u postgres psql
CREATE DATABASE solarsdgs_iot;
CREATE USER solarsdgs WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;
\q
```

### 階段 3: MQTT 配置（手動）

```bash
# 創建 MQTT 使用者
sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs

# 配置 Mosquitto
sudo nano /etc/mosquitto/mosquitto.conf
```

### 階段 4: 上傳專案代碼

```powershell
# 在本地打包
tar --exclude='node_modules' --exclude='.git' -czf project.tar.gz .

# 上傳
scp project.tar.gz root@72.61.117.219:~/docker-services/app/
```

### 階段 5: 啟動服務

```bash
# 在 VPS 上
cd ~/docker-services
docker compose up -d
```

---

## ⚠️ 常見問題

### Q1: 執行腳本時提示「無法執行腳本」

**解決方法**:

```powershell
# 設置執行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然後重新執行腳本
.\scripts\connect-and-install.ps1
```

### Q2: SSH 連接失敗

**檢查事項**:
- VPS IP 是否正確（72.61.117.219）
- 網路連接是否正常
- SSH 密碼是否正確
- VPS 是否在線

**測試連接**:

```powershell
ssh root@72.61.117.219
```

### Q3: 安裝過程中斷

**解決方法**:

```bash
# SSH 連接到 VPS
ssh root@72.61.117.219

# 重新執行安裝腳本
sudo bash /tmp/install-vps-dependencies.sh
```

### Q4: 如何查看安裝進度

安裝腳本會顯示彩色的進度訊息：
- 🔵 [INFO] - 信息
- 🟢 [SUCCESS] - 成功
- 🟡 [WARNING] - 警告
- 🔴 [ERROR] - 錯誤

---

## 📚 相關文檔

- [VPS 實戰部署指南](../docs/VPS_DEPLOYMENT_GUIDE.md) - 完整部署流程
- [環境設置指南](../docs/ENVIRONMENT_SETUP.md) - 詳細配置說明
- [VPS 快速參考](../docs/VPS_QUICK_REFERENCE.md) - 常用命令

---

## 🆘 需要幫助？

如果遇到問題：

1. 查看腳本輸出的錯誤訊息
2. 檢查 [常見問題](#常見問題)
3. 參考 [VPS 實戰部署指南](../docs/VPS_DEPLOYMENT_GUIDE.md)
4. 在 GitHub 提交 Issue

---

**文檔版本**: 1.0.0
**最後更新**: 2025-11-12
