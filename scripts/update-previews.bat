@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

set SCRIPT_DIR=C:\Users\orlan\Projects\lavagem-domicilio\scripts\
cd /d C:\Users\orlan\Projects\lavagem-domicilio

echo =========================================
echo  Atualizando previews no GitHub Pages
echo =========================================
echo.

call "%SCRIPT_DIR%build-preview-zip.bat"
if errorlevel 1 (
  echo Erro ao gerar ZIP.
  pause
  exit /b 1
)

echo.
call "%SCRIPT_DIR%deploy-github-pages.bat"
if errorlevel 1 (
  echo Erro no deploy.
  pause
  exit /b 1
)

echo.
echo =========================================
echo  Processo finalizado!
echo =========================================
pause
