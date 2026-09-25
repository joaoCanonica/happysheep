# Happy Sheep Dublin

Código completo da prévia: HTML, CSS, JavaScript e Vite, com imagens, logo e vídeos locais.

## Executar no computador

Instale Node.js LTS com npm. Abra esta pasta no VS Code e execute:

```bash
npm ci
npm run dev
```

Abra o endereço exibido no terminal. Para conferir a versão de produção:

```bash
npm run build
npm run preview
```

## Colocar no GitHub

Extraia o ZIP. A pasta que contém `package.json` é a raiz do projeto. Envie o conteúdo dessa pasta ao repositório, incluindo `public`, `package-lock.json` e `.gitignore`.

Depois de criar um repositório vazio no GitHub, substitua a URL abaixo:

```bash
git init
git add .
git commit -m "feat: add Happy Sheep Dublin website"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

## Publicar na Vercel

Importe seu repositório do GitHub na Vercel.

- Framework Preset: Vite.
- Root Directory: pasta que contém `package.json`.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Variáveis de ambiente: nenhuma necessária.

O arquivo `vercel.json` já define as configurações. A pasta `dist` é gerada durante a publicação.

Documentação: https://vercel.com/docs/frameworks/frontend/vite

## Onde editar

- `index.html`: conteúdo, seções, links e SEO básico.
- `style.css`: visual, animações e responsividade.
- `main.js`: menu, galeria, vídeo e controle de movimentos.
- `public/assets/`: todas as imagens e vídeos usados no site.
- `vite.config.js`: configuração do Vite.
- `package.json` e `package-lock.json`: comandos e dependências.
- `vercel.json`: configuração de publicação.

Os caminhos `/assets/...` são servidos a partir de `public/assets`. Abra o site pelo servidor do Vite, não por duplo clique no HTML.

## Integrações e conteúdo

O cartão-presente abre a página da Square fornecida pelo cliente. O Instagram abre o perfil Happy Sheep Dublin. Não há backend, banco de dados ou credenciais. As fontes DM Sans e DM Serif Display são carregadas do Google Fonts.

A prévia não informa endereços, horários ou preços não confirmados. Imagens e vídeo foram fornecidos pelo cliente. O vídeo tem versões MP4 e WebM e uma imagem de capa.

## Verificação e arquivos gerados

O build e as referências locais foram verificados. A revisão visual interativa em desktop e celular ainda deve ser feita: o navegador do ambiente anterior bloqueou o acesso à prévia.

O ZIP contém código editável e todos os assets do site. `node_modules`, `dist`, histórico Git e configurações internas da hospedagem anterior não são necessários para criar o novo repositório e não estão incluídos.
