
Basic VM environment setup
Hostinger VPS Docker 環境完整部署手冊 (最終版)
系統資訊
VPS IP: 31.97.71.140
網域: alwaysbefound.com
使用者: gray (非 root)
作業系統: Ubuntu 24.04 LTS
用途: PWA 應用平台 + Node-RED 開發環境
系統架構說明
alwaysbefound.com          → 主網站（歡迎頁/導航）
app.alwaysbefound.com      → PWA 應用程式
nodered.alwaysbefound.com  → Node-RED 編輯器（開發用）
api.alwaysbefound.com      → REST API 端點
dashboard.alwaysbefound.com → 監控儀表板
mqtt.alwaysbefound.com     → MQTT WebSocket
iot.alwaysbefound.com      → IoT 服務端點

​
第一部分：系統準備與 Docker 安裝
步驟 1.1：連線到 VPS
ssh gray@31.97.71.140

​
步驟 1.2：更新系統
# 更新套件列表
sudo apt update && sudo apt upgrade -y

# 安裝必要工具
sudo apt install -y curl wget nano git net-tools

​
步驟 1.3：安裝 Docker
# 下載並執行 Docker 官方安裝腳本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將 gray 使用者加入 docker 群組
sudo usermod -aG docker gray

# 啟動 Docker 服務
sudo systemctl enable docker
sudo systemctl start docker

# 清理安裝檔案
rm get-docker.sh

# 重新登入以套用群組變更
exit

​
重新連線：
ssh gray@31.97.71.140

# 驗證 Docker 安裝（不需要 sudo）
docker --version
docker ps

​
步驟 1.4：安裝 Docker Compose
# 安裝 Docker Compose Plugin
sudo apt update
sudo apt install -y docker-compose-plugin

# 驗證安裝
docker compose version

​
第二部分：建立專案結構
步驟 2.1：建立目錄架構
# 建立主要專案目錄
mkdir -p ~/docker-services
cd ~/docker-services

# 建立各服務的資料目錄
mkdir -p caddy/config caddy/data
mkdir -p nodered/data
mkdir -p mqtt/config mqtt/data mqtt/log
mkdir -p postgres/data

​
步驟 2.2：設定目錄權限（重要！）
# Node-RED 使用 UID 1000 和 GID 1000
sudo chown -R 1000:1000 ~/docker-services/nodered/data
chmod -R 755 ~/docker-services/nodered/data

# Mosquitto 使用 UID 1883
sudo chown -R 1883:1883 ~/docker-services/mqtt/data ~/docker-services/mqtt/log
chmod -R 755 ~/docker-services/mqtt/data ~/docker-services/mqtt/log

# PostgreSQL 權限
chmod -R 755 ~/docker-services/postgres/data

​
第三部分：建立配置檔案
步驟 3.1：建立 Docker Compose 檔案
cd ~/docker-services
nano docker-compose.yml

​
完整內容：
version: '3.8'

services:
  # Caddy - 反向代理與自動 HTTPS
  caddy:
    image: caddy:latest
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - ./caddy/data:/data
      - ./caddy/config:/config
    networks:
      - docker-network
    environment:
      - DOMAIN=alwaysbefound.com

  # Node-RED - 流程自動化與 PWA 平台
  nodered:
    image: nodered/node-red:latest
    container_name: nodered
    restart: unless-stopped
    environment:
      - TZ=Asia/Taipei
      - NODE_RED_ENABLE_SAFE_MODE=false
      - NODE_RED_ENABLE_PROJECTS=true
    volumes:
      - ./nodered/data:/data
    networks:
      - docker-network
    depends_on:
      - mqtt
      - postgres
    user: "1000:1000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:1880"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Mosquitto MQTT Broker
  mqtt:
    image: eclipse-mosquitto:latest
    container_name: mqtt
    restart: unless-stopped
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mqtt/config:/mosquitto/config
      - ./mqtt/data:/mosquitto/data
      - ./mqtt/log:/mosquitto/log
    networks:
      - docker-network
    user: "1883:1883"

  # PostgreSQL 資料庫
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=admin123
      - POSTGRES_DB=myapp
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - ./postgres/data:/var/lib/postgresql/data
    networks:
      - docker-network
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d myapp"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  docker-network:
    driver: bridge

