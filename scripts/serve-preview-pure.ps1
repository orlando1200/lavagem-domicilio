# Opcao alternativa se nao tiver Python instalado

$port = 8080
$folder = Join-Path $PSScriptRoot "..\apps\preview"

# Cria um listener HTTP simples
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")
$listener.Start()

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress

Write-Host "Servindo previews em:" -ForegroundColor Green
Write-Host "  Local:   http://localhost:$port" -ForegroundColor Cyan
Write-Host "  Rede:    http://${ip}:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "No celular, acesse http://${ip}:$port" -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para parar." -ForegroundColor Gray

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $rawUrl = $request.RawUrl
    $filePath = Join-Path $folder ($rawUrl -replace '^/', '')
    if ($rawUrl -eq '/') { $filePath = Join-Path $folder 'index.html' }

    if (Test-Path $filePath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = 'text/html'
        if ($filePath -match '\.css$') { $response.ContentType = 'text/css' }
        if ($filePath -match '\.js$') { $response.ContentType = 'application/javascript' }
        if ($filePath -match '\.png$') { $response.ContentType = 'image/png' }
        if ($filePath -match '\.jpg$|\.jpeg$') { $response.ContentType = 'image/jpeg' }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found")
        $response.ContentLength64 = $msg.Length
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.Close()
}

$listener.Stop()

    if ($filePath -match '\.jpg$|\.jpeg$') { $response.ContentType = 'image/jpeg' }
    if ($filePath -match '\.svg$') { $response.ContentType = 'image/svg+xml' }
    $response.ContentLength64 = $content.Length
    $response.OutputStream.Write($content, 0, $content.Length)
  } else {
    $response.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found: $rawUrl")
    $response.ContentLength64 = $msg.Length
    $response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $response.Close()
}

$listener.Stop()

