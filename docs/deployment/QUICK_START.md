# Hostinger VPS 快速部署指南

> 從零開始在 Hostinger VPS 上部署 SolarSDGs IoT 專案

---

## 📋 前置準備

### 需要的資訊
- ✅ Hostinger VPS IP 地址
- ✅ SSH 登入帳號（通常是 `root` 或 `ubuntu`）
- ✅ SSH 密碼或金鑰
- ✅ Hostinger API Token: `5tLzVeaSKiVxW8OsEqRThAoWwf4DlYqpEh2JqL9B2c54ead6`

---

## 🚀 部署步驟

### Step 1: 連接到 VPS

**使用 PowerShell (Windows):**

```powershell
# 替換成您的 VPS IP
ssh root@YOUR_VPS_IP

# 或使用 ubuntu 用戶
ssh ubuntu@YOUR_VPS_IP
```

**首次連接會要求確認指紋，輸入 `yes` 並按 Enter**

---

### Step 2: 上傳並執行安裝腳本

**方法 A: 直接下載腳本（推薦）**

在 VPS 上執行：

```bash
# 創建臨時目錄
mkdir -p /tmp/solarsdgs-setup
cd /tmp/solarsdgs-setup

# 如果腳本已上傳到 GitHub
wget https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-vps.sh

# 賦予執行權限
chmod +x setup-vps.sh

# 執行安裝
sudo ./setup-vps.sh
```

**方法 B: 從本地上傳腳本**

在您的 **Windows PowerShell** 中執行：

```powershell
# 切換到專案目錄
cd C:\Users\wg444\solarsdgs-iot

# 使用 SCP 上傳腳本到 VPS
scp scripts/setup-vps.sh root@YOUR_VPS_IP:/tmp/setup-vps.sh

# 然後 SSH 連接到 VPS
ssh root@YOUR_VPS_IP

# 在 VPS 上執行
chmod +x /tmp/setup-vps.sh
sudo /tmp/setup-vps.sh
```

**方法 C: 手動複製貼上**

1. 在 Windows 上打開 [scripts/setup-vps.sh](../../scripts/setup-vps.sh)
2. 複製全部內容
3. 在 VPS 上執行：

```bash
# 創建腳本文件
nano /tmp/setup-vps.sh

# 貼上腳本內容 (Ctrl+Shift+V)
# 保存並退出 (Ctrl+X, Y, Enter)

# 賦予執行權限
chmod +x /tmp/setup-vps.sh

# 執行安裝
sudo /tmp/setup-vps.sh
```

---

### Step 3: 腳本會自動安裝

安裝腳本將自動完成以下操作（約 5-10 分鐘）：

1. ✅ 更新系統套件
2. ✅ 安裝基礎工具（git, curl, wget, build-essential）
3. ✅ 安裝 Node.js 20 LTS
4. ✅ 安裝 Docker & Docker Compose
5. ✅ 安裝 PostgreSQL 16
6. ✅ 安裝 MQTT Mosquitto Broker
7. ✅ 安裝 Nginx
8. ✅ 配置防火牆規則
9. ✅ 創建專案目錄 `/opt/solarsdgs-iot`
10. ✅ 顯示安裝摘要

**安裝完成後會顯示：**

```
==========================================
  安裝完成!
==========================================

已安裝的套件版本:
  • Node.js:     v20.x.x
  • npm:         10.x.x
  • Git:         2.x.x
  • Docker:      24.x.x
  • Compose:     2.x.x
  • PostgreSQL:  16.x
  • Mosquitto:   2.x.x
  • Nginx:       1.x.x

服務狀態:
  • Docker:      運行中
  • PostgreSQL:  運行中
  • Mosquitto:   運行中
  • Nginx:       運行中
```

---

### Step 4: 配置 PostgreSQL 資料庫

```bash
# 切換到 postgres 用戶
sudo -u postgres psql

# 在 PostgreSQL 提示符中執行：
CREATE DATABASE solarsdgs_iot;
CREATE USER solarsdgs WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;
\q
```

**⚠️ 重要：請將 `your_secure_password_here` 替換成強密碼！**

---

### Step 5: 配置 MQTT Broker

```bash
# 創建 MQTT 密碼文件
sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs

# 會提示輸入密碼，輸入兩次

# 編輯 Mosquitto 配置
sudo nano /etc/mosquitto/mosquitto.conf
```

在文件末尾添加：

```conf
# 允許匿名連接（開發環境）
allow_anonymous false

# 密碼文件位置
password_file /etc/mosquitto/passwd

# 監聽端口
listener 1883
protocol mqtt
```

保存並重啟 Mosquitto：

```bash
sudo systemctl restart mosquitto
```

---

### Step 6: 上傳專案代碼

**在 Windows PowerShell 中執行：**

```powershell
# 從本地上傳整個專案到 VPS
cd C:\Users\wg444\solarsdgs-iot

# 壓縮專案（排除 node_modules）
# 需要先在本地安裝 7zip 或使用 tar
tar --exclude='node_modules' --exclude='.git' -czf solarsdgs-iot.tar.gz .

# 上傳到 VPS
scp solarsdgs-iot.tar.gz root@YOUR_VPS_IP:/opt/solarsdgs-iot/

# SSH 連接到 VPS
ssh root@YOUR_VPS_IP

# 解壓縮
cd /opt/solarsdgs-iot
tar -xzf solarsdgs-iot.tar.gz
rm solarsdgs-iot.tar.gz
```

---

