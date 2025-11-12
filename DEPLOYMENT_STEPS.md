# SolarSDGs IoT - VPS 部署執行步驟

> 🎯 **目標 VPS**: 72.61.117.219 (srvl122961.hstgr.cloud)
> 🌍 **位置**: Malaysia - Kuala Lumpur
> 💻 **系統**: Ubuntu 24.04 LTS
> 👤 **用戶**: root

---

## 🚀 立即開始部署

### Step 1: 從 Windows 連接到 VPS

打開 **PowerShell** 並執行：

```powershell
# 連接到 VPS
ssh root@72.61.117.219
```

**首次連接會顯示指紋確認，輸入 `yes` 並按 Enter**

如果提示輸入密碼，請輸入您在 Hostinger 面板設置的 root 密碼。

---

### Step 2: 上傳安裝腳本到 VPS

有 **3 種方法**，選擇最方便的一種：

#### 方法 A: 使用 SCP 上傳（推薦）

在 **Windows PowerShell** 中執行：

```powershell
# 切換到專案目錄
cd C:\Users\wg444\solarsdgs-iot

# 上傳腳本到 VPS
scp scripts/setup-vps.sh root@72.61.117.219:/tmp/setup-vps.sh
```

#### 方法 B: 複製貼上（最簡單）

1. 在 Windows 上打開檔案：
   ```powershell
   notepad C:\Users\wg444\solarsdgs-iot\scripts\setup-vps.sh
   ```

2. **Ctrl+A** 全選，**Ctrl+C** 複製

3. SSH 連接到 VPS 後，執行：
   ```bash
   nano /tmp/setup-vps.sh
   ```

4. 在 nano 編輯器中：
   - **右鍵貼上** 或 **Shift+Insert**
   - **Ctrl+X** 退出
   - 按 **Y** 確認保存
   - 按 **Enter** 確認檔案名

#### 方法 C: 使用 curl 下載（如果腳本已上傳到網路）

```bash
# 在 VPS 上執行
curl -o /tmp/setup-vps.sh https://YOUR_SCRIPT_URL
```

---

### Step 3: 執行安裝腳本

在 **VPS SSH 連線中**執行：

```bash
# 賦予執行權限
chmod +x /tmp/setup-vps.sh

# 執行安裝（需要 5-10 分鐘）
sudo /tmp/setup-vps.sh
```

**腳本將自動安裝：**
- ✅ Node.js 20 LTS + npm
- ✅ Docker + Docker Compose
- ✅ PostgreSQL 16
- ✅ MQTT Mosquitto Broker
- ✅ Nginx
- ✅ Git 和其他開發工具

**安裝過程中可能會要求確認，按 `Y` 或 `Enter` 繼續。**

---

### Step 4: 配置 PostgreSQL 資料庫

安裝完成後，在 VPS 上執行：

```bash
# 切換到 postgres 用戶
sudo -u postgres psql
```

在 PostgreSQL 提示符 `postgres=#` 中執行：

```sql
-- 創建資料庫
CREATE DATABASE solarsdgs_iot;

-- 創建用戶（請修改密碼！）
CREATE USER solarsdgs WITH PASSWORD 'Solar@2025#Secure!';

-- 授予權限
GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;

-- 退出
\q
```

**⚠️ 重要：請將 `Solar@2025#Secure!` 替換成您的強密碼！**

---

### Step 5: 配置 MQTT Broker

```bash
# 創建 MQTT 用戶和密碼
sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs
# 會提示輸入密碼兩次，例如: Mqtt@2025#Secure!

# 編輯 Mosquitto 配置
sudo nano /etc/mosquitto/mosquitto.conf
```

在文件**末尾添加**：

```conf
# 禁用匿名連接
allow_anonymous false

# 密碼文件
password_file /etc/mosquitto/passwd

# MQTT 監聽端口
listener 1883
protocol mqtt
```

保存並退出（Ctrl+X, Y, Enter），然後重啟服務：

