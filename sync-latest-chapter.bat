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

if not exist "packages\cli\dist\index.js" (
  echo [提示] 正在构建 InkOS CLI...
  call pnpm --filter @actalk/inkos-core build
  call pnpm --filter @actalk/inkos build
  if errorlevel 1 (
    echo [错误] 构建失败，请手动执行: pnpm build
    pause
    exit /b 1
  )
)

echo.
echo ========================================
echo   InkOS 最新章同步
echo   外部改稿后运行，更新 story 状态层
echo ========================================
echo.

node "scripts\sync-latest-chapter.mjs" "%CD%" %*
set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE% equ 0 (
  echo [完成] 最新章状态已同步，可以继续写下一章。
) else (
  echo [失败] 同步未完成，请查看上方错误信息。
)
echo.
pause
exit /b %EXIT_CODE%
