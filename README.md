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

Para regenerar as fotos otimizadas (AVIF + WebP em 480, 800 e 1200 px):

```bash
npm run media
```

O script `scripts/optimize-media.mjs` lê os originais de `source-media/photos/`, nunca amplia além da largura original e grava em `public/assets/img/` com um `manifest.json` (largura, altura e larguras geradas). Para trocar uma foto, substitua o original em `source-media/photos/` com o mesmo nome, rode `npm run media` e confira width/height no HTML.

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
- `public/assets/img/`: fotos otimizadas, geradas por `npm run media`. Não edite à mão.
- `public/assets/video/`: vídeo do iced latte (WebM + MP4, sem áudio, 720 px) e o poster.
- `public/assets/fonts/`: DM Sans e DM Serif Display (SIL OFL), servidas pelo site para não haver troca de fonte durante o carregamento.
- `public/assets/`: logo e o vídeo Good Vibes. Tudo o que está em `public` vai para o deploy.
- `scripts/optimize-media.mjs`: pipeline de imagens com sharp.
- `source-media/`: material guardado fora do site. Fica fora de `public`, então não vai para o deploy. Veja abaixo.
- `vite.config.js`, `package.json`, `package-lock.json`, `vercel.json`: configuração.

## Pasta `source-media`

Na raiz da pasta ficam arquivos do cliente que **não devem ser usados no site**, guardados só como referência:

- `rainbow-salad.webp` e `SaveClip.App_730532597_…_n.jpg`: a mesma arte de divulgação, com texto embutido. Não é foto.
- `snapinsta-1791860478820.mp4`: o copo mostra o nome antigo da marca.
- `snapinsta-1791860006615.mp4`: vídeo com aparência de gerado por IA.

Não mova nada desta pasta para `public` à mão.

Subpastas:

- `source-media/photos/`: originais das fotos do site, já com nomes descritivos. São a fonte do `npm run media`.
- `source-media/video/iced-latte-pour.mp4`: original do vídeo do iced latte.
- `source-media/pending-owner/`: **dependem de confirmação do dono antes de entrar no site.** `travel-cup-beige.jpg` (copo bege) e `enamel-mug.jpg` (caneca esmaltada) parecem render ou montagem, não foto do produto real.

Cada foto aparece uma vez só no site. A foto do brownie com o café fica só na hero, a caneca Peanuts só em Gifts.

## Integrações

O Instagram abre o perfil @happysheepdublin. Não há backend, banco de dados nem credenciais. As fontes ficam em `public/assets/fonts/`, sem chamadas ao Google Fonts.

O bloco "Your own cup" em Gifts tem um `<!-- TODO -->`: falta o dono confirmar que vende o copo térmico.

Ainda não existem cardápio digital nem fotos das fachadas. As âncoras `#cafes` e `#reviews` do menu serão criadas nas próximas etapas.
