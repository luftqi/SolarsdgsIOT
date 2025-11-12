# VPS 部署實戰指南

> 📘 從零開始在 Hostinger VPS 上部署 SolarSDGs IoT 專案

**最後更新**: 2025-11-12
**難度**: 中級
**預計時間**: 30-45 分鐘

---

## 📋 前置準備檢查清單

在開始之前，請確保您有：

- [ ] Hostinger VPS 訪問權限
- [ ] VPS 的 SSH 登入資訊（root 密碼或 SSH 金鑰）
- [ ] 本地安裝了 Git（用於 clone 專案）
- [ ] Windows PowerShell 或 SSH 客戶端

### VPS 資訊

| 項目 | 值 |
|------|---|
| **IP 地址** | `72.61.117.219` |
| **主機名稱** | `srv1122961.hstgr.cloud` |
| **使用者** | `root` |
| **系統** | Ubuntu 24.04 LTS |
| **位置** | Malaysia - Kuala Lumpur |

---

## 🚀 方法一：使用自動部署腳本（推薦）

### 步驟 1: 準備本地環境

```powershell
# 在 Windows PowerShell 中執行
cd C:\Users\wg444\solarsdgs-iot

# 確認腳本存在
ls scripts/
```

### 步驟 2: 測試 SSH 連接

```powershell
# 測試是否能連接到 VPS
ssh root@72.61.117.219

# 如果提示輸入密碼，請輸入您的 VPS root 密碼
# 成功連接後，輸入 exit 退出
```

### 步驟 3: 執行自動部署

```powershell
# 運行部署腳本
.\scripts\deploy-to-vps.ps1

# 腳本會：
# 1. 測試 SSH 連接
# 2. 上傳安裝腳本到 VPS
# 3. 自動執行安裝（10-15 分鐘）
# 4. 驗證安裝結果
```

### 步驟 4: 等待安裝完成

安裝過程會自動完成以下任務：

1. ✅ 更新系統套件
2. ✅ 安裝基礎工具（git, curl, wget 等）
3. ✅ 安裝 Node.js 20 LTS
4. ✅ 安裝 Docker & Docker Compose
5. ✅ 安裝 PostgreSQL 16
6. ✅ 安裝 Eclipse Mosquitto MQTT
7. ✅ 配置防火牆規則
8. ✅ 建立專案目錄結構
9. ✅ 安裝 Caddy
10. ✅ 驗證所有安裝

---

## 🔧 方法二：手動部署

### 步驟 1: 上傳安裝腳本

```powershell
# 在 Windows PowerShell 中
cd C:\Users\wg444\solarsdgs-iot

# 上傳腳本到 VPS
scp scripts/install-vps-dependencies.sh root@72.61.117.219:/tmp/
```

### 步驟 2: SSH 連接到 VPS

```bash
# 連接到 VPS
ssh root@72.61.117.219
```

### 步驟 3: 執行安裝腳本

```bash
# 在 VPS 上執行
cd /tmp

# 賦予執行權限
chmod +x install-vps-dependencies.sh

# 執行安裝（需要 root 權限）
sudo bash install-vps-dependencies.sh

# 安裝過程約 10-15 分鐘
# 會顯示彩色進度和詳細日誌
```

### 步驟 4: 驗證安裝

腳本執行完成後，會顯示已安裝的套件和服務狀態。

---

## 📦 安裝後配置

### 1. 配置 PostgreSQL 資料庫

```bash
# 切換到 postgres 使用者
sudo -u postgres psql

# 在 PostgreSQL 提示符中執行：
CREATE DATABASE solarsdgs_iot;
CREATE USER solarsdgs WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;
\q
```

⚠️ **重要**: 請將 `YourSecurePassword123!` 替換成強密碼

### 2. 配置 MQTT Broker

```bash
# 創建 MQTT 使用者密碼
sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs
# 會提示輸入密碼，輸入兩次

# 編輯 Mosquitto 配置
sudo nano /etc/mosquitto/mosquitto.conf
```

在文件末尾添加：

```conf
# 禁止匿名連接
allow_anonymous false

# 密碼文件
password_file /etc/mosquitto/passwd

# MQTT 監聽端口
listener 1883
protocol mqtt

# WebSocket 監聽端口
listener 9001
protocol websockets
```

重啟 Mosquitto：

```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

### 3. 啟用防火牆

```bash
# 檢查防火牆規則
sudo ufw status

# 啟用防火牆
sudo ufw enable

# 確認狀態
sudo ufw status verbose
```

---

## 📤 上傳專案代碼

### 方法 A: 從本地打包上傳

```powershell
# 在 Windows PowerShell 中
cd C:\Users\wg444\solarsdgs-iot

# 打包專案（排除 node_modules 和 .git）
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf solarsdgs-iot.tar.gz .

# 上傳到 VPS
scp solarsdgs-iot.tar.gz root@72.61.117.219:~/

# 清理本地打包文件
del solarsdgs-iot.tar.gz
```

### 在 VPS 上解壓

```bash
# SSH 連接到 VPS
ssh root@72.61.117.219