```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

---

### Step 6: 創建專案目錄並上傳代碼

#### 在 VPS 上創建目錄：

```bash
# 創建專案目錄
sudo mkdir -p /opt/solarsdgs-iot
sudo chown -R root:root /opt/solarsdgs-iot
cd /opt/solarsdgs-iot
```

#### 從 Windows 上傳專案：

**方法 A: 使用 Git（推薦）**

如果您的專案已推送到 GitHub：

```bash
# 在 VPS 上執行
cd /opt/solarsdgs-iot
git clone https://github.com/YOUR_USERNAME/solarsdgs-iot.git .
```

**方法 B: 使用 SCP 上傳**

在 **Windows PowerShell** 中執行：

```powershell
cd C:\Users\wg444\solarsdgs-iot

# 先壓縮專案（排除 node_modules）
# 需要安裝 tar 或使用 WSL
wsl tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf solarsdgs-iot.tar.gz .

# 或使用 PowerShell 內建壓縮（較慢）
Compress-Archive -Path * -DestinationPath solarsdgs-iot.zip -Force

# 上傳到 VPS
scp solarsdgs-iot.tar.gz root@72.61.117.219:/opt/solarsdgs-iot/

# 或
scp solarsdgs-iot.zip root@72.61.117.219:/opt/solarsdgs-iot/
```

在 **VPS** 上解壓：

```bash
cd /opt/solarsdgs-iot

# 如果是 tar.gz
tar -xzf solarsdgs-iot.tar.gz
rm solarsdgs-iot.tar.gz

# 或如果是 zip
unzip solarsdgs-iot.zip
rm solarsdgs-iot.zip
```

---

### Step 7: 配置環境變數

```bash
cd /opt/solarsdgs-iot

# 複製環境變數範例
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 編輯 Backend 環境變數：

```bash
nano backend/.env
```

填入以下內容（**請修改密碼和密鑰！**）：

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarsdgs_iot
DB_USER=solarsdgs
DB_PASSWORD=Solar@2025#Secure!

# MQTT
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=solarsdgs
MQTT_PASSWORD=Mqtt@2025#Secure!

# JWT Secret (至少 32 字元)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_minimum_32_characters

# WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=http://72.61.117.219

# Logging
LOG_LEVEL=info
```

#### 編輯 Frontend 環境變數：

```bash
nano frontend/.env
```

```env
VITE_API_URL=http://72.61.117.219:3000
VITE_WS_URL=http://72.61.117.219:3001
```

---

### Step 8: 安裝專案依賴

```bash
cd /opt/solarsdgs-iot

# 安裝 backend 依賴
cd backend
npm install --production

# 建構 backend
npm run build

# 安裝 frontend 依賴
cd ../frontend
npm install

# 建構 frontend
npm run build

cd ..
```

**這步驟需要 5-10 分鐘，請耐心等待。**

---

### Step 9: 初始化資料庫

```bash
cd /opt/solarsdgs-iot/backend

# 執行資料庫遷移腳本
npm run db:migrate

# （可選）載入測試資料
npm run db:seed
```

---

### Step 10: 使用 PM2 管理後端服務（推薦）

```bash
# 全域安裝 PM2
sudo npm install -g pm2

# 啟動 backend
cd /opt/solarsdgs-iot/backend
pm2 start dist/server.js --name solarsdgs-backend

# 設定開機自動啟動
pm2 startup
pm2 save

# 查看狀態
pm2 status
pm2 logs solarsdgs-backend
```

---

### Step 11: 配置 Nginx 反向代理

```bash
# 停止 Nginx 默認站點
sudo rm /etc/nginx/sites-enabled/default

# 創建新的配置文件
sudo nano /etc/nginx/sites-available/solarsdgs-iot
```

貼上以下配置：

```nginx
# SolarSDGs IoT Nginx Configuration

# Backend API Server
upstream backend_api {
    server localhost:3000;
    keepalive 64;
}