​
步驟 3.2：建立 Caddyfile
nano ~/docker-services/caddy/Caddyfile

​
完整內容（請更換 email）：
# 全域選項
{
    # 更換為你的 email
    email your-email@example.com

    # 生產環境使用
    # acme_ca https://acme-v02.api.letsencrypt.org/directory

    # 測試環境使用（不會有速率限制）
    # acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}

# 主網域 - 歡迎頁面或導航
alwaysbefound.com, www.alwaysbefound.com {
    # 暫時顯示歡迎訊息
    respond "Welcome to Always Be Found - PWA App: https://app.alwaysbefound.com" 200

    # 未來可改為重導向或靜態網站
    # redir https://app.alwaysbefound.com{uri} permanent
}

# PWA 應用 - 主要應用程式
app.alwaysbefound.com {
    reverse_proxy nodered:1880

    # WebSocket 支援（PWA 即時通訊）
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket nodered:1880

    # PWA 必要標頭
    header {
        # 安全標頭
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: wss:"

        # PWA 支援
        Service-Worker-Allowed /

        # CORS（PWA 需要）
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }

    # Service Worker 不快取
    @sw {
        path /service-worker.js
        path /sw.js
        path /manifest.json
    }
    header @sw Cache-Control "no-cache, no-store, must-revalidate"

    # 靜態資源快取（PWA 效能優化）
    @static {
        path *.css *.js *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
        not path /service-worker.js
        not path /sw.js
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    # 啟用壓縮
    encode gzip

    # 日誌
    log {
        output file /data/app_access.log
        format console
    }
}

# Node-RED 編輯器 - 開發介面
nodered.alwaysbefound.com {
    reverse_proxy nodered:1880

    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket nodered:1880

    # 可選：加入基本認證保護編輯器
    # basicauth {
    #     admin $2a$14$Zkx19XxYLqq...  # 使用 caddy hash-password 生成
    # }

    encode gzip

    log {
        output file /data/nodered_access.log
    }
}

# API 端點 - RESTful API
api.alwaysbefound.com {
    reverse_proxy nodered:1880

    header {
        # API CORS 設定
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE, PATCH"
        Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-API-Key"
        Access-Control-Max-Age "3600"
        Access-Control-Allow-Credentials "true"

        # API 不需要 Frame 保護
        -X-Frame-Options

        # API 版本資訊
        X-API-Version "1.0"
    }

    # API 速率限制（選用）
    # rate_limit {
    #     zone dynamic 100r/m
    # }

    encode gzip

    log {
        output file /data/api_access.log
        format json
    }
}

# Dashboard UI - 監控儀表板
dashboard.alwaysbefound.com {
    reverse_proxy nodered:1880/ui

    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket nodered:1880

    header {
        X-Frame-Options SAMEORIGIN
    }

    encode gzip
}

# MQTT WebSocket - IoT 通訊
mqtt.alwaysbefound.com {
    reverse_proxy mqtt:9001

    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket mqtt:9001

    header {
        Access-Control-Allow-Origin *
    }
}

# IoT 服務端點
iot.alwaysbefound.com {
    reverse_proxy nodered:1880

    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, X-Device-ID"
    }

    encode gzip
}

# VPN 端點（預留）
vpn.alwaysbefound.com {
    respond "VPN Service - Coming Soon" 200
}

​
步驟 3.3：建立 Mosquitto 設定檔
nano ~/docker-services/mqtt/config/mosquitto.conf

​
完整內容：
# Mosquitto 設定檔

# 基本設定
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_type all

# TCP 監聽
listener 1883
protocol mqtt

# WebSocket 監聽
listener 9001
protocol websockets

# 認證設定（開發環境允許匿名）
allow_anonymous true

# 生產環境請啟用以下設定：
# allow_anonymous false
# password_file /mosquitto/config/passwd

# 連線設定
max_keepalive 60
keepalive_interval 30

# 訊息設定
max_queued_messages 1000
max_inflight_messages 20
max_connections -1

# 系統設定
sys_interval 10
autosave_interval 1800

​
步驟 3.4：設定檔案權限
# 設定 Mosquitto 設定檔權限
chmod 644 ~/docker-services/mqtt/config/mosquitto.conf

# 確保所有者正確
sudo chown 1883:1883 ~/docker-services/mqtt/config/mosquitto.conf

​
第四部分：建立管理腳本
步驟 4.1：建立一鍵部署腳本
nano ~/docker-services/deploy.sh

​
完整內容：
#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Docker Services 自動部署腳本 v3.0${NC}"
echo -e "${BLUE}========================================${NC}"

# 檢查是否在正確目錄
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}錯誤：請在 ~/docker-services 目錄執行此腳本${NC}"
    exit 1
