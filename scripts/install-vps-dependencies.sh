#!/bin/bash

###############################################################################
# SolarSDGs IoT - VPS 依賴安裝腳本
# 用途：在 Hostinger VPS 上安裝所有必要的依賴項
# 系統：Ubuntu 24.04 LTS
# 執行：sudo bash install-vps-dependencies.sh
###############################################################################

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查是否為 root 用戶
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此腳本必須以 root 權限執行"
        log_info "請使用: sudo bash $0"
        exit 1
    fi
}

# 顯示歡迎訊息
show_banner() {
    echo "========================================="
    echo "  SolarSDGs IoT - VPS 環境設置"
    echo "  Hostinger VPS 依賴安裝腳本"
    echo "========================================="
    echo ""
    log_info "VPS 資訊:"
    echo "  - IP: 72.61.117.219"
    echo "  - Hostname: srv1122961.hstgr.cloud"
    echo "  - OS: Ubuntu 24.04 LTS"
    echo "  - Location: Malaysia - Kuala Lumpur"
    echo ""
}

# 階段 1: 更新系統
update_system() {
    log_info "階段 1/10: 更新系統套件..."

    apt update
    apt upgrade -y

    log_success "系統更新完成"
}

# 階段 2: 安裝基礎工具
install_basic_tools() {
    log_info "階段 2/10: 安裝基礎工具..."

    apt install -y \
        git \
        curl \
        wget \
        vim \
        nano \
        tree \
        htop \
        net-tools \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release

    log_success "基礎工具安裝完成"
}

# 階段 3: 安裝 Node.js 20 LTS
install_nodejs() {
    log_info "階段 3/10: 安裝 Node.js 20 LTS..."

    # 移除舊版本（如果存在）
    apt remove -y nodejs npm || true

    # 添加 NodeSource 儲存庫
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

    # 安裝 Node.js
    apt install -y nodejs

    # 驗證安裝
    node_version=$(node -v)
    npm_version=$(npm -v)

    log_success "Node.js 安裝完成"
    log_info "  - Node.js 版本: $node_version"
    log_info "  - npm 版本: $npm_version"
}

# 階段 4: 安裝 Docker
install_docker() {
    log_info "階段 4/10: 安裝 Docker..."

    # 移除舊版本
    apt remove -y docker docker-engine docker.io containerd runc || true

    # 添加 Docker GPG 金鑰
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    # 添加 Docker 儲存庫
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # 安裝 Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # 啟動 Docker
    systemctl start docker
    systemctl enable docker

    # 驗證安裝
    docker_version=$(docker --version)
    compose_version=$(docker compose version)

    log_success "Docker 安裝完成"
    log_info "  - Docker: $docker_version"
    log_info "  - Compose: $compose_version"
}

# 階段 5: 安裝 PostgreSQL 16
install_postgresql() {
    log_info "階段 5/10: 安裝 PostgreSQL 16..."

    # 添加 PostgreSQL 儲存庫
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

    # 安裝 PostgreSQL
    apt update
    apt install -y postgresql-16 postgresql-contrib-16

    # 啟動服務
    systemctl start postgresql
    systemctl enable postgresql

    # 驗證安裝
    pg_version=$(su - postgres -c "psql --version")

    log_success "PostgreSQL 安裝完成"
    log_info "  - 版本: $pg_version"
}

# 階段 6: 安裝 MQTT Mosquitto
install_mosquitto() {
    log_info "階段 6/10: 安裝 Eclipse Mosquitto MQTT Broker..."

    # 添加 Mosquitto 儲存庫
    apt-add-repository -y ppa:mosquitto-dev/mosquitto-ppa
    apt update

    # 安裝 Mosquitto
    apt install -y mosquitto mosquitto-clients

    # 啟動服務
    systemctl start mosquitto
    systemctl enable mosquitto

    # 驗證安裝
    mosquitto_version=$(mosquitto -h | grep "mosquitto version" | head -n 1)

    log_success "Mosquitto 安裝完成"
    log_info "  - 版本: $mosquitto_version"
}

