#!/usr/bin/env node

/**
 * 測試 Hostinger MCP 是否正常工作
 */

const { spawn } = require('child_process');

console.log('========================================');
console.log('  測試 Hostinger MCP 連接');
console.log('========================================\n');

const API_TOKEN = '5tLzVeaSKiVxW8OsEqRThAoWwf4DlYqpEh2JqL9B2c54ead6';

console.log('1. 啟動 MCP Server...\n');

const mcp = spawn('npx', ['-y', 'hostinger-api-mcp@latest'], {
  env: {
    ...process.env,
    API_TOKEN: API_TOKEN,
    DEBUG: 'true'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

mcp.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('[STDOUT]', text.trim());
});

mcp.stderr.on('data', (data) => {
  const text = data.toString();
  console.log('[STDERR]', text.trim());
});

mcp.on('close', (code) => {
  console.log(`\nMCP Server 結束，代碼: ${code}`);

  if (output.includes('tools')) {
    console.log('\n✅ MCP Server 成功啟動並註冊了工具');
  } else {
    console.log('\n❌ MCP Server 沒有註冊工具');
  }
});

// 發送初始化請求（MCP 協議）
setTimeout(() => {
  console.log('\n2. 發送 MCP initialize 請求...\n');

  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  mcp.stdin.write(JSON.stringify(initRequest) + '\n');

  // 發送 tools/list 請求
  setTimeout(() => {
    console.log('\n3. 請求工具列表...\n');

    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    mcp.stdin.write(JSON.stringify(toolsRequest) + '\n');

    // 5秒後關閉
    setTimeout(() => {
      console.log('\n4. 關閉連接...\n');
      mcp.kill();
    }, 5000);
  }, 2000);
}, 1000);

// 處理錯誤
mcp.on('error', (error) => {
  console.error('❌ 錯誤:', error.message);
  process.exit(1);
});