fi

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安裝！${NC}"
    echo -e "${YELLOW}請執行以下命令安裝 Docker：${NC}"
    echo "curl -fsSL https://get.docker.com | sh"
    echo "sudo usermod -aG docker $USER"
    exit 1
fi

# 檢查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose 未安裝！${NC}"
    echo -e "${YELLOW}正在安裝...${NC}"
    sudo apt update
    sudo apt install -y docker-compose-plugin
fi

# 建立目錄結構
echo -e "${YELLOW}➤ 建立目錄結構...${NC}"
mkdir -p caddy/{config,data}
mkdir -p nodered/data
mkdir -p mqtt/{config,data,log}
mkdir -p postgres/data

# 設定權限（關鍵步驟）
echo -e "${YELLOW}➤ 設定目錄權限...${NC}"

# Node-RED 權限
echo "  - 設定 Node-RED 權限 (1000:1000)"
sudo chown -R 1000:1000 nodered/data
chmod -R 755 nodered/data

# Mosquitto 權限
echo "  - 設定 Mosquitto 權限 (1883:1883)"
sudo chown -R 1883:1883 mqtt/data mqtt/log
chmod -R 755 mqtt/data mqtt/log

# 檢查設定檔
echo -e "${YELLOW}➤ 檢查設定檔...${NC}"

if [ ! -f "caddy/Caddyfile" ]; then
    echo -e "${RED}  ✗ Caddyfile 不存在${NC}"
    echo -e "${YELLOW}  請建立 caddy/Caddyfile${NC}"
    exit 1
else
    echo -e "${GREEN}  ✓ Caddyfile 存在${NC}"
fi

if [ ! -f "mqtt/config/mosquitto.conf" ]; then
    echo -e "${RED}  ✗ mosquitto.conf 不存在${NC}"
    echo -e "${YELLOW}  請建立 mqtt/config/mosquitto.conf${NC}"
    exit 1
else
    echo -e "${GREEN}  ✓ mosquitto.conf 存在${NC}"
    sudo chown 1883:1883 mqtt/config/mosquitto.conf
    chmod 644 mqtt/config/mosquitto.conf
fi

# 停止現有容器
echo -e "${YELLOW}➤ 停止現有容器...${NC}"
docker compose down

# 拉取最新映像
echo -e "${YELLOW}➤ 拉取最新 Docker 映像...${NC}"
docker compose pull

# 啟動服務
echo -e "${GREEN}➤ 啟動所有服務...${NC}"
docker compose up -d

# 等待服務啟動
echo -e "${YELLOW}➤ 等待服務啟動...${NC}"
sleep 15

# 檢查服務狀態
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   服務狀態檢查${NC}"
echo -e "${BLUE}========================================${NC}"

services=("caddy" "nodered" "mqtt" "postgres")
all_running=true

for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        status=$(docker inspect -f '{{.State.Health.Status}}' $service 2>/dev/null || echo "running")
        if [ "$status" == "healthy" ] || [ "$status" == "running" ]; then
            echo -e "${GREEN}✅ $service - 運行中 ($status)${NC}"
        else
            echo -e "${YELLOW}⚠️  $service - 狀態: $status${NC}"
        fi
    else
        echo -e "${RED}❌ $service - 未運行${NC}"
        all_running=false
    fi
done

