#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🚀 快速测试脚本启动...');
console.log('项目根目录:', projectRoot);

// 直接启动Tauri应用（它会自动启动前端开发服务器）
const tauriApp = spawn('npm', ['run', 'tauri', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

tauriApp.on('error', (error) => {
  console.error('❌ 启动Tauri应用失败:', error);
  process.exit(1);
});

tauriApp.on('exit', (code) => {
  console.log(`\n🖥️ Tauri应用退出，代码: ${code}`);
  process.exit(code);
});

// 处理Ctrl+C信号
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止服务...');
  tauriApp.kill();
  process.exit(0);
});

console.log('\n📋 快速测试脚本已启动');
console.log('✅ 正在启动Tauri应用（包含前端开发服务器）...');
console.log('\n💡 提示: 按 Ctrl+C 停止所有服务');
