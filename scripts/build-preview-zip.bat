@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

set REPO=C:\Users\orlan\Projects\lavagem-domicilio
set SOURCE=%REPO%\apps\preview
set DISTDIR=%REPO%\dist
set OUTPUT=%DISTDIR%\previews.zip

if not exist "%DISTDIR%" mkdir "%DISTDIR%"
if exist "%OUTPUT%" del "%OUTPUT%"

powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%SOURCE%\*' -DestinationPath '%OUTPUT%' -Force; Write-Host ('ZIP gerado em: %OUTPUT%') -ForegroundColor Green"

if errorlevel 1 (
  echo Erro ao criar ZIP.
  exit /b 1
)

echo ZIP gerado: %OUTPUT%
