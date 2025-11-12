# SolarSDGs IoT - 環境設置指南

> 完整的生產環境設置手冊 | Hostinger VPS + Caddy + Docker 架構

**最後更新**: 2025-11-12
**版本**: 2.0.0

---

## 📋 目錄

- [VPS 資訊](#vps-資訊)
- [DNS 設定](#dns-設定)
- [Hostinger API](#hostinger-api)
- [Docker 環境架構](#docker-環境架構)
- [完整部署流程](#完整部署流程)
- [服務管理](#服務管理)
- [故障排除](#故障排除)

---

## 🖥️ VPS 資訊

### 伺服器規格

| 項目 | 資訊 |
|------|------|
| **主機名稱** | `srv1122961.hstgr.cloud` |
| **IPv4 地址** | `72.61.117.219` |
| **作業系統** | Ubuntu 24.04 LTS |
| **伺服器位置** | Malaysia - Kuala Lumpur |
| **SSH 使用者名稱** | `root` |
| **VPS 方案** | KVM 2 |
| **運行時間** | 39 分鐘（啟動於 2025-11-12） |

### SSH 連接

```bash
# 基本連接
ssh root@72.61.117.219

# 或使用主機名稱
ssh root@srv1122961.hstgr.cloud

# 使用金鑰連接（推薦）
ssh -i ~/.ssh/solarsdgs_key root@72.61.117.219
```

### VPS 控制面板

- **Hostinger VPS ID**: 937047
- **Subscription ID**: Azz7eiUsbMXHVgUI
- **Firewall Group ID**: 105804
- **Data Center ID**: 21

---

## 🌐 DNS 設定

### 當前 DNS 配置

**域名**: `solarsdgs.online`

| 類型 | 名稱 | 優先級 | 內容 | TTL |
|------|------|--------|------|-----|
| **CNAME** | www | 0 | solarsdgs.online | 300 |

### 建議的 DNS 配置

為了完整部署，建議添加以下 DNS 記錄：

```dns
# 主域名 A 記錄
A       @               72.61.117.219       300

# www 子域名（已設置）
CNAME   www             solarsdgs.online    300

# API 子域名
A       api             72.61.117.219       300

# 管理介面子域名
A       admin           72.61.117.219       300

# MQTT WebSocket 子域名
A       mqtt            72.61.117.219       300

# 監控服務子域名（可選）
A       monitor         72.61.117.219       300
```

### 在 Hostinger 控制台設定 DNS

1. 登入 Hostinger 控制台
2. 前往 **Domains** → **solarsdgs.online** → **DNS Records**
3. 點擊 **Add Record**
4. 添加上述建議的記錄

---

## 🔑 Hostinger API

### API Token（已更新）

```
Token: uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2
```

### API 端點測試

```bash
# 測試 VPS 列表
curl -X GET "https://developers.hostinger.com/api/vps/v1/virtual-machines" \
  -H "Authorization: Bearer uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2" \
  -H "Content-Type: application/json"

# 預期回應: 200 OK
# 返回 VPS 列表資訊
```

### MCP 設定檔案

在專案中使用 MCP（Model Context Protocol）:

```json
{
  "inputs": [
    {
      "id": "api_token",
      "type": "promptString",
      "description": "Enter your Hostinger API token (required)"
    }
  ],
  "servers": {
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

---

## 🐳 Docker 環境架構

### 總體架構圖

```
Internet
   ↓
[Caddy] (Port 80/443 - HTTPS/SSL)
   ↓
   ├─→ [Frontend] (Vue.js + Vite)
   ├─→ [Backend API] (Node.js + Express)
   ├─→ [WebSocket] (Socket.io)
   └─→ [Node-RED] (工作流引擎)

Internal Network:
   ├─→ [PostgreSQL] (資料庫)
   ├─→ [MQTT Broker] (Mosquitto)
   └─→ [Redis] (快取 - 可選)
```

### 建議的目錄架構

```bash
# 連接到 VPS
ssh root@72.61.117.219

# 建立主要專案目錄
mkdir -p ~/docker-services
cd ~/docker-services

# 建立各服務的資料目錄
mkdir -p caddy/config caddy/data
mkdir -p nodered/data
mkdir -p mqtt/config mqtt/data mqtt/log
mkdir -p postgres/data

# 建立應用程式目錄
mkdir -p app/backend
mkdir -p app/frontend

# 目錄結構預覽
tree -L 2 ~/docker-services
```

**完整目錄結構**:

```
~/docker-services/
├── caddy/
│   ├── Caddyfile           # Caddy 配置檔案
│   ├── config/             # Caddy 自動配置
│   └── data/               # SSL 證書存放
├── nodered/
│   └── data/               # Node-RED 流程和設定
├── mqtt/
│   ├── config/
│   │   └── mosquitto.conf  # MQTT 配置
│   ├── data/               # MQTT 持久化資料
│   └── log/                # MQTT 日誌
├── postgres/
│   └── data/               # PostgreSQL 資料庫檔案
├── app/
│   ├── backend/            # Node.js 後端程式碼
│   └── frontend/           # Vue.js 前端程式碼
└── docker-compose.yml      # Docker Compose 配置
```

---

## 🚀 完整部署流程

### 階段 1: 系統準備

#### 1.1 連接到 VPS

```bash
# 從 Windows PowerShell
ssh root@72.61.117.219
```

#### 1.2 更新系統

```bash
# 更新套件清單
sudo apt update

# 升級已安裝套件
sudo apt upgrade -y

# 安裝基礎工具
sudo apt install -y git curl wget vim tree net-tools
```

#### 1.3 設定防火牆

```bash
# 安裝 UFW
sudo apt install -y ufw

# 允許 SSH
sudo ufw allow 22/tcp

# 允許 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允許 MQTT（如需外部訪問）
sudo ufw allow 1883/tcp
sudo ufw allow 8883/tcp

# 啟用防火牆
sudo ufw --force enable

# 檢查狀態
sudo ufw status
```

---

### 階段 2: 安裝 Docker

#### 2.1 安裝 Docker Engine

```bash
# 移除舊版本（如有）
sudo apt remove -y docker docker-engine docker.io containerd runc

# 安裝依賴
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker GPG 金鑰
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 儲存庫
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安裝 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 啟動 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 驗證安裝
docker --version
docker compose version
```

#### 2.2 配置 Docker 權限（可選）

```bash
# 將當前使用者加入 docker 群組
sudo usermod -aG docker $USER

# 重新登入以套用變更
exit
ssh root@72.61.117.219
```

---

### 階段 3: 建立目錄架構

```bash
# 建立主要目錄
mkdir -p ~/docker-services
cd ~/docker-services

# 建立子目錄
mkdir -p caddy/config caddy/data
mkdir -p nodered/data
mkdir -p mqtt/config mqtt/data mqtt/log
mkdir -p postgres/data
mkdir -p app/backend app/frontend

# 設定權限
chmod -R 755 ~/docker-services
chown -R $USER:$USER ~/docker-services

# 驗證結構
tree -L 2 ~/docker-services
```

---

### 階段 4: 配置服務檔案

#### 4.1 建立 Caddyfile

```bash
nano ~/docker-services/caddy/Caddyfile
```

**Caddyfile 內容**:

```caddyfile
# SolarSDGs IoT - Caddy 配置
# 自動 HTTPS + 反向代理

# 主域名 - 前端
solarsdgs.online, www.solarsdgs.online {
    # 自動 HTTPS（Let's Encrypt）
    tls {
        protocols tls1.2 tls1.3
    }

    # 前端靜態檔案
    reverse_proxy frontend:5173 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    # Gzip 壓縮
    encode gzip

    # 日誌
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

# API 子域名 - 後端 API
api.solarsdgs.online {
    tls {
        protocols tls1.2 tls1.3
    }

    reverse_proxy backend:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip
}

# MQTT WebSocket
mqtt.solarsdgs.online {
    tls {
        protocols tls1.2 tls1.3
    }

    reverse_proxy mqtt:9001 {
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection {http.request.header.Connection}
    }
}

# 管理介面 - Node-RED
admin.solarsdgs.online {
    tls {
        protocols tls1.2 tls1.3
    }

    # 需要基本認證
    basicauth {
        admin $2a$14$... # 使用 caddy hash-password 生成
    }

    reverse_proxy nodered:1880 {
        header_up Host {host}
        header_up X-Real-IP {remote}
    }

    encode gzip
}
```

#### 4.2 建立 MQTT 配置

```bash
nano ~/docker-services/mqtt/config/mosquitto.conf
```

**mosquitto.conf 內容**:

```conf
# SolarSDGs IoT - Mosquitto MQTT 配置

# 持久化設定
persistence true
persistence_location /mosquitto/data/

# 日誌設定
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type all
log_timestamp true

# 連接設定
max_connections -1
max_queued_messages 1000

# MQTT 端口（內部）
listener 1883
protocol mqtt
allow_anonymous false
password_file /mosquitto/config/passwd

# WebSocket 端口（外部訪問）
listener 9001
protocol websockets
allow_anonymous false
```

#### 4.3 建立 Docker Compose 配置

```bash
nano ~/docker-services/docker-compose.yml
```

**docker-compose.yml 內容**:

```yaml
version: '3.8'

services:
  # Caddy - 反向代理 + HTTPS
  caddy:
    image: caddy:2-alpine
    container_name: solarsdgs-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy/config:/config
      - ./caddy/data:/data
    networks:
      - solarsdgs-network
    depends_on:
      - backend
      - frontend
      - mqtt
      - nodered

  # PostgreSQL - 資料庫
  postgres:
    image: postgres:16-alpine
    container_name: solarsdgs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: solarsdgs_iot
      POSTGRES_USER: solarsdgs
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - ./postgres/data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - solarsdgs-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U solarsdgs"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MQTT Broker - Mosquitto
  mqtt:
    image: eclipse-mosquitto:2
    container_name: solarsdgs-mqtt
    restart: unless-stopped
    ports:
      - "1883:1883"   # MQTT
      - "9001:9001"   # WebSocket
    volumes:
      - ./mqtt/config:/mosquitto/config
      - ./mqtt/data:/mosquitto/data
      - ./mqtt/log:/mosquitto/log
    networks:
      - solarsdgs-network
    healthcheck:
      test: ["CMD-SHELL", "mosquitto_sub -t '$$SYS/#' -C 1 | grep -v Error || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API - Node.js
  backend:
    build:
      context: ./app/backend
      dockerfile: Dockerfile
    container_name: solarsdgs-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: solarsdgs_iot
      DB_USER: solarsdgs
      DB_PASSWORD: ${DB_PASSWORD:-changeme}
      MQTT_BROKER: mqtt://mqtt:1883
      MQTT_USERNAME: ${MQTT_USER:-solarsdgs}
      MQTT_PASSWORD: ${MQTT_PASSWORD:-changeme}
      JWT_SECRET: ${JWT_SECRET}
      WS_PORT: 3001
    volumes:
      - ./app/backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
      - "3001:3001"
    networks:
      - solarsdgs-network
    depends_on:
      postgres:
        condition: service_healthy
      mqtt:
        condition: service_healthy

  # Frontend - Vue.js
  frontend:
    build:
      context: ./app/frontend
      dockerfile: Dockerfile
    container_name: solarsdgs-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: https://api.solarsdgs.online
      VITE_WS_URL: wss://api.solarsdgs.online
      VITE_MQTT_URL: wss://mqtt.solarsdgs.online
    volumes:
      - ./app/frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    networks:
      - solarsdgs-network

  # Node-RED - 工作流引擎
  nodered:
    image: nodered/node-red:latest
    container_name: solarsdgs-nodered
    restart: unless-stopped
    environment:
      TZ: Asia/Kuala_Lumpur
    volumes:
      - ./nodered/data:/data
    ports:
      - "1880:1880"
    networks:
      - solarsdgs-network
    depends_on:
      - postgres
      - mqtt

networks:
  solarsdgs-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

#### 4.4 建立環境變數檔案

```bash
nano ~/docker-services/.env
```

**.env 內容**:

```env
# SolarSDGs IoT - 環境變數配置
# ⚠️ 請修改所有密碼和金鑰！

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
```

---

### 階段 5: 上傳應用程式碼

#### 5.1 從本地上傳（Windows PowerShell）

```powershell
# 在本地專案目錄
cd C:\Users\wg444\solarsdgs-iot

# 壓縮後端程式碼
tar --exclude='node_modules' --exclude='.env' -czf backend.tar.gz backend/

# 壓縮前端程式碼
tar --exclude='node_modules' --exclude='dist' --exclude='.env' -czf frontend.tar.gz frontend/

# 上傳到 VPS
scp backend.tar.gz root@72.61.117.219:~/docker-services/app/
scp frontend.tar.gz root@72.61.117.219:~/docker-services/app/
```

#### 5.2 在 VPS 上解壓

```bash
# 連接到 VPS
ssh root@72.61.117.219

# 解壓後端
cd ~/docker-services/app/
tar -xzf backend.tar.gz
rm backend.tar.gz

# 解壓前端
tar -xzf frontend.tar.gz
rm frontend.tar.gz

# 驗證
ls -la ~/docker-services/app/
```

---

### 階段 6: 建立 Dockerfiles

#### 6.1 後端 Dockerfile

```bash
nano ~/docker-services/app/backend/Dockerfile
```

```dockerfile
# SolarSDGs IoT - Backend Dockerfile
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製程式碼
COPY . .

# 建構 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# 啟動應用
CMD ["npm", "start"]
```

#### 6.2 前端 Dockerfile

```bash
nano ~/docker-services/app/frontend/Dockerfile
```

```dockerfile
# SolarSDGs IoT - Frontend Dockerfile
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製程式碼
COPY . .

# 建構生產版本
RUN npm run build

# 使用 Nginx 提供靜態檔案
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 階段 7: 配置 MQTT 使用者

```bash
# 進入 MQTT 容器（需先啟動 Docker Compose）
cd ~/docker-services

# 建立 MQTT 密碼檔案
docker compose run --rm mqtt mosquitto_passwd -c -b /mosquitto/config/passwd solarsdgs YourMqttPassword456!

# 驗證檔案建立
ls -la mqtt/config/
```

---

### 階段 8: 啟動服務

```bash
cd ~/docker-services

# 建構映像
docker compose build

# 啟動所有服務
docker compose up -d

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f

# 檢查特定服務
docker compose logs -f backend
docker compose logs -f caddy
```

---

### 階段 9: 初始化資料庫

```bash
# 進入 backend 容器
docker compose exec backend sh

# 執行資料庫遷移
npm run db:migrate

# 載入初始資料（可選）
npm run db:seed

# 退出容器
exit
```

---

### 階段 10: 驗證部署

#### 10.1 檢查服務健康狀態

```bash
# 檢查所有容器
docker compose ps

# 檢查 PostgreSQL
docker compose exec postgres pg_isready -U solarsdgs

# 檢查 MQTT
docker compose exec mqtt mosquitto_sub -t '$SYS/#' -C 1

# 檢查 Backend API
curl http://localhost:3000/api/health
```

#### 10.2 測試外部訪問

```bash
# 測試主域名
curl -I https://solarsdgs.online

# 測試 API
curl https://api.solarsdgs.online/api/health

# 測試 SSL 證書
openssl s_client -connect solarsdgs.online:443 -servername solarsdgs.online
```

---

## 🔧 服務管理

### 常用 Docker Compose 命令

```bash
# 進入專案目錄
cd ~/docker-services

# 啟動所有服務
docker compose up -d

# 停止所有服務
docker compose down

# 重新啟動服務
docker compose restart

# 重新建構並啟動
docker compose up -d --build

# 查看日誌
docker compose logs -f [service_name]

# 進入容器 Shell
docker compose exec [service_name] sh

# 查看資源使用
docker stats

# 清理未使用的資源
docker system prune -a
```

### 單獨管理服務

```bash
# 重啟單一服務
docker compose restart backend

# 查看服務日誌
docker compose logs -f backend --tail=100

# 停止服務
docker compose stop backend

# 啟動服務
docker compose start backend

# 重新建構單一服務
docker compose up -d --build backend
```

---

## 🛠️ 故障排除

### 問題 1: 容器無法啟動

```bash
# 檢查容器日誌
docker compose logs [service_name]

# 檢查容器狀態
docker compose ps

# 檢查 Docker 資源
docker stats

# 手動啟動並查看錯誤
docker compose up [service_name]
```

### 問題 2: 無法連接資料庫

```bash
# 檢查 PostgreSQL 容器
docker compose logs postgres

# 測試連接
docker compose exec postgres psql -U solarsdgs -d solarsdgs_iot -c "SELECT 1;"

# 重新建立資料庫（⚠️ 會刪除所有資料）
docker compose down
rm -rf postgres/data/*
docker compose up -d postgres
```

### 問題 3: MQTT 連接失敗

```bash
# 檢查 MQTT 日誌
docker compose logs mqtt

# 測試訂閱
docker compose exec mqtt mosquitto_sub -h localhost -t test/topic -u solarsdgs -P YourPassword

# 測試發布
docker compose exec mqtt mosquitto_pub -h localhost -t test/topic -m "Hello" -u solarsdgs -P YourPassword
```

### 問題 4: Caddy SSL 證書問題

```bash
# 檢查 Caddy 日誌
docker compose logs caddy

# 手動觸發證書獲取
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 檢查證書
docker compose exec caddy caddy list-certificates
```

### 問題 5: 磁碟空間不足

```bash
# 檢查磁碟使用
df -h

# 清理 Docker
docker system prune -a --volumes

# 清理日誌
truncate -s 0 /var/lib/docker/containers/*/*.log
```

---

## 📊 監控與維護

### 查看系統資源

```bash
# 即時監控 Docker 容器
docker stats

# 系統資源使用
htop

# 磁碟使用
df -h

# 記憶體使用
free -h
```

### 定期備份

```bash
# 備份 PostgreSQL
docker compose exec postgres pg_dump -U solarsdgs solarsdgs_iot > backup_$(date +%Y%m%d).sql

# 備份整個資料目錄
tar -czf backup_docker_$(date +%Y%m%d).tar.gz ~/docker-services/

# 上傳到遠端備份（可選）
# rsync -avz backup_*.tar.gz user@backup-server:/backups/
```

---

## 🎉 部署完成！

### 檢查清單

- [ ] VPS 基本設定完成
- [ ] DNS 記錄已配置
- [ ] Docker 環境已安裝
- [ ] 目錄架構已建立
- [ ] 配置檔案已設定
- [ ] 環境變數已配置
- [ ] 應用程式碼已上傳
- [ ] Docker 容器已啟動
- [ ] 資料庫已初始化
- [ ] MQTT 使用者已建立
- [ ] SSL 證書已自動獲取
- [ ] 外部訪問測試成功

### 訪問應用

- **主網站**: https://solarsdgs.online
- **API**: https://api.solarsdgs.online
- **管理介面**: https://admin.solarsdgs.online
- **MQTT WebSocket**: wss://mqtt.solarsdgs.online

### 下一步

1. 配置監控系統（Grafana + Prometheus）
2. 設定自動備份腳本
3. 配置 CI/CD 自動部署
4. 連接實際 IoT 設備
5. 效能優化與壓力測試

---

**文檔版本**: 2.0.0
**維護者**: SolarSDGs Development Team
**預計部署時間**: 45-60 分鐘

