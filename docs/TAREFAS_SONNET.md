# Tarefas para Sonnet — GIUCAR

> Arquivo gerado pelo Manager. Copie cada bloco e cole no Sonnet privado para execução.

---

## Tarefa 1 — Commit e push das alterações pendentes

```text
Faça commit e push de todas as alterações pendentes no repositório C:\Users\orlan\Projects\lavagem-domicilio para a branch main.

Inclua especialmente:
- apps/mobile-driver/assets/images/logo_giucar.png (novo logo)
- services/api/prisma/schema.prisma
- services/api/prisma/migrations/20260803000000_add_auctions_and_driver_profiles/
- services/api/src/modules/auctions/
- services/api/src/modules/drivers/driver-profiles.*
- Ajustes de CI/tsconfig
- docs/FASE9_CORRUPTED_MODULES.md

Use mensagens de commit no padrão convencional (ex: feat:, fix:, chore:, docs:).
Não inclua arquivos em pastas _corrupted-quarantine/ nem o arquivo $null.

Após o push, confirme o link do workflow run de gh-pages e envie de volta.
```

---

## Tarefa 2 — Validar backend (build + testes)

```text
No backend em C:\Users\orlan\Projects\lavagem-domicilio\services\api, execute:

1. pnpm install (ou npm install se package-lock.json estiver ativo)
2. npx prisma generate
3. npx prisma migrate dev --name validate_fase678 (ou prisma db push se ambiente dev)
4. pnpm run build
5. pnpm test

Corrija todos os erros de TypeScript, lint ou teste que aparecerem.
Me retorne:
- Resultado do build (passou/falhou)
- Resultado dos testes (quantos passaram/falharam)
- Erros restantes, se houver
```

---

## Tarefa 3 — Criar módulo de fidelidade (Loyalty / GIUCAR Points)

```text
Crie o módulo loyalty em services/api/src/modules/loyalty/ com:

1. LoyaltyService:
   - awardPoints(orderId): concede 5% do valor pago do pedido em pontos ao cliente.
   - getBalance(userId): retorna saldo disponível (pontos não expirados e não usados).
   - redeemPoints(userId, amount, targetOrderId): aplica pontos como desconto em novo pedido.

2. Controller com endpoints:
   - GET /loyalty/balance
   - POST /loyalty/redeem

3. Job agendado (diário) que marca como expirados pontos com expiresAt < now().

4. Testes unitários para as regras principais.

Use os models existentes do Prisma (LoyaltyPoint, Order, User).
Integre com o fluxo de pagamento: ao confirmar pagamento, chame awardPoints.
```

---

## Tarefa 4 — Tela de leilão no app cliente

```text
No app Flutter apps/mobile-client, crie a tela de leilão InDrive:

1. Lista de serviços pesados (cristalização, polimento, funilaria, tapeçaria, etc).
2. Formulário de solicitação de leilão: veículo, serviço desejado, fotos, endereço, prazo máximo.
3. Tela de ofertas recebidas mostrando:
   - Nome da loja
   - Nota e número de avaliações
   - Preço
   - Prazo de execução
   - Garantia
   - Botão "Aceitar oferta"
4. Estado de leilão vazio/aguardando.

Use mocks de dados se o backend ainda não estiver integrado.
Siga o design system Dark Neon GIUCAR já existente.
```

---

## Tarefa 5 — Tela de leilão no app lojista

```text
No app Flutter apps/mobile-lojista, crie:

1. Aba de leilões abertos com filtros por tipo de serviço e região.
2. Tela de detalhe do leilão com informações do veículo, serviço e fotos.
3. Botão "Enviar oferta" abrindo formulário com:
   - Valor (R$)
   - Prazo de execução (horas/dias)
   - Garantia (dias)
   - Mensagem opcional
   - Fotos de referência
4. Lista de ofertas enviadas com status (pendente, aceita, recusada).

Use mocks se necessário e mantenha o design Dark Neon GIUCAR.
```

---

## Tarefa 6 — Integrar Mercado Pago (sandbox/mock)

```text
Crie o módulo payments em services/api/src/modules/payments/ com:

1. Adapter para Mercado Pago (modo sandbox).
2. Endpoint POST /payments/intent:
   - Recebe orderId e method (pix, credit_card, debit_card, cash, wallet)
   - Retorna dados do pagamento, incluindo QR code para PIX ou token para cartão.
   - Se não houver credenciais configuradas, use mock realista.
3. Webhook POST /payments/webhook:
   - Recebe notificação do Mercado Pago
   - Atualiza status do pedido para paid ou failed
   - Ao confirmar pagamento, chama LoyaltyService.awardPoints
4. Salve transações em uma tabela PaymentTransaction.
5. Testes unitários para os fluxos de sucesso e falha.
```

---

## Tarefa 7 — Integrar Google Maps (distância)

```text
Crie o serviço maps em services/api/src/modules/maps/:

1. Função calculateDistance(originLat, originLng, destLat, destLng):
   - Usa Google Maps Distance Matrix API se GOOGLE_MAPS_API_KEY estiver configurada.
   - Caso contrário, retorna mock baseado em fórmula de Haversine.
2. Função geocodeAddress(address: string) para converter endereço em coordenadas.
3. Use o serviço no matching de lavadores e no cálculo de taxa de entrega.
4. Testes unitários com mock.
```

---

## Tarefa 8 — Limpar arquivos corrompidos em quarentena

```text
Revise as seguintes pastas/arquivos de quarentena em C:\Users\orlan\Projects\lavagem-domicilio:

- apps/admin-web/_corrupted-quarantine/
- apps/mobile-client/_corrupted_quarantine/
- apps/mobile-driver/_corrupted_quarantine/
- services/api/prisma/schema.prisma.corrupted-backup
- arquivo $null na raiz

Para cada um, decida:
(a) pode ser deletado porque já foi substituído
(b) precisa ser recuperado ou revisado
(c) é seguro manter em quarentena

Delete o que for descartável e me envie um resumo das decisões.
```

---

## Tarefa 9 — Atualizar GitHub Pages e verificar novo logo

```text
Após o commit/push da Tarefa 1, verifique:

1. Se o workflow gh-pages rodou com sucesso em https://github.com/orlando1200/lavagem-domicilio/actions/workflows/gh-pages.yml
2. Se o preview do app lavador exibe o novo logo em https://orlando1200.github.io/lavagem-domicilio/preview_driver.html (ou URL equivalente)
3. Se o preview do app cliente ainda está funcionando em https://orlando1200.github.io/lavagem-domicilio/preview_client.html

Me envie os links do workflow run e dos previews atualizados.
```

---

## Tarefa 10 — Documentar progresso

```text
Crie ou atualize o arquivo docs/PROGRESSO.md em C:\Users\orlan\Projects\lavagem-domicilio com:

1. O que foi concluído até agora
2. O que está em andamento
3. O que ainda falta para o MVP
4. Decisões técnicas importantes
5. Bloqueios ou débitos técnicos conhecidos

Use linguagem clara e concisa, em português.
```

---

## Ordem recomendada de execução

1 → 2 → 8 → 3 → 6 → 7 → 4 → 5 → 9 → 10

> Ajuste conforme sua prioridade, mas não pule a validação do backend (Tarefa 2).