# 顯示連線資訊
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   服務訪問資訊${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${GREEN}🌐 網站架構:${NC}"
echo -e "   主網站: ${YELLOW}https://alwaysbefound.com${NC} (歡迎頁)"
echo -e "   PWA 應用: ${YELLOW}https://app.alwaysbefound.com${NC} ⭐"
echo -e "   Node-RED: ${YELLOW}https://nodered.alwaysbefound.com${NC} (編輯器)"
echo ""
echo -e "${GREEN}🔧 API 與服務:${NC}"
echo -e "   REST API: ${YELLOW}https://api.alwaysbefound.com${NC}"
echo -e "   Dashboard: ${YELLOW}https://dashboard.alwaysbefound.com${NC}"
echo -e "   IoT 端點: ${YELLOW}https://iot.alwaysbefound.com${NC}"
echo -e "   MQTT WS: ${YELLOW}wss://mqtt.alwaysbefound.com${NC}"
echo ""
echo -e "${GREEN}🗄️ 資料庫連線:${NC}"
echo -e "   內部主機: ${YELLOW}postgres:5432${NC}"
echo -e "   外部主機: ${YELLOW}31.97.71.140:5432${NC}"
echo -e "   使用者: ${YELLOW}admin${NC}"
echo -e "   密碼: ${YELLOW}admin123${NC}"
echo -e "   資料庫: ${YELLOW}myapp${NC}"
echo ""
echo -e "${GREEN}📡 MQTT 連線:${NC}"
echo -e "   TCP: ${YELLOW}mqtt://31.97.71.140:1883${NC}"
echo -e "   WebSocket: ${YELLOW}wss://mqtt.alwaysbefound.com${NC}"

# 顯示 Docker 狀態
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Docker 容器狀態${NC}"
echo -e "${BLUE}========================================${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

if [ "$all_running" = true ]; then
    echo ""
    echo -e "${GREEN}✅ 部署完成！所有服務正常運行。${NC}"
    echo ""
    echo -e "${YELLOW}📝 下一步：${NC}"
    echo -e "1. 設定 DNS A 記錄 (app, nodered, api, dashboard, mqtt, iot)"
    echo -e "2. 等待 DNS 生效 (5-30 分鐘)"
    echo -e "3. 訪問 https://app.alwaysbefound.com 開始使用"
else
    echo ""
    echo -e "${YELLOW}⚠️  部分服務未正常啟動，請檢查日誌。${NC}"
    echo -e "${YELLOW}   使用命令: docker compose logs [服務名稱]${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   管理提示${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "查看日誌: ${YELLOW}docker compose logs -f [服務名]${NC}"
echo -e "管理工具: ${YELLOW}./manage.sh${NC}"
echo -e "重新部署: ${YELLOW}./deploy.sh${NC}"

​
步驟 4.2：建立管理工具腳本
nano ~/docker-services/manage.sh

​
完整內容：
#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 檢查是否在正確目錄
cd ~/docker-services 2>/dev/null || {
    echo -e "${RED}錯誤：找不到 ~/docker-services 目錄${NC}"
    exit 1
}

# 顯示選單
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     Docker 服務管理工具 v3.0          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}【服務管理】${NC}"
    echo "  1) 📊 查看服務狀態"
    echo "  2) ▶️  啟動所有服務"
    echo "  3) ⏸️  停止所有服務"
    echo "  4) 🔄 重啟所有服務"
    echo ""
    echo -e "${GREEN}【日誌監控】${NC}"
    echo "  5) 📝 查看服務日誌"
    echo "  6) 🔍 查看錯誤日誌"
    echo ""
    echo -e "${GREEN}【維護操作】${NC}"
    echo "  7) 🔧 更新服務映像"
    echo "  8) 🧹 清理未使用資源"
    echo "  9) 💾 備份資料"
    echo "  10) 📥 還原資料"
    echo ""
    echo -e "${GREEN}【系統資訊】${NC}"
    echo "  11) 📈 查看資源使用"
    echo "  12) 🖥️  進入容器 Shell"
    echo "  13) 🌐 測試服務連線"
    echo "  14) 🔐 生成密碼雜湊"
    echo ""
    echo -e "${RED}  0) 退出${NC}"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════${NC}"
}