# WebSocket Server
upstream backend_ws {
    server localhost:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name 72.61.117.219 srvl122961.hstgr.cloud;

    # 增加 body size 限制（用於文件上傳）
    client_max_body_size 50M;

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend Static Files
    location / {
        root /opt/solarsdgs-iot/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend_ws;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

啟用配置：

```bash
# 創建符號連結
sudo ln -s /etc/nginx/sites-available/solarsdgs-iot /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

# 如果測試通過，重新載入 Nginx
sudo systemctl reload nginx

# 確認 Nginx 運行
sudo systemctl status nginx
```

---

### Step 12: 配置防火牆

```bash
# 確認 UFW 狀態
sudo ufw status

# 如果顯示 "inactive"，啟用防火牆
sudo ufw enable

# 確認規則已添加（腳本已設置）
sudo ufw status numbered
```

---

### Step 13: 驗證部署

#### 測試後端 API：

```bash
# 健康檢查
curl http://localhost:3000/api/health

# 或從外部
curl http://72.61.117.219/api/health
```

#### 測試前端：

在瀏覽器中打開：

```
http://72.61.117.219
```

#### 查看服務狀態：

```bash
# PM2 管理的服務
pm2 status
pm2 logs solarsdgs-backend --lines 50

# PostgreSQL
sudo systemctl status postgresql

# MQTT
sudo systemctl status mosquitto

# Nginx
sudo systemctl status nginx

# Docker
sudo systemctl status docker
```

---

## ✅ 部署完成檢查清單

- [ ] SSH 成功連接到 VPS
- [ ] 安裝腳本執行完成
- [ ] PostgreSQL 資料庫創建成功
- [ ] MQTT Broker 配置完成
- [ ] 專案代碼上傳成功
- [ ] Backend 依賴安裝完成
- [ ] Frontend 依賴安裝完成
- [ ] 資料庫遷移執行成功
- [ ] Backend 服務啟動（PM2）
- [ ] Nginx 配置完成並運行
- [ ] 可以訪問前端頁面
- [ ] API 健康檢查通過
- [ ] 防火牆已啟用

---

## 🔧 常用維護指令

### PM2 管理

```bash
pm2 list                          # 列出所有服務
pm2 logs solarsdgs-backend        # 查看日誌
pm2 restart solarsdgs-backend     # 重啟服務
pm2 stop solarsdgs-backend        # 停止服務
pm2 delete solarsdgs-backend      # 刪除服務
pm2 monit                         # 監控儀表板
```

### 查看日誌

```bash
# Backend 日誌（PM2）
pm2 logs solarsdgs-backend

# Nginx 日誌
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 日誌
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# MQTT 日誌
sudo journalctl -u mosquitto -f
```

### 資料庫操作

```bash
# 連接資料庫
psql -U solarsdgs -d solarsdgs_iot -h localhost

# 備份資料庫
pg_dump -U solarsdgs -h localhost solarsdgs_iot > backup_$(date +%Y%m%d).sql

# 還原資料庫
psql -U solarsdgs -h localhost solarsdgs_iot < backup_20250112.sql
```

### 更新應用

```bash
# 拉取最新代碼
cd /opt/solarsdgs-iot
git pull

# 重新建構並重啟
cd backend
npm install
npm run build
pm2 restart solarsdgs-backend

cd ../frontend
npm install
npm run build

# 重新載入 Nginx
sudo systemctl reload nginx
```

---

## 🎉 恭喜！

您的 SolarSDGs IoT 系統現在已經成功部署到 Hostinger VPS！

### 訪問應用

- **前端應用**: http://72.61.117.219
- **API 文檔**: http://72.61.117.219/api-docs
- **主機名稱**: http://srvl122961.hstgr.cloud

### 下一步建議

1. **配置 SSL 證書**（Let's Encrypt）
2. **設置自動備份**
3. **配置監控告警**
4. **連接實際 IoT 設備**
5. **配置域名（如果有）**

---

**部署時間**: 預計 30-45 分鐘
**文檔版本**: 1.0.0
**最後更新**: 2025-11-12

