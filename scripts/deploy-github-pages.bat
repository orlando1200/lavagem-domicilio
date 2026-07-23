@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

set REPO=C:\Users\orlan\Projects\lavagem-domicilio
set PREVIEWS=%REPO%\apps\preview
set DEPLOY_DIR=%REPO%\.deploy-gh-pages
set REMOTE_URL=https://github.com/orlando1200/lavagem-domicilio.git

cd /d "%REPO%"

echo =========================================
echo  Deploy dos previews no GitHub Pages
echo =========================================
echo.

git --version > nul 2>&1
if errorlevel 1 (
  echo Git nao encontrado. Instale o Git primeiro.
  pause
  exit /b 1
)

for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%a
echo Branch atual: %CURRENT_BRANCH%
echo.

REM Limpa deploy anterior
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"

REM Inicializa repo temporal y copia previews
cd /d "%DEPLOY_DIR%"
git init > nul
git remote add origin "%REMOTE_URL%"
git checkout -b gh-pages > nul 2>&1

xcopy /s /e /y "%PREVIEWS%\*" "%DEPLOY_DIR%\" > nul

REM Crea .nojekyll
echo. > "%DEPLOY_DIR%\.nojekyll"

git add .
git commit -m "Atualiza previews - %date% %time%" > nul 2>&1

git push origin gh-pages --force
if errorlevel 1 (
  echo Erro ao fazer push. Verifique sua conexao e permissao no repositorio.
  cd /d "%REPO%"
  rmdir /s /q "%DEPLOY_DIR%"
  pause
  exit /b 1
)

cd /d "%REPO%"
rmdir /s /q "%DEPLOY_DIR%"
git checkout %CURRENT_BRANCH% > nul 2>&1

echo.
echo =========================================
echo  Deploy concluido!
echo =========================================
echo.
echo Acesse: https://orlando1200.github.io/lavagem-domicilio/
echo.
pause
