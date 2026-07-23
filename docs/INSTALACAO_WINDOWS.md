# Instalação Local do Ambiente — Windows

Este guia ensina a instalar Node.js, pnpm e Flutter no Windows para conseguir rodar os builds e testes do projeto GIUCAR localmente.

---

## 1. Node.js + pnpm

### Opção A — Instalador oficial (mais fácil)

1. Acesse [nodejs.org](https://nodejs.org/).
2. Baixe a versão **LTS** (recomendada, ex: 20.x).
3. Execute o instalador `.msi` e siga os passos.
4. Reinicie o terminal/prompt de comando.
5. Verifique:

```powershell
node -v    # deve mostrar v20.x.x
npm -v     # deve mostrar 10.x.x
```

### Opção B — Usando Chocolatey

Se você já tem o Chocolatey instalado:

```powershell
choco install nodejs
```

### Instalar pnpm

Com o Node.js instalado, execute no PowerShell:

```powershell
npm install -g pnpm
```

Verifique:

```powershell
pnpm -v    # deve mostrar 9.x.x
```

---

## 2. Flutter

### Passo 1 — Baixar o SDK

1. Acesse [docs.flutter.dev/get-started/install/windows/mobile](https://docs.flutter.dev/get-started/install/windows/mobile).
2. Baixe o arquivo `.zip` do Flutter SDK estável.
3. Extraia para uma pasta fixa, por exemplo:

```
C:\dev\flutter
```

### Passo 2 — Adicionar ao PATH

1. Abra o menu Iniciar e digite `variáveis de ambiente`.
2. Clique em **Editar as variáveis de ambiente do sistema**.
3. Clique em **Variáveis de Ambiente...**.
4. Em **Variáveis do usuário**, procure a variável `Path` e clique em **Editar...**.
5. Clique em **Novo** e adicione:

```
C:\dev\flutter\bin
```

6. Confirme todas as janelas.

### Passo 3 — Verificar instalação

Feche e reabra o PowerShell, depois rode:

```powershell
flutter doctor
```

Esse comando mostra o que ainda falta (geralmente Android Studio, SDK do Android, Git).

### Passo 4 — Instalar Android Studio (obrigatório para buildar apps)

1. Baixe em [developer.android.com/studio](https://developer.android.com/studio).
2. Durante a instalação, deixe marcado:
   - Android SDK
   - Android SDK Command-line Tools
   - Android Virtual Device (AVD)
3. Após instalar, rode no PowerShell:

```powershell
flutter doctor --android-licenses
```

Aceite todas as licenças digitando `y`.

### Passo 5 — Instalar Git para Windows

1. Baixe em [git-scm.com/download/win](https://git-scm.com/download/win).
2. Instale com as opções padrão.
3. Verifique:

```powershell
git --version
```

---

## 3. Verificar tudo

Depois de tudo instalado, rode:

```powershell
node -v
pnpm -v
flutter doctor
```

---

## 4. Rodar builds do projeto

### Backend

```powershell
cd C:\Users\orlan\Projects\lavagem-domicilio
pnpm install
pnpm --filter api build
```

### Admin Web

```powershell
pnpm --filter admin-web build
```

### Apps Flutter

```powershell
cd apps\mobile-client
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

Repita para `apps\mobile-driver`.

---

## 5. Subir stack com Docker

Se você tiver o Docker Desktop instalado:

```powershell
cd C:\Users\orlan\Projects\lavagem-domicilio
docker compose --env-file .env.docker up -d --build
```

Acesse:
- API: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- Swagger: [http://localhost:3000/docs](http://localhost:3000/docs)
- Admin Web: [http://localhost:3003](http://localhost:3003)
- Postgres: `localhost:5432`

---

## Dicas

- Sempre abra um novo PowerShell/VS Code depois de alterar o `PATH`.
- Se o `flutter doctor` reclamar do Android SDK, verifique se a variável `ANDROID_HOME` está configurada.
- Para builds mais rápidos no Windows, use o VS Code com as extensões do Flutter e Dart.

## Links úteis

- [Node.js downloads](https://nodejs.org/)
- [pnpm installation](https://pnpm.io/installation)
- [Flutter install Windows](https://docs.flutter.dev/get-started/install/windows/mobile)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Extra — Servir previews no celular (rede local)

Se você quiser visualizar os previews do `apps/preview` no celular:

1. Certifique-se de que Python ou PowerShell funciona.
2. Rode um dos comandos:

```powershell
# Com Python
.\scripts\serve-preview.ps1

# Sem Python (apenas PowerShell)
.\scripts\serve-preview-pure.ps1

# Ou o arquivo batch (mais facil no Windows)
.\scripts\serve-preview.bat
```

3. No celular, conectado na mesma rede Wi-Fi, acesse o IP do computador na porta `8080`.

Mais detalhes em `docs/TUNNEL_GUIA.md` e `docs/GITHUB_PAGES.md`.


