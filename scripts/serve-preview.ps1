# Servidor local para previews mobile

$port = 8080
$folder = Join-Path $PSScriptRoot "..\apps\preview"

# Verifica se Python está instalado
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command python3 -ErrorAction SilentlyContinue
}

if (-not $python) {
    Write-Host "Python nao encontrado. Instale Python ou use a opcao PowerShell abaixo." -ForegroundColor Red
    exit 1
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress

Write-Host "Servindo previews em:" -ForegroundColor Green
Write-Host "  Local:   http://localhost:$port" -ForegroundColor Cyan
Write-Host "  Rede:    http://${ip}:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "No celular, acesse http://${ip}:$port" -ForegroundColor Yellow
Write-Host ""

Set-Location $folder
& $python.Source -m http.server $port

