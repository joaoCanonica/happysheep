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

- `index.html`: conteúdo, seções e `<head>`. Os marcadores `<!-- @cafes -->`, `<!-- @faq -->` e `<!-- @jsonld -->` são preenchidos no build; `%SITE_URL%` vira a URL do site.
- `src/data/locations.json`: as duas lojas (endereço, Eircode, coordenadas, place_id, horário em 24h, detalhes, links do Google Maps). **Horário e endereço se mudam só aqui.**
- `src/data/reviews.json`: avaliações do Google, copiadas literalmente dos prints. **Não formatar nem editar** (está no `.prettierignore`). O site usa `ratings` (nota, quantidade, link de avaliar por loja) e `reviews` (`quote`, `name`, `location`, `featured`, `section`). `fullText`, `ownerReply`, `notOnSite` e `factsFromReviews` não vão para o site. Ordem do carrossel: `featured` 1, 2, 3…, depois o resto na ordem do arquivo; quem tem `section` aparece na seção indicada (`gifts`, `cafe-dundrum`, `cafe-terenure`), não no carrossel. As citações em Gifts são escolhidas por id no HTML (`<!-- @quote r18 -->`). Nunca exibir datas, nunca corrigir a ortografia de um quote, nunca usar AggregateRating/Review no JSON-LD.
- `review.html`: página `/review` do QR code do balcão (noindex, fora do sitemap). Leva direto à tela de avaliar de cada loja, sem pedir nota antes, sem filtrar cliente e sem brinde, como exige a política do Google.
- `src/data/faq.json`: perguntas e respostas do FAQ. O mesmo texto vai para a página e para o JSON-LD (FAQPage).
- `scripts/site.config.mjs`: `SITE_URL`. Troque aqui quando houver domínio próprio; canonical, og:url, JSON-LD, robots.txt, sitemap.xml e llms.txt mudam juntos.
- `scripts/site-data-plugin.mjs`: plugin do Vite que lê `src/data/` e escreve no HTML as seções #cafes e #faq e o JSON-LD, e gera `robots.txt`, `sitemap.xml` e `llms.txt` no build (no dev, servidos pelo próprio Vite). Por isso esses três arquivos não ficam em `public/`.
- `style.css`: visual, animações e responsividade.
- `main.js`: menu mobile, galeria, vídeos, revelação ao rolar, botão "Pause animations" e o status "Open now" dos cafés (sempre no fuso Europe/Dublin; sem JS, o card mostra só a tabela).
- `public/assets/img/`: fotos otimizadas, geradas por `npm run media`. Não edite à mão.
- `public/assets/video/`: vídeo do iced latte (WebM + MP4, sem áudio, 720 px) e o poster.
- `public/assets/fonts/`: DM Sans e DM Serif Display (SIL OFL), servidas pelo site para não haver troca de fonte durante o carregamento.
- `public/assets/`: logo e o vídeo Good Vibes. Tudo o que está em `public` vai para o deploy.
- `public/`: favicons (`favicon.svg` vetorizado da ovelha do logo, PNGs 32/48, `apple-touch-icon.png`, ícones 192/512), `site.webmanifest` e `og.jpg` (1200x630, imagem de compartilhamento).
- `scripts/optimize-media.mjs`: pipeline de imagens com sharp.
- `source-media/`: material guardado fora do site. Fica fora de `public`, então não vai para o deploy. Veja abaixo.
- `vite.config.js`, `package.json`, `package-lock.json`, `vercel.json`: configuração.

## QR codes

`public/qr/review-qr.svg` e `public/qr/review-qr.png` (2000 px) apontam para `SITE_URL` + `review`. São gerados no build pelo plugin (pacote `qrcode`), em cor de tinta sobre creme. **São para imprimir e colocar no balcão e nos copos**; o site não linka para eles. Use o SVG na gráfica. Se o `SITE_URL` mudar, rode `npm run build` e reimprima.

## Cache

`vercel.json` manda `/assets/*` com cache de um ano (`immutable`). Os arquivos do Vite têm hash no nome, mas fotos, vídeos e fontes não. **Para trocar uma foto ou vídeo, use um nome de arquivo novo**, ou quem já visitou o site continua vendo a versão antiga.

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
