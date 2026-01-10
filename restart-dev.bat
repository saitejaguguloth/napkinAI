@echo off
REM Quick script to restart the dev server and clear cache

echo 🔄 Restarting Napkin AI...

REM Kill any running Next.js processes
echo Stopping existing server...
taskkill /F /IM node.exe 2>nul

REM Clear Next.js cache
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next

REM Restart the dev server
echo Starting fresh dev server...
npm run dev
