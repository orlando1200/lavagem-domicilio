# Tarefas Fase 2 — Sonnet GIUCAR

> Arquivo gerado pelo Manager. Copie cada bloco e cole no Sonnet privado para execução.

---

## Tarefa A — Limpar arquivos que não devem ser versionados

```text
Remova do repositório (não versione) os seguintes arquivos/pastas em C:\Users\orlan\Projects\lavagem-domicilio:

- node_modules/
- services/api/package-lock.json
- services/coverage/
- $null (arquivo lixo na raiz)

Atualize o .gitignore para incluir:
node_modules/
services/coverage/
*.log
$null
package-lock.json
services/api/package-lock.json

Se o projeto usa pnpm, package-lock.json não deve existir.

Depois faça commit com mensagem:
chore: limpa arquivos que não devem ser versionados
```

---

## Tarefa B — Resolver falha do CI no Linux

```text
O CI no GitHub Actions está falhando em Linux, mas localmente (Windows) tudo passa.

Passos:
1. Cole aqui o log completo da action que falhou.
2. Verifique se .github/workflows/ci.yml usa a mesma versão de pnpm e Node que você testou localmente.
3. Verifique se há conflito entre package-lock.json e pnpm-lock.yaml no runner Linux.
4. Verifique se alguma variável de ambiente ou PATH difere entre Windows e Linux.
5. Corrija o workflow ou o código conforme o log indicar.

Se precisar, rode localmente com a flag exata do CI:
pnpm --filter api test --coverage
```

---

## Tarefa C — Atualizar previews HTML e disparar GitHub Pages

```text
O workflow gh-pages só dispara quando há mudanças em apps/preview/**.

Faça:
1. Atualize apps/preview/preview_driver.html para refletir o novo logo do app lavador.
2. Atualize apps/preview/preview_client.html se houver telas novas do leilão ou loja.
3. Atualize apps/preview/preview_lojista.html se houver telas novas.
4. Atualize apps/preview/preview_admin.html se necessário.
5. Faça commit e push para disparar o workflow gh-pages.
6. Confirme o novo run em https://github.com/orlando1200/lavagem-domicilio/actions/workflows/gh-pages.yml
7. Me envie os links dos previews atualizados.
```

---

## Tarefa D — Verificar integrações reais (mock → sandbox)

```text
Os módulos payments e maps estão em modo mock. Faça:

1. Verifique se há .env.example no projeto. Se não houver, crie um com:
   - MERCADO_PAGO_ACCESS_TOKEN
   - MERCADO_PAGO_PUBLIC_KEY
   - GOOGLE_MAPS_API_KEY
   - DATABASE_URL

2. No módulo payments (services/api/src/modules/payments/), adicione lógica para:
   - Usar Mercado Pago real quando as chaves estiverem configuradas
   - Cair para mock quando não estiverem
   - Logar claramente qual modo está ativo

3. No módulo maps (services/api/src/modules/maps/), faça o mesmo para Google Maps.

4. Crie pelo menos um teste que valide o fallback para mock quando a chave não existe.

Se você não tiver as chaves reais ainda, deixe documentado em docs/PROGRESSO.md.
```

---

## Tarefa E — Documentar progresso

```text
Crie ou atualize C:\Users\orlan\Projects\lavagem-domicilio\docs\PROGRESSO.md com:

1. O que foi concluído (módulos backend, telas Flutter, etc.)
2. O que está em modo mock/pendente de chaves reais
3. Decisões técnicas importantes (por que pnpm, por que mock, etc.)
4. Bloqueios atuais (CI Linux, chaves de API, Docker/Postgres local)
5. Próximos passos sugeridos

Use português, linguagem clara e concisa.
```

---

## Ordem recomendada de execução

A → B → C → D → E

> Não pule a Tarefa A: arquivos como node_modules e package-lock.json podem estar causando o problema do CI.
