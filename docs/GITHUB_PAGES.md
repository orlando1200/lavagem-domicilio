# Publicar previews no GitHub Pages

Siga estes passos para deixar os previews acessíveis pelo celular via internet.

## 1. Criar branch `gh-pages`

No terminal (com Git instalado):

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio
git checkout --orphan gh-pages
git rm -rf .
cp -r apps/preview/* .
git add .
git commit -m "Deploy previews to GitHub Pages"
git push origin gh-pages
```

## 2. Configurar GitHub Pages

1. No GitHub, vá em **Settings → Pages**.
2. Em **Source**, selecione **Deploy from a branch**.
3. Escolha a branch `gh-pages` e a pasta `/ (root)`.
4. Clique em **Save**.

## 3. Acessar pelo celular

Após alguns minutos, acesse:

```
https://seu-usuario.github.io/lavagem-domicilio/
```

Substitua `seu-usuario` pelo seu nome de usuário do GitHub.

## 4. Atualizar previews

Sempre que quiser atualizar:

```bash
git checkout gh-pages
git rm -rf .
cp -r apps/preview/* .
git add .
git commit -m "Atualiza previews"
git push origin gh-pages
```

## Dica

O arquivo `apps/preview/index.html` já está preparado como landing page com links para todos os previews.

