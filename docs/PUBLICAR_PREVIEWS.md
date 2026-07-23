# Publicar previews na internet

Siga este guia para gerar um link acessível pelo celular sempre que quiser.

---

## Opção 1 — GitHub Pages (recomendada, URL fixa)

### Requisitos

- Conta no GitHub.
- Repositório `lavagem-domicilio` já criado no GitHub.
- Git instalado no Windows.

### Primeira configuração no GitHub

1. Acesse `https://github.com/seu-usuario/lavagem-domicilio`.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha **Deploy from a branch**.
4. Selecione a branch `gh-pages` e pasta `/ (root)`.
5. Clique em **Save**.

### Sempre que quiser atualizar

Basta executar no Windows:

```batch
.\scripts\update-previews.bat
```

Esse script faz tudo automaticamente:
- Gera o ZIP dos previews.
- Publica na branch `gh-pages`.
- Volta para a branch original.

### Link para o celular

```
https://seu-usuario.github.io/lavagem-domicilio/
```

---

## Opção 2 — Netlify Drop (mais rápida, URL temporária)

### Sempre que quiser atualizar

1. Execute:

```batch
.\scripts\build-preview-zip.bat
```

2. Vá para [app.netlify.com/drop](https://app.netlify.com/drop).
3. Arraste o arquivo `dist/previews.zip` para a área indicada.
4. Netlify gera um link tipo:

```
https://abc123.netlify.app
```

5. Envie o link para o celular.

---

## Opção 3 — ZIP manual

Se quiser hospedar em outro lugar:

```batch
.\scripts\build-preview-zip.bat
```

O arquivo `dist/previews.zip` conterá todos os previews atualizados.

---

## Resumo dos scripts

| Script | Função |
|--------|--------|
| `scripts/build-preview-zip.bat` | Gera `dist/previews.zip` com os previews atualizados. |
| `scripts/deploy-github-pages.bat` | Publica os previews na branch `gh-pages`. |
| `scripts/update-previews.bat` | Gera ZIP e publica no GitHub Pages de uma vez. |

---

## Dica

Sempre que fizer alterações nos arquivos de preview (`apps/preview/*.html`), execute `update-previews.bat` para atualizar o link online.

