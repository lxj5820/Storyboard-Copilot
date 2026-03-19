@echo off

echo 🚀 快速测试脚本启动...
echo 项目根目录: %CD%

echo.
echo 📋 快速测试脚本已启动
echo ✅ 正在启动Tauri应用（包含前端开发服务器）...
echo.
echo 💡 提示: 按 Ctrl+C 停止所有服务
echo.

:: 启动Tauri应用
npm run tauri dev

echo.
echo 🖥️ Tauri应用已退出
pause