# 測試服務連線
test_connections() {
    echo -e "${BLUE}測試服務連線...${NC}"
    echo ""

    # 測試各個端點
    endpoints=(
        "app.alwaysbefound.com:PWA 應用"
        "nodered.alwaysbefound.com:Node-RED 編輯器"
        "api.alwaysbefound.com:API 端點"
        "dashboard.alwaysbefound.com:Dashboard"
        "mqtt.alwaysbefound.com:MQTT WebSocket"
    )

    for endpoint in "${endpoints[@]}"; do
        IFS=':' read -r url name <<< "$endpoint"
        echo -n "$name ($url): "

        if curl -k -s -o /dev/null -w "%{http_code}" "https://$url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ 連線成功${NC}"
        else
            echo -e "${RED}✗ 連線失敗${NC}"
        fi
    done

    echo ""

    # 測試內部服務
    echo -e "${BLUE}內部服務測試:${NC}"

    echo -n "PostgreSQL: "
    if docker exec postgres pg_isready -U admin -d myapp &>/dev/null; then
        echo -e "${GREEN}✓ 資料庫就緒${NC}"
    else
        echo -e "${RED}✗ 資料庫未就緒${NC}"
    fi

    echo -n "MQTT TCP: "
    if nc -z -w1 localhost 1883 2>/dev/null; then
        echo -e "${GREEN}✓ MQTT 服務運行中${NC}"
    else
        echo -e "${RED}✗ MQTT 服務未運行${NC}"
    fi
}

# 生成密碼雜湊
generate_password_hash() {
    echo -e "${BLUE}生成 Caddy 基本認證密碼雜湊${NC}"
    echo -n "輸入使用者名稱: "
    read username
    echo -n "輸入密碼: "
    read -s password
    echo ""

    # 使用 Caddy 生成密碼雜湊
    hash=$(docker run --rm caddy:latest caddy hash-password --plaintext "$password" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}生成成功！${NC}"
        echo -e "${YELLOW}在 Caddyfile 中使用：${NC}"
        echo "basicauth {"
        echo "    $username $hash"
        echo "}"
    else
        echo -e "${RED}生成失敗${NC}"
    fi
}

