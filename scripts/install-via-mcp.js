#!/usr/bin/env node

/**
 * SolarSDGs IoT - 使用 Hostinger API 安裝依賴
 * 透過 Hostinger API 在 VPS 上執行安裝指令
 */

const API_TOKEN = '5tLzVeaSKiVxW8OsEqRThAoWwf4DlYqpEh2JqL9B2c54ead6';
const VPS_ID = 'srv-3jzr9fny4'; // 需要從 Hostinger API 獲取實際的 VPS ID

// 安裝指令列表
const INSTALL_COMMANDS = [
  // 1. 更新系統
  'apt update && apt upgrade -y',

  // 2. 安裝基礎工具
  'apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release unzip',

  // 3. 安裝 Node.js 20 LTS
  'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs',

  // 4. 安裝 Docker
  'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',

  // 5. 安裝 PostgreSQL 16
  'sh -c \'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list\' && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && apt update && apt install -y postgresql-16 postgresql-contrib-16',

  // 6. 安裝 Mosquitto
  'apt install -y mosquitto mosquitto-clients',

  // 7. 安裝 Nginx
  'apt install -y nginx',

  // 8. 啟動服務
  'systemctl start docker && systemctl enable docker',
  'systemctl start postgresql && systemctl enable postgresql',
  'systemctl start mosquitto && systemctl enable mosquitto',
  'systemctl start nginx && systemctl enable nginx',

  // 9. 創建專案目錄
  'mkdir -p /opt/solarsdgs-iot/{logs,data,backups}',
];

console.log('===================================');
console.log('  Hostinger VPS 依賴安裝腳本');
console.log('===================================');
console.log('');
console.log('此腳本將透過 Hostinger API 在 VPS 上安裝:');
console.log('  • Node.js 20 LTS');
console.log('  • Docker & Docker Compose');
console.log('  • PostgreSQL 16');
console.log('  • MQTT Mosquitto');
console.log('  • Nginx');
console.log('');
console.log('注意: 此為示範腳本');
console.log('實際使用需要透過 Hostinger MCP Server 執行');
console.log('');
console.log('指令列表:');
INSTALL_COMMANDS.forEach((cmd, idx) => {
  console.log(`  ${idx + 1}. ${cmd.substring(0, 80)}${cmd.length > 80 ? '...' : ''}`);
});
console.log('');
console.log('請使用以下方式執行:');
console.log('1. 確保 Claude Code 已重啟並載入 Hostinger MCP');
console.log('2. 要求 Claude 使用 MCP 工具執行安裝');
console.log('');
