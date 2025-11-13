# SolarSDGs IoT - Docker 部署指南

> 完整的 Docker Compose 部署流程與故障排除

**最後更新**: 2025-11-13
**適用環境**: VPS (Ubuntu 24.04 LTS) | Docker 24+ | Docker Compose 2.20+

---

## 📋 目錄

1. [部署前檢查](#部署前檢查)
2. [快速部署](#快速部署)
3. [詳細配置說明](#詳細配置說明)
4. [DNS 設定](#dns-設定)
5. [服務管理](#服務管理)
6. [故障排除](#故障排除)
7. [安全加固](#安全加固)
8. [備份與恢復](#備份與恢復)

---

## 部署前檢查

### 1. VPS 資訊確認

```bash
# VPS 資訊
IP: 72.61.117.219
Hostname: srv1122961.hstgr.cloud
OS: Ubuntu 24.04 LTS
RAM: 建議 4GB+
Disk: 建議 40GB+
```

### 2. 安裝 Docker

```bash
# SSH 連接 VPS
ssh root@72.61.117.219

# 安裝 Docker (如果尚未安裝)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 檢查版本
docker --version  # 應為 24.0+
docker compose version  # 應為 2.20+

# 啟動 Docker 服務
systemctl enable docker
systemctl start docker
```

### 3. 防火牆設置

```bash
# 開放必要端口
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw allow 1883/tcp   # MQTT
ufw allow 9001/tcp   # MQTT WebSocket
ufw enable
```

---

## 快速部署

### Step 1: 上傳專案到 VPS

**方法 A: 使用 Git Clone**

```bash
# 在 VPS 上執行
cd /root
git clone <your-repository-url> solarsdgs-iot
cd solarsdgs-iot
```

**方法 B: 使用 SCP 上傳**

```bash
# 在本地電腦執行
scp -r ./solarsdgs-iot root@72.61.117.219:/root/
```

### Step 2: 配置環境變數

```bash
cd /root/solarsdgs-iot/docker
cp .env.example .env

# 編輯 .env 文件
nano .env
```

**重要**: 請修改以下欄位：

```env
# 修改資料庫密碼
DB_PASSWORD=<your-secure-password>

# 確認域名設定
DOMAIN=solarsdgs.online
VITE_API_BASE_URL=https://api.solarsdgs.online
VITE_WS_URL=wss://api.solarsdgs.online

# 修改 Caddy Email (Let's Encrypt 通知)
CADDY_EMAIL=<your-email>
```

### Step 3: 啟動所有服務

```bash
cd /root/solarsdgs-iot/docker

# 構建並啟動所有容器
docker compose up -d --build

# 查看啟動日誌
docker compose logs -f
```

### Step 4: 驗證服務狀態

```bash
# 檢查所有容器狀態
docker compose ps

# 應該看到 5 個容器正在運行:
# - solarsdgs-caddy (healthy)
# - solarsdgs-frontend (healthy)
# - solarsdgs-backend (healthy)
# - solarsdgs-postgres (healthy)
# - solarsdgs-mqtt (healthy)

# 檢查 Caddy HTTPS 憑證
docker compose exec caddy caddy list-certificates
```

### Step 5: 訪問應用

- **Frontend Dashboard**: https://solarsdgs.online
- **Backend API**: https://api.solarsdgs.online/api/health
- **MQTT WebSocket**: wss://mqtt.solarsdgs.online

---

## 詳細配置說明

### Docker Compose 服務說明

#### 1. Caddy (Reverse Proxy)

**功能**:
- 自動 HTTPS (Let's Encrypt)
- 反向代理到 Frontend, Backend, MQTT
- 處理 WebSocket 連接升級

**配置文件**: `docker/caddy/Caddyfile`

**端口映射**:
- 80 → 80 (HTTP)
- 443 → 443 (HTTPS)

**重要設定**:
```caddyfile
{
  email <your-email>  # Let's Encrypt 通知 email
}
```

#### 2. PostgreSQL (資料庫)

**功能**:
- 儲存功率數據、GPS 數據、設備配置
- 使用 PostgreSQL 16 Alpine 版本

**配置文件**: `docker/postgres/init.sql`

**端口映射**:
- 5432 → 5432

**數據持久化**: Volume `solarsdgs-postgres-data`

**默認資料庫**:
- Database: `solar_db`
- User: `admin`
- Password: 從 `.env` 讀取

#### 3. Mosquitto (MQTT Broker)

**功能**:
- MQTT 消息代理
- 接收 IoT 設備數據
- 提供 WebSocket 接口

**配置文件**: `docker/mqtt/mosquitto.conf`

**端口映射**:
- 1883 → 1883 (MQTT TCP)
- 9001 → 9001 (MQTT WebSocket)

**數據持久化**: Volumes `mqtt_data`, `mqtt_logs`

#### 4. Backend (Node.js API)

**功能**:
- Express REST API
- Socket.io WebSocket 服務
- MQTT 數據處理
- 資料庫操作

**Dockerfile**: `docker/backend/Dockerfile`

**端口映射**:
- 3000 → 3000

**健康檢查**: `http://localhost:3000/api/health`

**環境變數**:
```env
NODE_ENV=production
DB_HOST=postgres
MQTT_BROKER_URL=mqtt://mqtt:1883
```

#### 5. Frontend (Vue 3 PWA)

**功能**:
- Vue 3 Dashboard
- 即時數據可視化
- PWA 離線支援

**Dockerfile**: `docker/frontend/Dockerfile` (多階段構建)

**構建階段**:
1. Node.js 構建 Vue 應用
2. Caddy 伺服靜態檔案

**環境變數**:
```env
VITE_API_BASE_URL=https://api.solarsdgs.online
VITE_WS_URL=wss://api.solarsdgs.online
```

---

## DNS 設定

### Hostinger DNS 設定步驟

1. 登入 Hostinger Panel
2. 選擇 Domain → DNS/Nameservers
3. 添加以下 A Records:

```
Type  Name       Content            TTL
A     @          72.61.117.219      3600
A     www        72.61.117.219      3600
A     api        72.61.117.219      3600
A     mqtt       72.61.117.219      3600
```

**驗證 DNS 生效**:

```bash
# 檢查 DNS 解析
dig solarsdgs.online
dig api.solarsdgs.online
dig mqtt.solarsdgs.online

# 或使用 nslookup
nslookup solarsdgs.online
```

DNS 生效時間: 通常 10-30 分鐘，最長 48 小時

---

## 服務管理

### 啟動/停止/重啟

```bash
cd /root/solarsdgs-iot/docker

# 啟動所有服務
docker compose up -d

# 停止所有服務
docker compose down

# 重啟所有服務
docker compose restart

# 重啟特定服務
docker compose restart backend
docker compose restart frontend
```

### 查看日誌

```bash
# 查看所有服務日誌 (實時)
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f backend
docker compose logs -f caddy

# 查看最近 100 行日誌
docker compose logs --tail=100 backend

# 不跟隨模式 (查看後退出)
docker compose logs backend
```

### 更新服務

```bash
cd /root/solarsdgs-iot/docker

# 拉取最新程式碼
git pull

# 重新構建並啟動 (僅受影響的容器)
docker compose up -d --build

# 強制重建所有容器
docker compose build --no-cache
docker compose up -d
```

### 擴展服務

```bash
# 擴展 Backend 服務到 3 個實例 (負載均衡)
docker compose up -d --scale backend=3

# 注意: 需要 Caddy 配置支援負載均衡
```

---

## 故障排除

### 問題 1: Caddy 無法獲取 SSL 憑證

**症狀**: 訪問 `https://solarsdgs.online` 顯示憑證錯誤

**原因**:
- DNS 尚未生效
- 防火牆阻擋 80/443 端口
- Email 設定錯誤

**解決方案**:

```bash
# 1. 檢查 DNS
dig solarsdgs.online  # 應該返回 72.61.117.219

# 2. 檢查防火牆
ufw status  # 確保 80, 443 開放

# 3. 檢查 Caddy 日誌
docker compose logs caddy | grep -i "error\|fail"

# 4. 手動觸發憑證申請
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 問題 2: Backend 無法連接 PostgreSQL

**症狀**: Backend 日誌顯示資料庫連接錯誤

**原因**:
- PostgreSQL 容器未啟動
- 密碼錯誤
- 資料庫未初始化

**解決方案**:

```bash
# 1. 檢查 PostgreSQL 容器狀態
docker compose ps postgres

# 2. 檢查 PostgreSQL 日誌
docker compose logs postgres

# 3. 測試資料庫連接
docker compose exec postgres psql -U admin -d solar_db -c "SELECT version();"

# 4. 重新初始化資料庫
docker compose down postgres
docker volume rm solarsdgs-postgres-data
docker compose up -d postgres
```

### 問題 3: MQTT 連接失敗

**症狀**: IoT 設備無法發送數據到 MQTT

**原因**:
- Mosquitto 容器未啟動
- 端口未開放
- 配置文件錯誤

**解決方案**:

```bash
# 1. 檢查 MQTT 容器狀態
docker compose ps mqtt

# 2. 測試 MQTT 連接
docker compose exec mqtt mosquitto_sub -t "test" -v

# 在另一個終端:
docker compose exec mqtt mosquitto_pub -t "test" -m "hello"

# 3. 檢查端口開放
netstat -tlnp | grep 1883
netstat -tlnp | grep 9001

# 4. 重啟 MQTT 服務
docker compose restart mqtt
```

### 問題 4: Frontend 顯示 API 連接錯誤

**症狀**: Dashboard 顯示 "API Unavailable"

**原因**:
- Backend 未啟動
- CORS 配置錯誤
- 環境變數設定錯誤

**解決方案**:

```bash
# 1. 檢查 Backend 健康狀態
curl -I https://api.solarsdgs.online/api/health

# 2. 檢查 Backend 日誌
docker compose logs -f backend

# 3. 重新構建 Frontend (環境變數可能錯誤)
docker compose build --no-cache frontend
docker compose up -d frontend

# 4. 檢查 CORS 設定
docker compose exec backend env | grep CORS
```

### 問題 5: 容器不斷重啟

**症狀**: `docker compose ps` 顯示容器狀態為 "Restarting"

**解決方案**:

```bash
# 1. 查看容器退出原因
docker compose ps -a

# 2. 查看容器日誌
docker compose logs <service-name>

# 3. 檢查資源使用
docker stats

# 4. 檢查磁碟空間
df -h

# 5. 清理 Docker 資源
docker system prune -a
docker volume prune
```

---

## 安全加固

### 1. 更改預設密碼

```bash
# 修改 PostgreSQL 密碼
docker compose exec postgres psql -U admin -d solar_db
# ALTER USER admin WITH PASSWORD 'new-secure-password';

# 更新 .env 文件
nano .env
# DB_PASSWORD=new-secure-password

# 重啟 Backend
docker compose restart backend
```

### 2. 啟用 MQTT 認證

編輯 `docker/mqtt/mosquitto.conf`:

```conf
# 取消註解
password_file /mosquitto/config/password.txt
```

創建密碼文件:

```bash
# 進入 MQTT 容器
docker compose exec mqtt sh

# 創建用戶
mosquitto_passwd -c /mosquitto/config/password.txt mqtt_user

# 重啟 MQTT
docker compose restart mqtt
```

更新 Backend `.env`:

```env
MQTT_BROKER_URL=mqtt://mqtt_user:password@mqtt:1883
```

### 3. 限制資料庫外部訪問

編輯 `docker-compose.yml`，移除 PostgreSQL 的端口映射:

```yaml
# 刪除或註解此行
# ports:
#   - "5432:5432"
```

僅通過 Docker 內部網路訪問資料庫。

### 4. 設定 Fail2Ban

```bash
# 安裝 Fail2Ban
apt-get install fail2ban

# 配置 SSH 保護
nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
systemctl restart fail2ban
```

---

## 備份與恢復

### 備份資料庫

```bash
# 手動備份
docker compose exec postgres pg_dump -U admin solar_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 自動備份腳本 (每日 3AM)
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
cd /root/solarsdgs-iot/docker
docker compose exec -T postgres pg_dump -U admin solar_db > $BACKUP_DIR/solar_db_$(date +%Y%m%d_%H%M%S).sql
# 保留最近 7 天的備份
find $BACKUP_DIR -name "solar_db_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# 添加到 Crontab
crontab -e
# 添加: 0 3 * * * /root/backup-db.sh
```

### 恢復資料庫

```bash
# 停止 Backend (避免寫入衝突)
docker compose stop backend

# 恢復資料庫
cat backup_20251113_030000.sql | docker compose exec -T postgres psql -U admin solar_db

# 重啟 Backend
docker compose start backend
```

### 備份 Docker Volumes

```bash
# 備份 PostgreSQL Volume
docker run --rm \
  -v solarsdgs-postgres-data:/data \
  -v /root/backups:/backup \
  alpine tar czf /backup/postgres-volume-$(date +%Y%m%d).tar.gz -C /data .

# 備份 MQTT Volume
docker run --rm \
  -v solarsdgs-mqtt-data:/data \
  -v /root/backups:/backup \
  alpine tar czf /backup/mqtt-volume-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 效能優化

### 1. PostgreSQL 調優

編輯 `docker-compose.yml`:

```yaml
postgres:
  environment:
    # 調整記憶體設定 (根據 VPS RAM)
    POSTGRES_INITDB_ARGS: "-c shared_buffers=512MB -c effective_cache_size=2GB"
```

### 2. 啟用 Caddy 快取

編輯 `docker/caddy/Caddyfile`:

```caddyfile
# 添加快取設定
@cacheable {
  path *.css *.js *.png *.jpg *.woff *.woff2
}
header @cacheable Cache-Control "public, max-age=31536000, immutable"
```

### 3. 監控資源使用

```bash
# 即時監控
docker stats

# 查看容器資源限制
docker compose config | grep -A 5 "resources"
```

---

## 常用命令速查

```bash
# === 服務管理 ===
docker compose up -d              # 啟動所有服務
docker compose down               # 停止所有服務
docker compose restart            # 重啟所有服務
docker compose ps                 # 查看服務狀態

# === 日誌查看 ===
docker compose logs -f            # 查看所有日誌 (實時)
docker compose logs -f backend    # 查看 Backend 日誌
docker compose logs --tail=100    # 查看最近 100 行

# === 容器操作 ===
docker compose exec backend sh    # 進入 Backend 容器
docker compose exec postgres psql # 進入 PostgreSQL

# === 資源清理 ===
docker system prune -a            # 清理未使用的映像
docker volume prune               # 清理未使用的 Volume

# === 健康檢查 ===
curl https://api.solarsdgs.online/api/health
curl -I https://solarsdgs.online
```

---

## 支援與聯繫

如遇到問題:

1. 查看 [故障排除](#故障排除) 章節
2. 檢查 Docker 日誌: `docker compose logs -f`
3. 查看 VPS 系統日誌: `journalctl -xe`
4. 聯繫技術支援

**版本**: 1.0.0
**最後更新**: 2025-11-13
