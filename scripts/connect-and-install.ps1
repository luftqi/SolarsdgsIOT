# SolarSDGs IoT - 交互式 VPS 連接與安裝腳本
# 用途：引導用戶輸入密碼並在 VPS 上安裝依賴
# 執行：.\scripts\connect-and-install.ps1

param(
    [string]$VpsIp = "72.61.117.219",
    [string]$VpsUser = "root"
)

# 顏色輸出
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info { param([string]$M) Write-ColorOutput "[INFO] $M" "Cyan" }
function Write-Success { param([string]$M) Write-ColorOutput "[SUCCESS] $M" "Green" }
function Write-Warning { param([string]$M) Write-ColorOutput "[WARNING] $M" "Yellow" }
function Write-Error { param([string]$M) Write-ColorOutput "[ERROR] $M" "Red" }

# 顯示歡迎訊息
Write-Host @"

=========================================
  SolarSDGs IoT - VPS 自動安裝工具
=========================================

VPS 資訊:
  IP: $VpsIp
  使用者: $VpsUser
  主機名稱: srv1122961.hstgr.cloud

"@ -ForegroundColor Cyan

Write-Info "此腳本將會："
Write-Host "  1. 上傳安裝腳本到 VPS"
Write-Host "  2. 自動安裝所有依賴項（Node.js, Docker, PostgreSQL, MQTT）"
Write-Host "  3. 配置專案目錄"
Write-Host "  4. 驗證安裝結果"
Write-Host ""

Write-Warning "安裝過程約需 10-15 分鐘，請確保網路連接穩定"
Write-Host ""

# 詢問是否繼續
$continue = Read-Host "是否繼續? (y/n)"
if ($continue -ne 'y' -and $continue -ne 'Y') {
    Write-Error "安裝取消"
    exit 0
}

Write-Host ""
Write-Info "準備連接到 VPS..."
Write-Info "系統會提示您輸入 SSH 密碼"
Write-Host ""

# 檢查腳本是否存在
$scriptPath = ".\scripts\install-vps-dependencies.sh"
if (-not (Test-Path $scriptPath)) {
    Write-Error "找不到安裝腳本: $scriptPath"
    Write-Info "請確保在專案根目錄執行此腳本"
    exit 1
}

# 步驟 1: 上傳安裝腳本
Write-Info "步驟 1/3: 上傳安裝腳本..."
Write-Host ""

try {
    & scp $scriptPath "${VpsUser}@${VpsIp}:/tmp/install-vps-dependencies.sh"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "安裝腳本上傳成功"
        Write-Host ""
    }
    else {
        Write-Error "上傳失敗，請檢查:"
        Write-Info "  1. VPS IP 地址是否正確"
        Write-Info "  2. 網路連接是否正常"
        Write-Info "  3. SSH 密碼是否正確"
        exit 1
    }
}
catch {
    Write-Error "上傳過程發生錯誤: $_"
    exit 1
}

# 步驟 2: 執行安裝腳本
Write-Info "步驟 2/3: 執行安裝腳本..."
Write-Warning "此過程可能需要 10-15 分鐘"
Write-Info "您會看到彩色的安裝進度..."
Write-Host ""

try {
    & ssh "${VpsUser}@${VpsIp}" "sudo bash /tmp/install-vps-dependencies.sh"

    Write-Host ""
    if ($LASTEXITCODE -eq 0) {
        Write-Success "安裝腳本執行完成"
    }
    else {
        Write-Warning "安裝過程可能有警告，請查看上方輸出"
    }
    Write-Host ""
}
catch {
    Write-Error "執行過程發生錯誤: $_"
    exit 1
}

# 步驟 3: 驗證安裝
Write-Info "步驟 3/3: 驗證安裝..."
Write-Host ""

try {
    & ssh "${VpsUser}@${VpsIp}" @"
echo "========================================="
echo "  驗證安裝結果"
echo "========================================="
echo ""
command -v node >/dev/null && echo "✓ Node.js:    \$(node -v)" || echo "✗ Node.js: 未安裝"
command -v npm >/dev/null && echo "✓ npm:        \$(npm -v)" || echo "✗ npm: 未安裝"
command -v docker >/dev/null && echo "✓ Docker:     \$(docker --version | cut -d ' ' -f 3 | tr -d ',')" || echo "✗ Docker: 未安裝"
command -v psql >/dev/null && echo "✓ PostgreSQL: \$(psql --version | cut -d ' ' -f 3)" || echo "✗ PostgreSQL: 未安裝"
command -v mosquitto >/dev/null && echo "✓ Mosquitto:  已安裝" || echo "✗ Mosquitto: 未安裝"
echo ""
echo "服務狀態:"
systemctl is-active --quiet docker && echo "✓ Docker:      運行中" || echo "✗ Docker:      未運行"
systemctl is-active --quiet postgresql && echo "✓ PostgreSQL:  運行中" || echo "✗ PostgreSQL:  未運行"
systemctl is-active --quiet mosquitto && echo "✓ Mosquitto:   運行中" || echo "✗ Mosquitto:   未運行"
"@

    Write-Host ""
    Write-Success "安裝驗證完成！"
}
catch {
    Write-Warning "驗證過程發生錯誤，但安裝可能已完成"
}

# 顯示後續步驟
Write-Host ""
Write-Host @"
=========================================
  🎉 VPS 依賴安裝完成！
=========================================

接下來您需要：

1️⃣  配置 PostgreSQL 資料庫
   在 VPS 上執行：
   sudo -u postgres psql
   CREATE DATABASE solarsdgs_iot;
   CREATE USER solarsdgs WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;

2️⃣  配置 MQTT Broker
   sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs

3️⃣  上傳專案代碼
   使用以下命令打包並上傳：
   tar --exclude='node_modules' -czf project.tar.gz .
   scp project.tar.gz ${VpsUser}@${VpsIp}:~/

4️⃣  啟動 Docker 服務
   詳見部署文檔

📚 完整部署指南:
   docs/VPS_DEPLOYMENT_GUIDE.md

"@ -ForegroundColor Green

Write-Host ""
Write-Info "按任意鍵結束..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