# 階段 7: 配置防火牆
configure_firewall() {
    log_info "階段 7/10: 配置防火牆 (UFW)..."

    # 安裝 UFW
    apt install -y ufw

    # 配置規則（先不啟用）
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # 允許 SSH
    ufw allow 22/tcp comment 'SSH'

    # 允許 HTTP/HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    # 允許 MQTT（如需外部訪問）
    ufw allow 1883/tcp comment 'MQTT'
    ufw allow 8883/tcp comment 'MQTT SSL'

    # 允許 PostgreSQL（僅本地，不需要規則）
    # ufw allow from 127.0.0.1 to any port 5432

    log_warning "防火牆規則已配置但未啟用"
    log_info "稍後可使用以下命令啟用:"
    echo "    sudo ufw enable"

    log_success "防火牆配置完成"
}

# 階段 8: 建立專案目錄
create_project_directory() {
    log_info "階段 8/10: 建立專案目錄..."

    # 建立主目錄
    mkdir -p /opt/solarsdgs-iot
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

    log_success "專案目錄建立完成"
    log_info "  - 主目錄: /opt/solarsdgs-iot"
    log_info "  - Docker 目錄: ~/docker-services"
}

# 階段 9: 安裝額外工具
install_additional_tools() {
    log_info "階段 9/10: 安裝額外工具..."

    # 安裝 Caddy（反向代理）
    apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy

    # 停止 Caddy（我們將使用 Docker 版本）
    systemctl stop caddy
    systemctl disable caddy

    log_success "額外工具安裝完成"
}

# 階段 10: 驗證安裝
verify_installation() {
    log_info "階段 10/10: 驗證安裝..."

    echo ""
    echo "========================================="
    echo "  已安裝的套件版本"
    echo "========================================="

    # Node.js
    if command -v node &> /dev/null; then
        echo "✓ Node.js:    $(node -v)"
        echo "✓ npm:        $(npm -v)"
    else
        echo "✗ Node.js:    未安裝"
    fi

    # Git
    if command -v git &> /dev/null; then
        echo "✓ Git:        $(git --version | cut -d ' ' -f 3)"
    else
        echo "✗ Git:        未安裝"
    fi

    # Docker
    if command -v docker &> /dev/null; then
        echo "✓ Docker:     $(docker --version | cut -d ' ' -f 3 | tr -d ',')"
        echo "✓ Compose:    $(docker compose version | cut -d ' ' -f 4)"
    else
        echo "✗ Docker:     未安裝"
    fi

    # PostgreSQL
    if command -v psql &> /dev/null; then
        echo "✓ PostgreSQL: $(psql --version | cut -d ' ' -f 3)"
    else
        echo "✗ PostgreSQL: 未安裝"
    fi

    # Mosquitto
    if command -v mosquitto &> /dev/null; then
        echo "✓ Mosquitto:  $(mosquitto -h 2>&1 | grep "version" | head -n 1 | cut -d ' ' -f 3)"
    else
        echo "✗ Mosquitto:  未安裝"
    fi

    echo ""
    echo "========================================="
    echo "  服務狀態"
    echo "========================================="

    # Docker
    if systemctl is-active --quiet docker; then
        echo "✓ Docker:      運行中"
    else
        echo "✗ Docker:      未運行"
    fi

    # PostgreSQL
    if systemctl is-active --quiet postgresql; then
        echo "✓ PostgreSQL:  運行中"
    else
        echo "✗ PostgreSQL:  未運行"
    fi

    # Mosquitto
    if systemctl is-active --quiet mosquitto; then
        echo "✓ Mosquitto:   運行中"
    else
        echo "✗ Mosquitto:   未運行"
    fi

    echo ""
    log_success "所有依賴項安裝完成！"
}

# 顯示後續步驟
show_next_steps() {
    echo ""
    echo "========================================="
    echo "  🎉 安裝完成！"
    echo "========================================="
    echo ""
    log_info "下一步："
    echo "  1. 啟用防火牆: sudo ufw enable"
    echo "  2. 從 GitHub clone 專案:"
    echo "     git clone https://github.com/luftqi/SolarsdgsIOT.git ~/solarsdgs-iot"
    echo "  3. 配置環境變數"
    echo "  4. 啟動 Docker Compose 服務"
    echo ""
    log_info "完整部署指南請參考:"
    echo "  https://github.com/luftqi/SolarsdgsIOT/blob/main/docs/ENVIRONMENT_SETUP.md"
    echo ""
}

###############################################################################
# 主程序
###############################################################################

main() {
    check_root
    show_banner

    # 執行所有安裝階段
    update_system
    install_basic_tools
    install_nodejs
    install_docker
    install_postgresql
    install_mosquitto
    configure_firewall
    create_project_directory
    install_additional_tools
    verify_installation

    show_next_steps
}

# 執行主程序
main "$@"
