# Progresso do Projeto — GIUCAR

## Última atualização
2026-07-17

## O que foi feito nesta rodada

### Backend (NestJS)
- Endpoint `POST /driver/orders/:orderId/reject` criado para permitir rejeição de oferta pelo lavador.
- `DriversService.rejectOrder` implementado, marcando o `DispatchAttempt` como `rejected`.
- Upload de fotos via S3 pré-assinado já estava implementado (`/orders/:orderId/photos/upload-url` e `/save`).

### Flutter — App Cliente
- URL base padrão ajustada para `http://localhost:3000/api/v1`.
- Modelo `OrderStatus` mantido com nomes da UI, mas `.g.dart` atualizado com decoder customizado para os valores reais do backend.
- `OrderRepository.createOrder` converte `serviceIds`/`addressId` para `items`/`serviceAddressId`/`scheduleType` no formato da API.
- Tela `QuoteCheckoutPage` criada com rota `/quote-checkout` para converter cotação em pedido.
- Botão "Continuar para pagamento" adicionado na página de cotação.
- WebSocket ajustado para interpretar mensagens Socket.IO do backend (`status_update`, `location_update`, `eta_update`).

### Flutter — App Lavador
- URL base padrão ajustada para `http://localhost:3000/api/v1`.
- `DriverOrderStatus` sincronizado com valores do backend; `.g.dart` com decoder customizado.
- `DriverOrderRepository` completado:
  - `rejectOrder` chamando endpoint real.
  - `completeOrder`, `updateLocation` (corrigido para `/tracking/orders/:id/location`).
  - `connectTrackingStream` para tracking de pedido ativo.
  - `connectDriverSocket` temporário com ping periódico (backend ainda não tem tópico de driver).
  - `uploadPhoto` implementado com fluxo real de URL pré-assinada.
  - `getChatMessages` e `sendChatMessage` adicionados.
- `DriverOrdersProvider` com fallback de polling de 15s para pedidos disponíveis.

### Admin Web
- URL base corrigida para `http://localhost:3000/api/v1`.

### Documentação / Previews
- `preview_lojista.html` atualizado com tela de cadastro da loja (nome, CNPJ, responsável, plano e logística).
- `QUICKSTART.md` atualizado com instruções de URL base dos apps mobile.

## Pendências para próximas rodadas

1. **Builds reais**
   - `pnpm --filter api build` para validar TypeScript do backend.
   - `flutter pub get` + `build_runner` nos apps para regenerar `.freezed.dart` / `.g.dart`.
   - `pnpm --filter admin-web build` para validar o admin.

2. **Testes de integração**
   - Criar pedido via app cliente (quote → checkout → pagamento).
   - Aceitar pedido pelo app lavador.
   - Verificar tracking e chat em tempo real.
   - Testar upload de fotos before/after.

3. **Backend — notificações do lavador**
   - Implementar tópico WebSocket para notificar lavadores de novas ofertas, eliminando o polling.

4. **Backend / Flutter — rejeição e dispatch**
   - Garantir que o dispatch cria `DispatchAttempt` com status `offered` para que a rejeição funcione.

5. **Infra**
   - Subir stack com Docker Compose (`docker compose --env-file .env.docker up -d --build`).
   - Configurar buckets S3 e credenciais para upload de fotos.

6. **CI/CD**
   - Workflows do GitHub Actions já criados; precisam de secrets (`AWS_*`, registry, etc.).

## Créditos Verdent
- Modo normal ativo; créditos expiram à meia-noite.
- Sugestão: priorizar builds e testes de integração para maximizar o valor antes do reset.


4. **CI/CD**
   - Workflows do GitHub Actions já criados; configurar secrets listados em `docs/CI_SECRETS.md`.

## Créditos Verdent
- Modo normal ativo; créditos expiram à meia-noite.
