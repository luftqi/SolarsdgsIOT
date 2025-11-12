# SolarSDGs IoT - VPS 快速參考卡片

> 🚀 一頁搞定所有關鍵資訊

---

## 🖥️ VPS 登入資訊

```bash
# SSH 連接
ssh root@72.61.117.219

# 或使用主機名稱
ssh root@srv1122961.hstgr.cloud
```

| 項目 | 值 |
|------|---|
| **IP 地址** | `72.61.117.219` |
| **主機名稱** | `srv1122961.hstgr.cloud` |
| **作業系統** | Ubuntu 24.04 LTS |
| **位置** | Malaysia - Kuala Lumpur |
| **使用者** | `root` |

---

## 🌐 域名與 DNS

| 域名 | 類型 | 指向 |
|------|------|------|
| `solarsdgs.online` | A | `72.61.117.219` |
| `www.solarsdgs.online` | CNAME | `solarsdgs.online` |
| `api.solarsdgs.online` | A | `72.61.117.219` |
| `admin.solarsdgs.online` | A | `72.61.117.219` |
| `mqtt.solarsdgs.online` | A | `72.61.117.219` |

---

## 🔑 API Token

```
uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2
```

**測試命令**:
```bash
curl -X GET "https://developers.hostinger.com/api/vps/v1/virtual-machines" \
  -H "Authorization: Bearer uE4CVzxwyQ7kjtiwBBRHvUXek7rcWFQaXtPQVPLgac572da2"
```

---

## 📁 專案目錄結構

```
~/docker-services/
├── caddy/
│   ├── Caddyfile
│   ├── config/
│   └── data/
├── app/
│   ├── backend/
│   └── frontend/
├── postgres/data/
├── mqtt/
│   ├── config/mosquitto.conf
│   ├── data/
│   └── log/
├── nodered/data/
└── docker-compose.yml
```

---

## 🐳 Docker 常用命令

```bash
# 進入專案目錄
cd ~/docker-services

# 啟動所有服務
docker compose up -d

# 停止所有服務
docker compose down

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f [service_name]

# 重啟服務
docker compose restart [service_name]

# 重新建構
docker compose up -d --build
```

---

## 🔧 服務端口

| 服務 | 內部端口 | 外部端口 | 說明 |
|------|----------|----------|------|
| Caddy | 80, 443 | 80, 443 | 反向代理 + HTTPS |
| Backend | 3000, 3001 | - | API + WebSocket |
| Frontend | 5173 | - | Vue.js 開發伺服器 |
| PostgreSQL | 5432 | 5432 | 資料庫 |
| MQTT | 1883, 9001 | 1883, 9001 | MQTT + WebSocket |
| Node-RED | 1880 | - | 工作流引擎 |

---

## 🔥 常見操作

### 查看服務狀態
```bash
docker compose ps
docker stats
```

### 查看日誌
```bash
docker compose logs -f backend
docker compose logs -f caddy
```

### 重啟服務
```bash
docker compose restart backend
docker compose restart caddy
```

### 進入容器
```bash
docker compose exec backend sh
docker compose exec postgres psql -U solarsdgs
```

### 備份資料庫
```bash
docker compose exec postgres pg_dump -U solarsdgs solarsdgs_iot > backup.sql
```

### 還原資料庫
```bash
cat backup.sql | docker compose exec -T postgres psql -U solarsdgs solarsdgs_iot
```

---

## 🛠️ 故障排除

### 容器無法啟動
```bash
docker compose logs [service_name]
docker compose up [service_name]
```

### 清理 Docker 資源
```bash
docker system prune -a
docker volume prune
```

### 檢查磁碟空間
```bash
df -h
du -sh ~/docker-services/*
```

### 檢查記憶體使用
```bash
free -h
docker stats --no-stream
```

---

## 📊 監控命令

```bash
# 系統資源
htop

# 網絡連接
netstat -tulpn | grep LISTEN

# 磁碟 I/O
iotop

# Docker 資源
docker stats

# 防火牆狀態
sudo ufw status
```

---

## 🔐 安全設置

### 防火牆規則
```bash
sudo ufw status
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 1883/tcp   # MQTT
```

### 修改密碼
```bash
# PostgreSQL
docker compose exec postgres psql -U solarsdgs
ALTER USER solarsdgs WITH PASSWORD 'new_password';

# MQTT
docker compose exec mqtt mosquitto_passwd /mosquitto/config/passwd solarsdgs
```

---

## 📝 環境變數檔案

**位置**: `~/docker-services/.env`

```env
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

## 🌐 訪問連結

- **主網站**: https://solarsdgs.online
- **API**: https://api.solarsdgs.online
- **管理介面**: https://admin.solarsdgs.online
- **MQTT WebSocket**: wss://mqtt.solarsdgs.online

---

## 📞 緊急指令

### 完全重啟所有服務
```bash
cd ~/docker-services
docker compose down
docker compose up -d
```

### 查看所有日誌
```bash
docker compose logs -f
```

### 快速備份
```bash
cd ~
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz docker-services/
```

---

## 📚 完整文檔

詳細設置和故障排除請參考:
- [完整環境設置指南](ENVIRONMENT_SETUP.md)
- [快速開始指南](deployment/QUICK_START.md)
- [MCP 設置](MCP_SETUP.md)

---

**最後更新**: 2025-11-12
**版本**: 1.0.0

💡 **提示**: 將此頁面加入書籤以便快速查找！