# 主程式循環
while true; do
    show_menu
    read -p "請選擇操作 [0-14]: " choice

    case $choice in
        1)
            echo -e "${GREEN}服務狀態:${NC}"
            docker compose ps
            ;;
        2)
            echo -e "${GREEN}啟動所有服務...${NC}"
            docker compose up -d
            ;;
        3)
            echo -e "${YELLOW}停止所有服務...${NC}"
            docker compose down
            ;;
        4)
            echo -e "${YELLOW}重啟所有服務...${NC}"
            docker compose restart
            ;;
        5)
            echo "選擇要查看的服務日誌:"
            echo "1) Caddy"
            echo "2) Node-RED"
            echo "3) MQTT"
            echo "4) PostgreSQL"
            echo "5) 所有服務"
            read -p "選擇 [1-5]: " log_choice
            case $log_choice in
                1) docker compose logs -f caddy ;;
                2) docker compose logs -f nodered ;;
                3) docker compose logs -f mqtt ;;
                4) docker compose logs -f postgres ;;
                5) docker compose logs -f ;;
                *) echo -e "${RED}無效選擇${NC}" ;;
            esac
            ;;
        6)
            echo -e "${YELLOW}查看錯誤日誌...${NC}"
            docker compose logs --tail=50 | grep -i error
            ;;
        7)
            echo -e "${GREEN}更新服務映像...${NC}"
            docker compose pull
            docker compose up -d
            ;;
        8)
            echo -e "${YELLOW}清理未使用的資源...${NC}"
            docker system prune -af
            docker volume prune -f
            ;;
        9)
            echo -e "${GREEN}備份資料...${NC}"
            backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
            mkdir -p ~/$backup_dir

            # 停止服務以確保資料一致性
            docker compose down

            # 備份各服務資料
            cp -r ~/docker-services/caddy ~/$backup_dir/
            cp -r ~/docker-services/nodered ~/$backup_dir/
            cp -r ~/docker-services/mqtt ~/$backup_dir/
            cp -r ~/docker-services/postgres ~/$backup_dir/
            cp ~/docker-services/docker-compose.yml ~/$backup_dir/

            # 備份資料庫
            docker compose up -d postgres
            sleep 5
            docker exec postgres pg_dump -U admin myapp > ~/$backup_dir/database.sql

            # 重新啟動所有服務
            docker compose up -d

            echo -e "${GREEN}備份完成！儲存在 ~/$backup_dir${NC}"
            ;;
        10)
            echo -e "${YELLOW}可用的備份:${NC}"
            ls -d ~/backup_* 2>/dev/null || echo "沒有找到備份"
            read -p "輸入要還原的備份目錄名稱: " backup_name
            if [ -d ~/$backup_name ]; then
                docker compose down
                cp -r ~/$backup_name/* ~/docker-services/
                docker compose up -d
                echo -e "${GREEN}還原完成！${NC}"
            else
                echo -e "${RED}備份目錄不存在${NC}"
            fi
            ;;
        11)
            echo -e "${GREEN}資源使用情況:${NC}"
            docker stats --no-stream
            echo ""
            echo -e "${GREEN}磁碟使用情況:${NC}"
            df -h | grep -E '^/dev/'
            echo ""
            echo -e "${GREEN}Docker 空間使用:${NC}"
            docker system df
            ;;
        12)
            echo "選擇要進入的容器:"
            echo "1) Node-RED"
            echo "2) PostgreSQL"
            echo "3) MQTT"
            echo "4) Caddy"
            read -p "選擇 [1-4]: " shell_choice
            case $shell_choice in
                1) docker exec -it nodered /bin/bash ;;
                2) docker exec -it postgres psql -U admin -d myapp ;;
                3) docker exec -it mqtt /bin/sh ;;
                4) docker exec -it caddy /bin/sh ;;
                *) echo -e "${RED}無效選擇${NC}" ;;
            esac
            ;;
        13)
            test_connections
            ;;
        14)
            generate_password_hash
            ;;
        0)
            echo -e "${GREEN}再見！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}無效的選擇，請重試${NC}"
            ;;
    esac

    echo ""
    read -p "按 Enter 繼續..."
done

​
步驟 4.3：設定腳本執行權限
chmod +x ~/docker-services/deploy.sh
chmod +x ~/docker-services/manage.sh

​
第五部分：DNS 設定
步驟 5.1：在 Hostinger DNS 管理介面設定
登入 Hostinger 控制台，添加以下 A 記錄：
子網域
類型
值
TTL
@
A
31.97.71.140
300
www
A
31.97.71.140
300
app
A
31.97.71.140
300
nodered
A
31.97.71.140
300
api
A
31.97.71.140
300
dashboard
A
31.97.71.140
300
mqtt
A
31.97.71.140
300
iot
A
31.97.71.140
300
vpn
A
31.97.71.140
300
步驟 5.2：驗證 DNS 設定
# 測試 DNS 解析（在本地電腦執行）
nslookup app.alwaysbefound.com
nslookup nodered.alwaysbefound.com
nslookup api.alwaysbefound.com

# 應該都返回 31.97.71.140

​
第六部分：執行部署
步驟 6.1：執行一鍵部署
cd ~/docker-services
./deploy.sh

​
步驟 6.2：驗證服務
# 使用管理工具測試連線
./manage.sh
# 選擇 13 測試服務連線

# 或手動測試
curl -I https://app.alwaysbefound.com
curl -I https://nodered.alwaysbefound.com

​
第七部分：PWA 應用開發
步驟 7.1：Node-RED 設定
訪問 https://nodered.alwaysbefound.com
安裝必要節點：
- node-red-dashboard- node-red-contrib-postgres-multi- node-red-node-static

​
步驟 7.2：建立 PWA 基礎結構
在 Node-RED 中建立以下 HTTP 端點：
// manifest.json 端點
[HTTP In: GET /manifest.json] → [Template: Manifest] → [HTTP Response]

// Service Worker 端點
[HTTP In: GET /service-worker.js] → [Template: SW] → [HTTP Response]

// PWA 主頁面
[HTTP In: GET /] → [Template: Index HTML] → [HTTP Response]

// API 端點範例
[HTTP In: GET /api/data] → [Function: Process] → [HTTP Response]

​
步驟 7.3：Manifest.json 範例
{
  "name": "Always Be Found PWA",
  "short_name": "ABF PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

​
步驟 7.4：Service Worker 基礎範例
const CACHE_NAME = 'abf-pwa-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

​
第八部分：安全性設定
步驟 8.1：防火牆設定
# 設定 UFW 防火牆
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 1883/tcp  # MQTT
sudo ufw allow 5432/tcp  # PostgreSQL (可選，建議只允許特定 IP)
sudo ufw enable

​
步驟 8.2：Node-RED 編輯器保護
生成密碼雜湊：
./manage.sh
# 選擇 14 生成密碼雜湊

​
更新 Caddyfile，在 nodered.alwaysbefound.com 區塊加入：
basicauth {
    admin $2a$14$xxxxx  # 貼上生成的雜湊
}

​
重載 Caddy：
docker exec -w /etc/caddy caddy caddy reload

​
步驟 8.3：生產環境密碼
建立 .env 檔案：
nano ~/docker-services/.env

​
內容：
# PostgreSQL
POSTGRES_USER=produser
POSTGRES_PASSWORD=SecurePassword123!
POSTGRES_DB=production

# MQTT (未來使用)
MQTT_USER=mqttuser
MQTT_PASSWORD=MqttSecure456!

​
更新 docker-compose.yml 使用環境變數：
postgres:
  environment:
    - POSTGRES_USER=${POSTGRES_USER}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    - POSTGRES_DB=${POSTGRES_DB}

​
第九部分：故障排除
問題 1：Node-RED 權限錯誤
# 修正權限
sudo chown -R 1000:1000 ~/docker-services/nodered/data
docker compose restart nodered

​
問題 2：HTTPS 證書未生效
# 檢查 DNS
nslookup app.alwaysbefound.com

# 查看 Caddy 日誌
docker logs caddy --tail 50

# 重新載入 Caddy
docker exec -w /etc/caddy caddy caddy reload

​
問題 3：服務無法連線
# 檢查防火牆
sudo ufw status

# 檢查容器網路
docker network ls
docker network inspect docker-services_docker-network

# 重建網路
docker compose down
docker compose up -d

​
第十部分：日常維護
10.1 備份策略
# 建立自動備份腳本
nano ~/docker-services/auto_backup.sh

​
#!/bin/bash
BACKUP_DIR="$HOME/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 備份所有資料
tar -czf $BACKUP_DIR/docker-services.tar.gz ~/docker-services/

# 備份資料庫
docker exec postgres pg_dump -U admin myapp > $BACKUP_DIR/database.sql

echo "備份完成: $BACKUP_DIR"

​
設定 cron：
crontab -e
# 每天凌晨 3 點備份
0 3 * * * /home/gray/docker-services/auto_backup.sh

​
10.2 監控與日誌
# 即時監控所有服務
docker compose logs -f

# 查看特定時間範圍
docker compose logs --since="2024-01-01" --until="2024-01-02"

# 監控資源使用
docker stats

​
10.3 更新服務
# 更新所有服務
cd ~/docker-services
docker compose pull
docker compose up -d

# 更新特定服務
docker compose pull nodered
docker compose up -d nodered

​
快速參考
常用命令
# 服務管理
cd ~/docker-services
./deploy.sh              # 一鍵部署
./manage.sh              # 管理介面
docker compose ps        # 查看狀態
docker compose logs -f   # 查看日誌
docker compose restart   # 重啟服務

# 容器操作
docker exec -it nodered /bin/bash    # 進入 Node-RED
docker exec -it postgres psql -U admin -d myapp  # 進入 PostgreSQL

​
服務端點
PWA 應用: https://app.alwaysbefound.com
Node-RED 編輯器: https://nodered.alwaysbefound.com
API: https://api.alwaysbefound.com
Dashboard: https://dashboard.alwaysbefound.com
MQTT WebSocket: wss://mqtt.alwaysbefound.com
連線資訊
PostgreSQL: 31.97.71.140:5432 (admin/admin123)
MQTT TCP: 31.97.71.140:1883
MQTT WS: wss://mqtt.alwaysbefound.com
最後更新: 2024
版本: 3.0
維護者: gray@alwaysbefound.com
