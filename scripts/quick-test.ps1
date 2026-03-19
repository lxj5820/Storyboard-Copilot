Write-Host "🚀 快速测试脚本启动..." -ForegroundColor Green
Write-Host "项目根目录: $PWD" -ForegroundColor Cyan

Write-Host "`n📋 快速测试脚本已启动" -ForegroundColor Yellow
Write-Host "✅ 正在启动Tauri应用（包含前端开发服务器）..." -ForegroundColor Green
Write-Host "`n💡 提示: 按 Ctrl+C 停止所有服务" -ForegroundColor Magenta
Write-Host ""

# 启动Tauri应用
npm run tauri dev

Write-Host "`n🖥️ Tauri应用已退出" -ForegroundColor Yellow
Read-Host "按Enter键退出..."
