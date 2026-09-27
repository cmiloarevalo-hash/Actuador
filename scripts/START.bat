@echo off
setlocal
cd /d "%~dp0\.."

if not exist "node_modules" (
  echo Dependencies are missing. Run npm ci first.
  exit /b 1
)

if "%ACTUATOR_CONFIG%"=="" (
  if exist "config\actuator.config.local.json" (
    set "ACTUATOR_CONFIG=config\actuator.config.local.json"
  ) else (
    set "ACTUATOR_CONFIG=config\actuator.config.json"
  )
)

call npm run build
if errorlevel 1 exit /b %errorlevel%

node dist\src\main.js
set "ACTUATOR_EXIT=%errorlevel%"
endlocal & exit /b %ACTUATOR_EXIT%
