#!/bin/bash

# SolarSDGs IoT - VPS 自動化安裝腳本
# 適用於: Ubuntu 22.04 LTS / Debian 12
# 用途: 一鍵安裝所有必要的依賴套件

set -e  # 遇到錯誤立即停止

echo "=========================================="
echo "  SolarSDGs IoT VPS 環境安裝程式"
echo "=========================================="
echo ""

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}請使用 sudo 執行此腳本${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/10] 更新系統套件...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/10] 安裝基礎工具...${NC}"
apt install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  unzip

echo -e "${GREEN}✓ 基礎工具安裝完成${NC}"

# ==================== Node.js 安裝 ====================
echo -e "${YELLOW}[3/10] 安裝 Node.js 20 LTS...${NC}"

# 使用 NodeSource 官方倉庫
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 驗證安裝
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo -e "${GREEN}✓ Node.js ${NODE_VERSION} 安裝完成${NC}"
echo -e "${GREEN}✓ npm ${NPM_VERSION} 安裝完成${NC}"

# ==================== Docker 安裝 ====================
echo -e "${YELLOW}[4/10] 安裝 Docker...${NC}"

# 移除舊版本 Docker
apt remove -y docker docker-engine docker.io containerd runc || true

# 安裝 Docker 官方 GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 倉庫
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安裝 Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 啟動 Docker 服務
systemctl start docker
systemctl enable docker

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✓ ${DOCKER_VERSION} 安裝完成${NC}"

# ==================== Docker Compose 安裝 ====================
echo -e "${YELLOW}[5/10] 驗證 Docker Compose...${NC}"

COMPOSE_VERSION=$(docker compose version)
echo -e "${GREEN}✓ ${COMPOSE_VERSION} 已安裝${NC}"

# ==================== PostgreSQL 安裝 ====================
echo -e "${YELLOW}[6/10] 安裝 PostgreSQL 16...${NC}"

# 添加 PostgreSQL 官方倉庫
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

apt update
apt install -y postgresql-16 postgresql-contrib-16

# 啟動 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

POSTGRES_VERSION=$(psql --version)
echo -e "${GREEN}✓ ${POSTGRES_VERSION} 安裝完成${NC}"

# ==================== MQTT Mosquitto 安裝 ====================
echo -e "${YELLOW}[7/10] 安裝 MQTT Mosquitto Broker...${NC}"

apt install -y mosquitto mosquitto-clients

# 啟動 Mosquitto
systemctl start mosquitto
systemctl enable mosquitto

MOSQUITTO_VERSION=$(mosquitto -h | grep "version" | head -n 1)
echo -e "${GREEN}✓ Mosquitto ${MOSQUITTO_VERSION} 安裝完成${NC}"

# ==================== Nginx 安裝 ====================
echo -e "${YELLOW}[8/10] 安裝 Nginx...${NC}"

apt install -y nginx

# 啟動 Nginx
systemctl start nginx
systemctl enable nginx

NGINX_VERSION=$(nginx -v 2>&1)
echo -e "${GREEN}✓ ${NGINX_VERSION} 安裝完成${NC}"

# ==================== 防火牆設定 ====================
echo -e "${YELLOW}[9/10] 配置防火牆 (UFW)...${NC}"

# 安裝 UFW (如果沒有)
apt install -y ufw

# 允許必要的端口
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Backend API
ufw allow 5173/tcp    # Frontend Dev (開發時)
ufw allow 5432/tcp    # PostgreSQL (僅內部使用,建議稍後限制)
ufw allow 1883/tcp    # MQTT
ufw allow 8883/tcp    # MQTT over TLS

echo -e "${GREEN}✓ 防火牆規則已設定${NC}"
echo -e "${YELLOW}注意: UFW 尚未啟用,請在確認 SSH 可用後手動執行: sudo ufw enable${NC}"

# ==================== 創建專案目錄 ====================
echo -e "${YELLOW}[10/10] 創建專案目錄結構...${NC}"

# 創建應用目錄
mkdir -p /opt/solarsdgs-iot
mkdir -p /opt/solarsdgs-iot/logs
mkdir -p /opt/solarsdgs-iot/data
mkdir -p /opt/solarsdgs-iot/backups

# 設定權限 (假設使用 ubuntu 用戶)
if id "ubuntu" &>/dev/null; then
  chown -R ubuntu:ubuntu /opt/solarsdgs-iot
  echo -e "${GREEN}✓ 專案目錄已設定擁有者為 ubuntu${NC}"
else
  echo -e "${YELLOW}⚠ 找不到 ubuntu 用戶,請手動設定目錄擁有者${NC}"
fi

echo -e "${GREEN}✓ 專案目錄結構已創建: /opt/solarsdgs-iot${NC}"

# ==================== 顯示安裝摘要 ====================
echo ""
echo "=========================================="
echo -e "${GREEN}  安裝完成!${NC}"
echo "=========================================="
echo ""
echo "已安裝的套件版本:"
echo "  • Node.js:     $(node --version)"
echo "  • npm:         $(npm --version)"
echo "  • Git:         $(git --version | cut -d' ' -f3)"
echo "  • Docker:      $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "  • Compose:     $(docker compose version | cut -d' ' -f4)"
echo "  • PostgreSQL:  $(psql --version | cut -d' ' -f3)"
echo "  • Mosquitto:   $(mosquitto -h 2>&1 | grep version | head -n 1 | cut -d' ' -f3)"
echo "  • Nginx:       $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""
echo "服務狀態:"
systemctl is-active --quiet docker && echo -e "  • Docker:      ${GREEN}運行中${NC}" || echo -e "  • Docker:      ${RED}未運行${NC}"
systemctl is-active --quiet postgresql && echo -e "  • PostgreSQL:  ${GREEN}運行中${NC}" || echo -e "  • PostgreSQL:  ${RED}未運行${NC}"
systemctl is-active --quiet mosquitto && echo -e "  • Mosquitto:   ${GREEN}運行中${NC}" || echo -e "  • Mosquitto:   ${RED}未運行${NC}"
systemctl is-active --quiet nginx && echo -e "  • Nginx:       ${GREEN}運行中${NC}" || echo -e "  • Nginx:       ${RED}未運行${NC}"
echo ""
echo "專案目錄: /opt/solarsdgs-iot"
echo ""
echo "下一步操作:"
echo "  1. 配置 PostgreSQL 資料庫:"
echo "     sudo -u postgres psql"
echo "     CREATE DATABASE solarsdgs_iot;"
echo "     CREATE USER solarsdgs WITH PASSWORD 'your_password';"
echo "     GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;"
echo ""
echo "  2. 上傳專案代碼到: /opt/solarsdgs-iot"
echo ""
echo "  3. 配置環境變數: /opt/solarsdgs-iot/backend/.env"
echo ""
echo "  4. 啟用防火牆 (確認 SSH 可用後):"
echo "     sudo ufw enable"
echo ""
echo "  5. 啟動應用:"
echo "     cd /opt/solarsdgs-iot"
echo "     docker compose up -d"
echo ""
echo "=========================================="
