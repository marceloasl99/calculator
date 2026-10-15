@echo off
title Scientific Calculator Pro
cd /d "%~dp0"
echo ==========================================================
echo Starting Scientific Calculator Pro...
echo ==========================================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Using Node.js server...
  start http://localhost:4173
  node serve.js
  goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Using Python 3 HTTP server...
  start http://localhost:4173
  python -m http.server 4173
  goto end
)

echo Opening standalone edition in default browser...
start standalone.html

:end
