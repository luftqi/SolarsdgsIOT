# SolarSDGs IoT - VPS 部署腳本 (Windows PowerShell)
# 用途：從本地 Windows 電腦部署到 Hostinger VPS
# 執行：.\scripts\deploy-to-vps.ps1

param(
    [string]$VpsIp = "72.61.117.219",
    [string]$VpsUser = "root",
    [switch]$SkipUpload,
    [switch]$SkipInstall,
    [switch]$Help
)

# 顏色輸出函數
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

# 顯示幫助
function Show-Help {
    Write-Host @"

SolarSDGs IoT - VPS 部署工具
============================

用途：自動將專案部署到 Hostinger VPS

使用方法：
  .\scripts\deploy-to-vps.ps1 [選項]

選項：
  -VpsIp <IP>       VPS IP 地址（預設: 72.61.117.219）
  -VpsUser <用戶>   SSH 使用者（預設: root）
  -SkipUpload       跳過上傳步驟
  -SkipInstall      跳過安裝步驟
  -Help             顯示此幫助訊息

範例：
  # 完整部署
  .\scripts\deploy-to-vps.ps1

  # 只上傳文件
  .\scripts\deploy-to-vps.ps1 -SkipInstall

  # 只執行安裝
  .\scripts\deploy-to-vps.ps1 -SkipUpload

注意：
  1. 需要先設置 SSH 連接（密碼或金鑰）
  2. 確保有足夠的權限執行安裝腳本
  3. 安裝過程約需 10-15 分鐘

"@
}

# 顯示橫幅
function Show-Banner {
    Write-Host @"

=========================================
  SolarSDGs IoT - VPS 自動部署
=========================================

VPS 資訊:
  - IP: $VpsIp
  - 使用者: $VpsUser
  - 主機名稱: srv1122961.hstgr.cloud
  - 系統: Ubuntu 24.04 LTS

"@ -ForegroundColor Cyan
}

# 檢查 SSH 連接
function Test-SshConnection {
    Write-Info "檢查 SSH 連接..."

    try {
        $result = ssh -o ConnectTimeout=10 -o BatchMode=yes "$VpsUser@$VpsIp" "echo 'OK'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "SSH 連接成功"
            return $true
        }
    }
    catch {
        # Ignore
    }

    Write-Warning "SSH 連接失敗或需要密碼"
    Write-Info "請確保:"
    Write-Info "  1. VPS 可以訪問"
    Write-Info "  2. 已設置 SSH 金鑰或準備好密碼"
    Write-Info ""

    $continue = Read-Host "是否繼續? (y/n)"
    if ($continue -ne 'y') {
        Write-Error "部署取消"
        exit 1
    }

    return $true
}

# 上傳安裝腳本
function Upload-InstallScript {
    Write-Info "階段 1/3: 上傳安裝腳本到 VPS..."

    $scriptPath = ".\scripts\install-vps-dependencies.sh"

    if (-not (Test-Path $scriptPath)) {
        Write-Error "找不到安裝腳本: $scriptPath"
        exit 1
    }

    try {
        scp $scriptPath "$VpsUser@${VpsIp}:/tmp/install-vps-dependencies.sh"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "安裝腳本上傳成功"
        }
        else {
            Write-Error "上傳失敗"
            exit 1
        }
    }
    catch {
        Write-Error "上傳過程發生錯誤: $_"
        exit 1
    }
}

# 執行安裝腳本
function Invoke-InstallScript {
    Write-Info "階段 2/3: 在 VPS 上執行安裝腳本..."
    Write-Warning "此過程可能需要 10-15 分鐘，請耐心等待..."
    Write-Host ""

    try {
        ssh "$VpsUser@$VpsIp" "sudo bash /tmp/install-vps-dependencies.sh"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "安裝腳本執行成功"
        }
        else {
            Write-Warning "安裝腳本執行可能有警告，請檢查上方輸出"
        }
    }
    catch {
        Write-Error "執行過程發生錯誤: $_"
        exit 1
    }
}

# 驗證安裝
function Test-Installation {
    Write-Info "階段 3/3: 驗證安裝..."

    try {
        $output = ssh "$VpsUser@$VpsIp" @"
echo "========================================="
echo "  已安裝的服務版本"
echo "========================================="
command -v node >/dev/null && echo "✓ Node.js:    \$(node -v)" || echo "✗ Node.js: 未安裝"
command -v docker >/dev/null && echo "✓ Docker:     \$(docker --version | cut -d ' ' -f 3 | tr -d ',')" || echo "✗ Docker: 未安裝"
command -v psql >/dev/null && echo "✓ PostgreSQL: \$(psql --version | cut -d ' ' -f 3)" || echo "✗ PostgreSQL: 未安裝"
command -v mosquitto >/dev/null && echo "✓ Mosquitto:  已安裝" || echo "✗ Mosquitto: 未安裝"
echo ""
echo "========================================="
echo "  服務狀態"
echo "========================================="
systemctl is-active --quiet docker && echo "✓ Docker:      運行中" || echo "✗ Docker:      未運行"
systemctl is-active --quiet postgresql && echo "✓ PostgreSQL:  運行中" || echo "✗ PostgreSQL:  未運行"
systemctl is-active --quiet mosquitto && echo "✓ Mosquitto:   運行中" || echo "✗ Mosquitto:   未運行"
"@

        Write-Host $output

        Write-Success "安裝驗證完成"
    }
    catch {
        Write-Warning "驗證過程發生錯誤: $_"
    }
}

# 顯示後續步驟
function Show-NextSteps {
    Write-Host @"

=========================================
  🎉 VPS 依賴安裝完成！
=========================================

後續步驟:

1️⃣  配置資料庫
   ssh $VpsUser@$VpsIp
   sudo -u postgres psql
   CREATE DATABASE solarsdgs_iot;
   CREATE USER solarsdgs WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;

2️⃣  配置 MQTT
   sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs

3️⃣  上傳專案代碼
   # 從本地打包
   tar --exclude='node_modules' --exclude='.git' -czf solarsdgs-iot.tar.gz .
   scp solarsdgs-iot.tar.gz $VpsUser@${VpsIp}:~/

   # 在 VPS 上解壓
   ssh $VpsUser@$VpsIp
   mkdir -p ~/docker-services/app
   tar -xzf solarsdgs-iot.tar.gz -C ~/docker-services/app/

4️⃣  啟動服務
   cd ~/docker-services
   docker compose up -d

完整部署指南:
  https://github.com/luftqi/SolarsdgsIOT/blob/main/docs/ENVIRONMENT_SETUP.md

"@ -ForegroundColor Green
}

###############################################################################
# 主程序
###############################################################################

function Main {
    # 顯示幫助
    if ($Help) {
        Show-Help
        exit 0
    }

    # 顯示橫幅
    Show-Banner

    # 檢查 SSH
    Test-SshConnection

    # 上傳腳本
    if (-not $SkipUpload) {
        Upload-InstallScript
    }
    else {
        Write-Info "跳過上傳步驟"
    }

    # 執行安裝
    if (-not $SkipInstall) {
        Invoke-InstallScript
    }
    else {
        Write-Info "跳過安裝步驟"
    }

    # 驗證
    Test-Installation

    # 顯示後續步驟
    Show-NextSteps
}

# 執行主程序
Main
