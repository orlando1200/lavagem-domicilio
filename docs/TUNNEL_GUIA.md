# Expor previews para internet — ngrok / Cloudflare Tunnel

Use estas opções para visualizar os previews no celular sem publicar no GitHub.

---

## Opção A — ngrok (mais simples)

### 1. Instalar

Baixe em [ngrok.com/download](https://ngrok.com/download) e extraia.

Ou via Chocolatey:

```powershell
choco install ngrok
```

### 2. Criar conta e autenticar

1. Crie conta gratuita em [ngrok.com](https://ngrok.com/).
2. Copie seu token de autenticação.
3. Rode no PowerShell:

```powershell
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### 3. Subir servidor local

Primeiro, inicie o servidor de previews:

```powershell
cd C:\Users\orlan\Projects\lavagem-domicilio
.\scripts\serve-preview.ps1
```

Ou, se preferir sem Python:

```powershell
.\scripts\serve-preview-pure.ps1
```

### 4. Expor com ngrok

Em outro terminal:

```powershell
ngrok http 8080
```

O ngrok mostrará um link público, tipo:

```
https://abc123.ngrok-free.app
```

Acesse esse link no celular.

---

## Opção B — Cloudflare Tunnel (gratuito, sem cadastro extra)

### 1. Instalar cloudflared

Baixe em [developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

Ou via Chocolatey:

```powershell
choco install cloudflared
```

### 2. Subir servidor local

```powershell
cd C:\Users\orlan\Projects\lavagem-domicilio
.\scripts\serve-preview.ps1
```

### 3. Criar tunnel

Em outro terminal:

```powershell
cloudflared tunnel --url http://localhost:8080
```

Cloudflare gerará um link temporário, tipo:

```
https://abc123.trycloudflare.com
```

Acesse pelo celular.

---

## Comparativo

| Opção | Facilidade | URL fixa | Gratuito |
|-------|-----------|----------|----------|
| Servidor local (rede Wi-Fi) | Muito fácil | Sim (IP local) | Sim |
| ngrok | Fácil | Apenas no plano pago | Sim |
| Cloudflare Tunnel | Fácil | Não (muda a cada execução) | Sim |
| GitHub Pages | Médio | Sim | Sim |

---

## Recomendação

- Para testes rápidos: **ngrok** ou **Cloudflare Tunnel**.
- Para URL fixa e compartilhável: **GitHub Pages**.
- Para testar só na sua rede Wi-Fi: **servidor local**.