### Step 7: 配置環境變數

```bash
cd /opt/solarsdgs-iot

# 複製環境變數範例
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 編輯 backend 環境變數
nano backend/.env
```

**填入以下內容：**

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarsdgs_iot
DB_USER=solarsdgs
DB_PASSWORD=your_secure_password_here

# MQTT
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=solarsdgs
MQTT_PASSWORD=your_mqtt_password_here

# JWT
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# WebSocket
WS_PORT=3001
```

**編輯 frontend 環境變數：**

```bash
nano frontend/.env
```

```env
VITE_API_URL=http://YOUR_VPS_IP:3000
VITE_WS_URL=http://YOUR_VPS_IP:3001
```

---

### Step 8: 安裝專案依賴

```bash
cd /opt/solarsdgs-iot

# 安裝 backend 依賴
cd backend
npm install

# 安裝 frontend 依賴
cd ../frontend
npm install

cd ..
```

---

### Step 9: 初始化資料庫

```bash
cd /opt/solarsdgs-iot/backend

# 執行資料庫遷移
npm run db:migrate

# （可選）載入測試資料
npm run db:seed
```

---

### Step 10: 使用 Docker Compose 啟動（推薦）

```bash
cd /opt/solarsdgs-iot

# 建構 Docker 映像
docker compose -f docker/docker-compose.yml build

# 啟動所有服務
docker compose -f docker/docker-compose.yml up -d

# 查看服務狀態
docker compose -f docker/docker-compose.yml ps

# 查看日誌
docker compose -f docker/docker-compose.yml logs -f
```

---

### Step 11: 配置 Nginx 反向代理

```bash
# 創建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/solarsdgs-iot
```

貼上以下內容：

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

啟用配置：

```bash
# 創建符號連結
sudo ln -s /etc/nginx/sites-available/solarsdgs-iot /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

# 重新載入 Nginx
sudo systemctl reload nginx
```

---

### Step 12: 啟用防火牆

```bash
# 啟用 UFW
sudo ufw enable

# 確認狀態
sudo ufw status
```

---

### Step 13: 設定自動重啟

創建 systemd 服務文件：

```bash
sudo nano /etc/systemd/system/solarsdgs-backend.service
```

貼上：

```ini
[Unit]
Description=SolarSDGs IoT Backend
After=network.target postgresql.service mosquitto.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/solarsdgs-iot/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

啟用服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable solarsdgs-backend
sudo systemctl start solarsdgs-backend
sudo systemctl status solarsdgs-backend
```

---

## ✅ 驗證部署

### 檢查服務狀態

```bash
# 檢查所有服務
systemctl status docker
systemctl status postgresql
systemctl status mosquitto
systemctl status nginx
systemctl status solarsdgs-backend

# 檢查端口監聽
sudo netstat -tulpn | grep LISTEN
```

### 測試 API

```bash
# 測試後端 API
curl http://localhost:3000/api/health

# 測試前端
curl http://localhost:5173
```

### 訪問應用

在瀏覽器中打開：

- **應用首頁**: `http://YOUR_VPS_IP`
- **API 文檔**: `http://YOUR_VPS_IP/api-docs`

---

## 🔧 常見問題排查

### 問題 1: 無法連接到資料庫

```bash
# 檢查 PostgreSQL 狀態
sudo systemctl status postgresql

# 檢查 PostgreSQL 日誌
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# 測試連接
psql -U solarsdgs -d solarsdgs_iot -h localhost
```

### 問題 2: MQTT 連接失敗

```bash
# 檢查 Mosquitto 狀態
sudo systemctl status mosquitto

# 查看日誌
sudo tail -f /var/log/mosquitto/mosquitto.log

# 測試訂閱
mosquitto_sub -h localhost -t test/topic -u solarsdgs -P your_password
```

### 問題 3: Docker 容器無法啟動

```bash
# 查看容器日誌
docker compose -f docker/docker-compose.yml logs backend
docker compose -f docker/docker-compose.yml logs frontend

# 重新建構
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
```

### 問題 4: Nginx 502 Bad Gateway

```bash
# 檢查 Nginx 錯誤日誌
sudo tail -f /var/log/nginx/error.log

# 確認後端服務運行
curl http://localhost:3000/api/health

# 重新載入 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📊 監控與維護

### 查看日誌

```bash
# Backend 日誌
tail -f /opt/solarsdgs-iot/logs/backend.log

# Docker 日誌
docker compose logs -f

# 系統日誌
journalctl -u solarsdgs-backend -f
```

### 資料庫備份

```bash
# 創建備份腳本
nano /opt/solarsdgs-iot/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/solarsdgs-iot/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U solarsdgs solarsdgs_iot > "$BACKUP_DIR/db_backup_$DATE.sql"
# 保留最近 7 天的備份
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

設定定時備份：

```bash
# 編輯 crontab
crontab -e

# 添加每天凌晨 2 點備份
0 2 * * * /opt/solarsdgs-iot/scripts/backup-db.sh
```

---

## 🎉 完成！

您的 SolarSDGs IoT 系統現在已經成功部署到 Hostinger VPS！

### 下一步

1. ✅ 配置 SSL 證書（使用 Let's Encrypt）
2. ✅ 設定監控和告警
3. ✅ 配置 CI/CD 自動部署
4. ✅ 開始連接實際的 IoT 設備

---

**部署文檔版本**: 1.0.0
**最後更新**: 2025-11-12
**預計部署時間**: 30-45 分鐘
