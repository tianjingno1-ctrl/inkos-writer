@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装 Node.js 20 或更高版本。
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [提示] 首次运行，正在安装依赖...
  where pnpm >nul 2>&1
  if errorlevel 1 (
    echo [错误] 未找到 pnpm，请先执行: npm install -g pnpm
    pause
    exit /b 1
  )
  call pnpm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败。
    pause
    exit /b 1
  )
)

echo [提示] 正在构建 InkOS Core（确保与源码同步）...
call pnpm --filter @actalk/inkos-core build
if errorlevel 1 (
  echo [错误] Core 构建失败，请手动执行: pnpm --filter @actalk/inkos-core build
  pause
  exit /b 1
)

if not exist "packages\cli\dist\index.js" (
  echo [提示] 正在构建 InkOS CLI...
  call pnpm --filter @actalk/inkos build
  if errorlevel 1 (
    echo [错误] CLI 构建失败，请手动执行: pnpm --filter @actalk/inkos build
    pause
    exit /b 1
  )
)

netstat -ano | findstr ":4567" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo [提示] 端口 4567 已被占用，InkOS 可能已在后台运行。
  echo 请直接在浏览器打开: http://localhost:4567
  echo 若页面打不开，请先关闭之前的 InkOS 命令行窗口后重试。
  echo.
  pause
  exit /b 0
)

echo.
echo 正在启动 InkOS Studio...
echo 地址: http://localhost:4567
echo 关闭此窗口即可停止服务。
echo.

node "packages\cli\dist\index.js" studio
if errorlevel 1 pause
