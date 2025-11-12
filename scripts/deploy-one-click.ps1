# SolarSDGs IoT - 一鍵部署腳本 (PowerShell)
# 用途: 從 Windows 自動部署到 Hostinger VPS

param(
    [string]$VpsIp = "72.61.117.219",
    [string]$SshUser = "root",
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SolarSDGs IoT 一鍵部署到 VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "目標 VPS: $VpsIp" -ForegroundColor Yellow
Write-Host "SSH 用戶: $SshUser" -ForegroundColor Yellow
Write-Host ""

# 1. 上傳安裝腳本
if (-not $SkipUpload) {
    Write-Host "[1/4] 上傳安裝腳本到 VPS..." -ForegroundColor Green

    $setupScript = Join-Path $PSScriptRoot "setup-vps.sh"

    if (-not (Test-Path $setupScript)) {
        Write-Host "錯誤: 找不到 setup-vps.sh" -ForegroundColor Red
        exit 1
    }

    Write-Host "執行: scp $setupScript ${SshUser}@${VpsIp}:/tmp/setup-vps.sh" -ForegroundColor Gray
    scp $setupScript "${SshUser}@${VpsIp}:/tmp/setup-vps.sh"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "錯誤: SCP 上傳失敗" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ 安裝腳本上傳成功" -ForegroundColor Green
    Write-Host ""
}

# 2. 執行安裝腳本
Write-Host "[2/4] 在 VPS 上執行安裝腳本..." -ForegroundColor Green
Write-Host "這可能需要 5-10 分鐘，請耐心等待..." -ForegroundColor Yellow
Write-Host ""

$installCommand = @"
chmod +x /tmp/setup-vps.sh && \
sudo /tmp/setup-vps.sh
"@

ssh "${SshUser}@${VpsIp}" $installCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤: 安裝腳本執行失敗" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ 安裝腳本執行完成" -ForegroundColor Green
Write-Host ""

# 3. 驗證安裝
Write-Host "[3/4] 驗證安裝結果..." -ForegroundColor Green

$verifyCommand = @"
echo '========== 已安裝版本 ==========' && \
echo 'Node.js:    ' \$(node --version 2>/dev/null || echo '未安裝') && \
echo 'npm:        ' \$(npm --version 2>/dev/null || echo '未安裝') && \
echo 'Docker:     ' \$(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo '未安裝') && \
echo 'PostgreSQL: ' \$(psql --version 2>/dev/null | cut -d' ' -f3 || echo '未安裝') && \
echo 'Mosquitto:  ' \$(mosquitto -h 2>&1 | grep version | head -n 1 | cut -d' ' -f3 || echo '未安裝') && \
echo 'Nginx:      ' \$(nginx -v 2>&1 | cut -d'/' -f2 || echo '未安裝') && \
echo '' && \
echo '========== 服務狀態 ==========' && \
systemctl is-active docker && echo 'Docker:      運行中' || echo 'Docker:      未運行' && \
systemctl is-active postgresql && echo 'PostgreSQL:  運行中' || echo 'PostgreSQL:  未運行' && \
systemctl is-active mosquitto && echo 'Mosquitto:   運行中' || echo 'Mosquitto:   未運行' && \
systemctl is-active nginx && echo 'Nginx:       運行中' || echo 'Nginx:       未運行'
"@

ssh "${SshUser}@${VpsIp}" $verifyCommand

Write-Host ""
Write-Host "✓ 驗證完成" -ForegroundColor Green
Write-Host ""

# 4. 顯示下一步
Write-Host "[4/4] 安裝完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  下一步操作" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 配置 PostgreSQL 資料庫:" -ForegroundColor Yellow
Write-Host "   ssh ${SshUser}@${VpsIp}" -ForegroundColor Gray
Write-Host "   sudo -u postgres psql" -ForegroundColor Gray
Write-Host "   CREATE DATABASE solarsdgs_iot;" -ForegroundColor Gray
Write-Host "   CREATE USER solarsdgs WITH PASSWORD 'your_password';" -ForegroundColor Gray
Write-Host "   GRANT ALL PRIVILEGES ON DATABASE solarsdgs_iot TO solarsdgs;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 配置 MQTT Broker:" -ForegroundColor Yellow
Write-Host "   sudo mosquitto_passwd -c /etc/mosquitto/passwd solarsdgs" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 上傳專案代碼:" -ForegroundColor Yellow
Write-Host "   .\scripts\deploy-project.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "或者查看完整部署步驟:" -ForegroundColor Yellow
Write-Host "   .\DEPLOYMENT_STEPS.md" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
