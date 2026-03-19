# Storyboard Copilot - 快速启动脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Storyboard Copilot - 快速启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查端口是否被占用
$portCheck = netstat -ano | Select-String ":1420.*LISTENING"
if ($portCheck) {
    Write-Host "[警告] 端口 1420 已被占用，尝试终止..." -ForegroundColor Yellow
    $pid = ($portCheck -split "\s+")[-1]
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "[1] 启动 Tauri 开发模式 (推荐)" -ForegroundColor Green
Write-Host "[2] 启动前端开发模式" -ForegroundColor Green
Write-Host "[3] 仅启动后端 Rust" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "请选择 (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "启动 Tauri 开发模式..." -ForegroundColor Cyan
        Write-Host ""
        npm run tauri dev
    }
    "2" {
        Write-Host ""
        Write-Host "启动前端开发模式..." -ForegroundColor Cyan
        Write-Host ""
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "启动后端 Rust..." -ForegroundColor Cyan
        Write-Host ""
        cd src-tauri
        cargo run
    }
}
