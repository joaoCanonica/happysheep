# Happy Sheep Dublin

Site da Happy Sheep Dublin, cafeteria independente com duas lojas em Dublin (Dundrum e Terenure). HTML, CSS e JavaScript puros, empacotados com Vite e publicados na Vercel em https://happysheep-sage.vercel.app.

## Executar no computador

Instale Node.js LTS com npm e rode na raiz do projeto:

```bash
npm ci
npm run dev
```

Para conferir a versão de produção:

```bash
npm run build
npm run preview
```

Para formatar o código com Prettier:

```bash
npm run format
```

## Publicação na Vercel

Cada push na branch `main` gera um deploy. As configurações ficam em `vercel.json`:

- Framework Preset: Vite.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Variáveis de ambiente: nenhuma.

## Estrutura

- `index.html`: conteúdo, seções, links e SEO básico.
- `style.css`: visual, animações e responsividade.
- `main.js`: menu mobile, galeria, vídeo, revelação ao rolar e botão "Pause animations" no rodapé.
- `public/assets/`: imagens e vídeos usados no site. Os caminhos `/assets/...` no HTML apontam para cá.
- `public/`: outros arquivos enviados pelo cliente. Tudo o que está em `public` vai para o deploy.
- `source-media/`: material guardado fora do site. Fica fora de `public`, então não vai para o deploy. Veja abaixo.
- `vite.config.js`, `package.json`, `package-lock.json`, `vercel.json`: configuração.

## Pasta `source-media`

Arquivos do cliente que **não devem ser usados no site**, guardados só como referência:

- `rainbow-salad.webp` e `SaveClip.App_730532597_…_n.jpg`: a mesma arte de divulgação, com texto embutido. Não é foto.
- `snapinsta-1791860478820.mp4`: o copo mostra o nome antigo da marca.
- `snapinsta-1791860006615.mp4`: vídeo com aparência de gerado por IA.

Não mova nada desta pasta para `public`.

## Integrações

O Instagram abre o perfil @happysheepdublin. Não há backend, banco de dados nem credenciais. As fontes DM Sans e DM Serif Display vêm do Google Fonts.

Ainda não existem cardápio digital nem fotos das fachadas. As âncoras `#cafes` e `#reviews` do menu serão criadas nas próximas etapas.
