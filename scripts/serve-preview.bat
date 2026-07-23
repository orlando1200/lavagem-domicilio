@echo off
chcp 65001 > nul
set PORT=8080
set FOLDER=C:\Users\orlan\Projects\lavagem-domicilio\apps\preview

echo =========================================
echo  GIUCAR - Servidor Local de Previews
echo =========================================
echo.
echo Porta: %PORT%
echo Pasta: %FOLDER%
echo.

powershell -ExecutionPolicy Bypass -Command "
  $port = %PORT%;
  $folder = '%FOLDER%';
  $listener = New-Object System.Net.HttpListener;
  $listener.Prefixes.Add('http://localhost:' + $port + '/');
  $listener.Start();
  Write-Host 'Servidor rodando em:' -ForegroundColor Green;
  Write-Host ('  http://localhost:' + $port) -ForegroundColor Cyan;
  Write-Host '';
  Write-Host 'No celular (mesma Wi-Fi), use o IP do computador:' -ForegroundColor Yellow;
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress;
  if ($ip) { Write-Host ('  http://' + $ip + ':' + $port) -ForegroundColor Cyan; }
  Write-Host '';
  Write-Host 'Pressione Ctrl+C para parar.' -ForegroundColor Gray;
  while ($true) {
    $c = $listener.GetContext();
    $r = $c.Request;
    $res = $c.Response;
    $fp = Join-Path $folder ($r.RawUrl -replace '^/', '');
    if ($r.RawUrl -eq '/' -or $r.RawUrl -eq '') { $fp = Join-Path $folder 'index.html'; }
    if (Test-Path $fp -PathType Leaf) {
      $b = [System.IO.File]::ReadAllBytes($fp);
      $res.ContentType = 'text/html';
      if ($fp -match '\.css$') { $res.ContentType = 'text/css'; }
      if ($fp -match '\.js$') { $res.ContentType = 'application/javascript'; }
      if ($fp -match '\.png$') { $res.ContentType = 'image/png'; }
      if ($fp -match '\.jpg$|\.jpeg$') { $res.ContentType = 'image/jpeg'; }
      $res.ContentLength64 = $b.Length;
      $res.OutputStream.Write($b, 0, $b.Length);
    } else {
      $res.StatusCode = 404;
      $m = [System.Text.Encoding]::UTF8.GetBytes('404: ' + $r.RawUrl);
      $res.ContentLength64 = $m.Length;
      $res.OutputStream.Write($m, 0, $m.Length);
    }
    $res.Close();
  }
"

