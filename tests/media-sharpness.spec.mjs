// Nenhuma foto ou vídeo pode aparecer maior que o arquivo que o navegador
// baixou (seria esticado, ou seja, borrado). Com object-fit: cover conta a
// largura que a imagem ocupa depois do recorte, e transformações de escala
// (zoom, scale) também entram na conta.
import { expect, test } from "@playwright/test";

const WIDTHS = [390, 1440, 1920];

async function loadEverything(page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }",
  });
  // Carrega todas as imagens (inclusive as dos carrosséis, fora da tela) e
  // rola a página inteira, como uma pessoa faria.
  await page.evaluate(() =>
    document.querySelectorAll("img").forEach((img) => (img.loading = "eager")),
  );
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((r) => (img.onload = img.onerror = r)),
      ),
    ),
  );
  // Espera a animação de entrada da hero terminar.
  await page.waitForTimeout(1800);
}

// Mede cada <img> e <video> visível: largura exibida x largura do arquivo.
function measure() {
  const scaleOf = (el) => {
    let scale = 1;
    for (
      let node = el;
      node && node.nodeType === 1;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      if (style.transform && style.transform !== "none") {
        const m = new DOMMatrix(style.transform);
        scale *= Math.hypot(m.a, m.b);
      }
      if (style.scale && style.scale !== "none")
        scale *= parseFloat(style.scale);
    }
    return scale;
  };
  const natural = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  return Promise.all(
    [...document.querySelectorAll("img, video")]
      .filter((el) => el.offsetWidth > 0)
      .map(async (el) => {
        const src =
          el.tagName === "IMG"
            ? el.currentSrc || el.src
            : el.currentSrc || el.poster;
        let size =
          el.tagName === "VIDEO" && el.videoWidth
            ? [el.videoWidth, el.videoHeight]
            : await natural(el.tagName === "IMG" ? src : el.poster);
        if (!size) return { src, error: "não carregou" };
        const [nw, nh] = size;
        const boxW = el.offsetWidth;
        const boxH = el.offsetHeight;
        const fit = getComputedStyle(el).objectFit;
        const shown =
          (fit === "cover" ? Math.max(boxW, (boxH * nw) / nh) : boxW) *
          scaleOf(el);
        const srcset =
          el.closest("picture")?.querySelector("source")?.srcset ?? "";
        const largest = Math.max(
          nw,
          ...[...srcset.matchAll(/(\d+)w/g)].map((m) => Number(m[1])),
        );
        return {
          src: src.split("/").pop(),
          shown: Math.round(shown),
          file: nw,
          largest,
        };
      }),
  );
}

for (const width of WIDTHS) {
  test(`nenhuma mídia ampliada além do arquivo em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await loadEverything(page);
    const media = await page.evaluate(measure);
    const broken = media.filter((m) => m.error || m.shown > m.file + 1);
    expect(broken, JSON.stringify(media, null, 1)).toEqual([]);
  });
}

// Em tela retina (DPR 2) o navegador precisa escolher, pelo sizes, um arquivo
// com o dobro da largura exibida, ou o maior que existir.
for (const width of [390, 1440]) {
  test(`sizes certo em tela retina em ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
    });
    await loadEverything(page);
    const media = await page.evaluate(measure);
    const small = media.filter(
      (m) => !m.error && m.file < Math.min(m.shown * 2, m.largest) * 0.97,
    );
    expect(small, JSON.stringify(media, null, 1)).toEqual([]);
    await page.close();
  });
}