# 解壓專案
cd ~
tar -xzf solarsdgs-iot.tar.gz -C ~/docker-services/app/

# 驗證
ls -la ~/docker-services/app/

# 清理壓縮包
rm solarsdgs-iot.tar.gz
```

### 方法 B: 從 GitHub Clone

```bash
# SSH 連接到 VPS
ssh root@72.61.117.219

# Clone 專案
git clone https://github.com/luftqi/SolarsdgsIOT.git ~/solarsdgs-iot

# 複製到 Docker 目錄
cp -r ~/solarsdgs-iot/* ~/docker-services/app/
```

---

## 🐳 啟動 Docker 服務

### 1. 配置環境變數

```bash
cd ~/docker-services

# 創建 .env 文件
cat > .env <<EOF
# PostgreSQL
DB_PASSWORD=YourSecurePostgresPassword123!

# MQTT
MQTT_USER=solarsdgs
MQTT_PASSWORD=YourSecureMqttPassword456!

# JWT
JWT_SECRET=YourVeryLongJWTSecretKeyAtLeast32Characters789!

# Hostinger API
HOSTINGER_API_TOKEN=uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2

# 時區
TZ=Asia/Kuala_Lumpur
EOF
```

### 2. 創建 Docker Compose 配置

從專案複製 `docker-compose.yml` 到 `~/docker-services/`

### 3. 啟動服務

```bash
cd ~/docker-services

# 建構映像
docker compose build

# 啟動所有服務
docker compose up -d

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

---

## ✅ 驗證部署

### 1. 檢查服務狀態

```bash
# Docker 容器
docker compose ps

# 系統服務
systemctl status docker
systemctl status postgresql
systemctl status mosquitto

# 查看端口
sudo netstat -tulpn | grep LISTEN
```

### 2. 測試 API

```bash
# 測試後端健康檢查
curl http://localhost:3000/api/health

# 測試 PostgreSQL 連接
docker compose exec postgres pg_isready -U solarsdgs

# 測試 MQTT
mosquitto_sub -h localhost -t test/topic -u solarsdgs -P YourMqttPassword
```

### 3. 測試外部訪問

在瀏覽器中訪問：
- `http://72.61.117.219` - 前端應用
- `http://72.61.117.219:3000/api/health` - API 健康檢查

---

## 🔍 故障排除

### 問題 1: SSH 連接失敗

```bash
# 檢查 VPS 是否在線
ping 72.61.117.219

# 檢查 SSH 服務
ssh -v root@72.61.117.219

# 如果需要重置 SSH known_hosts
ssh-keygen -R 72.61.117.219
```

### 問題 2: Docker 容器無法啟動

```bash
# 查看詳細日誌
docker compose logs [service_name]

# 重新建構
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 問題 3: 無法連接資料庫

```bash
# 檢查 PostgreSQL
sudo systemctl status postgresql

# 測試連接
psql -U solarsdgs -d solarsdgs_iot -h localhost

# 查看日誌
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 問題 4: MQTT 連接失敗

```bash
# 檢查 Mosquitto
sudo systemctl status mosquitto

# 查看配置
cat /etc/mosquitto/mosquitto.conf

# 測試連接
mosquitto_pub -h localhost -t test/topic -m "test" -u solarsdgs -P YourPassword
```

---

## 📊 監控與維護

### 查看資源使用

```bash
# 系統資源
htop

# Docker 資源
docker stats

# 磁碟使用
df -h

# 記憶體使用
free -h
```

### 定期維護

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 清理 Docker
docker system prune -a

# 備份資料庫
docker compose exec postgres pg_dump -U solarsdgs solarsdgs_iot > backup_$(date +%Y%m%d).sql
```

---

## 🎯 完成檢查清單

部署完成後，請確認：

- [ ] 所有依賴項已安裝（Node.js, Docker, PostgreSQL, MQTT）
- [ ] Docker 服務正常運行
- [ ] PostgreSQL 資料庫已創建和配置
- [ ] MQTT Broker 已配置並運行
- [ ] 防火牆已啟用並配置正確
- [ ] 專案代碼已上傳並解壓
- [ ] 環境變數已正確配置
- [ ] Docker Compose 服務已啟動
- [ ] API 健康檢查通過
- [ ] 可以從外部訪問服務

---

## 📚 相關文檔

- [完整環境設置指南](ENVIRONMENT_SETUP.md) - 詳細的部署文檔
- [VPS 快速參考](VPS_QUICK_REFERENCE.md) - 常用命令速查
- [Docker 配置說明](../docker/README.md) - Docker 詳細配置

---

## 🆘 需要幫助？

如果遇到問題：

1. 查看 [故障排除](#故障排除) 章節
2. 檢查服務日誌：`docker compose logs -f`
3. 參考 [完整環境設置指南](ENVIRONMENT_SETUP.md)
4. 在 GitHub 提交 Issue

---

**部署指南版本**: 1.0.0
**最後更新**: 2025-11-12
**預計部署時間**: 30-45 分鐘

祝部署順利！🚀
