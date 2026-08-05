# Tarefas Fase 3 — Sonnet GIUCAR

> Arquivo gerado pelo Manager. Copie cada bloco e cole no Sonnet privado para execução.

---

## Tarefa 1 — Fechar CI no Linux

```text
A CI no Linux ainda está falhando e você não consegue reproduzir em Windows.

Ação:
1. Acesse https://github.com/orlando1200/lavagem-domicilio/actions/runs/31039056119/job/92401386683
2. Clique na seção que falha (provavelmente "Unit tests").
3. Copie o log completo dessa seção.
4. Cole o log aqui.

Com base no log, corrija o código ou o workflow .github/workflows/ci.yml.
Rode localmente pnpm --filter api test -- --ci --coverage novamente para confirmar que não quebrou.
Faça commit e push da correção.
```

---

## Tarefa 2 — Confirmar deploy do GitHub Pages

```text
O workflow gh-pages foi disparado em https://github.com/orlando1200/lavagem-domicilio/actions/runs/31040291836

Ação:
1. Confirme se terminou com sucesso.
2. Abra https://orlando1200.github.io/lavagem-domicilio/preview_driver.html
3. Teste o link "Cadastrar minha Loja" / #cadastro-loja para ver se a nova tela aparece.
4. Verifique se nenhum outro preview quebrou:
   - preview_client.html
   - preview_lojista.html
   - preview_admin.html
5. Me envie os links e confirme se está tudo OK.
```

---

## Tarefa 3 — Preparar variáveis de ambiente para integrações

```text
Prepare o backend para receber chaves reais de sandbox no futuro.

Ação:
1. Em services/api/, verifique se existe .env.example. Se não existir, crie com:
   DATABASE_URL=postgresql://user:pass@localhost:5432/giucar
   MERCADO_PAGO_ACCESS_TOKEN=
   MERCADO_PAGO_PUBLIC_KEY=
   GOOGLE_MAPS_API_KEY=
   JWT_SECRET=dev_secret
   PORT=3333

2. Confirme que .env.local e .env estão no .gitignore.

3. Nos módulos payments e maps, garanta que:
   - Se a chave não estiver configurada, o sistema usa mock automaticamente
   - Se a chave estiver configurada, o sistema usa a API real
   - Um log no startup indica qual modo está ativo (MOCK ou REAL)

4. Se você tiver conta de sandbox no Mercado Pago ou Google Cloud, insira as chaves em services/api/.env.local (não commite) e teste uma chamada real.

Se não tiver as contas, apenas documente no PROGRESSO.md que está pendente.
```

---

## Tarefa 4 — Testes de fallback para mock

```text
Garanta que payments e maps não quebram quando as chaves estão ausentes.

Ação:
1. No módulo payments, crie/verifique um teste que:
   - Remove a variável MERCADO_PAGO_ACCESS_TOKEN
   - Chama createPaymentIntent
   - Confirma que retorna dados mock e não dispara erro

2. No módulo maps, crie/verifique um teste que:
   - Remove a variável GOOGLE_MAPS_API_KEY
   - Chama calculateDistance
   - Confirma que retorna distância calculada por Haversine ou mock

3. Rode pnpm --filter api test e confirme que todos passam.
```

---

## Tarefa 5 — Decidir estratégia de previews HTML

```text
Defina a política dos previews HTML.

Opção A: Manter mockups manuais, atualizando apenas quando houver mudança grande de fluxo.
Opção B: No futuro, gerar previews automaticamente a partir das telas Flutter (não fazer agora).

Ação:
1. Escolha A ou B.
2. Documente a decisão em docs/PROGRESSO.md.
3. Se escolher A, verifique se todos os previews atuais estão consistentes com os fluxos reais.
```

---

## Tarefa 6 — Revisar e consolidar PROGRESSO.md

```text
Revise docs/PROGRESSO.md e garanta que esteja atualizado com:

1. O que foi concluído nesta rodada (Tarefas A, C, E da Fase 2)
2. O que está bloqueado (CI Linux, chaves de API)
3. Decisões: previews manuais, mock vs real, pnpm como gerenciador
4. Próximos passos claros

Se houver informações desatualizadas ou confusas, corrija.
```

---

## Ordem recomendada de execução

1 → 2 → 3 → 4 → 5 → 6

> A prioridade máxima é a Tarefa 1 (CI Linux). Sem ela, todo push pode falhar.
