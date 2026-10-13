// Gera AVIF + WebP responsivos das fotos do site.
// Fonte: source-media/photos/ (fora do deploy). Saída: public/assets/img/;
// width/height de cada foto em src/data/images.json.
// Uso: npm run media
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "source-media/photos";
const OUT = "public/assets/img";
const WIDTHS = [480, 800, 1200];

// trim: pixels do original a cortar à direita e embaixo (texto escrito na foto,
// ícones do Instagram que vieram no print).
const PHOTOS = [
  { name: "coffee-brownie", file: "coffee-brownie.webp" },
  { name: "espresso", file: "espresso.webp" },
  { name: "peanuts", file: "peanuts.webp", trim: { bottom: 50 } },
  {
    name: "iced-latte",
    file: "iced-latte.webp",
    trim: { right: 37, bottom: 40 },
  },
  { name: "brookie-counter", file: "brookie-counter.jpg" },
  { name: "cup-in-hand", file: "cup-in-hand.jpg" },
  { name: "lunch-outside", file: "lunch-outside.jpg" },
  { name: "brookies-tray", file: "brookies-tray.jpg", trim: { bottom: 191 } },
  { name: "tote-window", file: "tote-window.jpg" },
  { name: "takeaway-window", file: "takeaway-window.jpg" },
];

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const photo of PHOTOS) {
  let base = sharp(path.join(SRC, photo.file)).rotate();
  let { width, height } = await base.metadata();
  if (photo.trim) {
    width -= photo.trim.right ?? 0;
    height -= photo.trim.bottom ?? 0;
    base = sharp(
      await base.extract({ left: 0, top: 0, width, height }).toBuffer(),
    );
  }

  // Nunca amplia: usa só larguras menores que o original, mais o original.
  const widths = WIDTHS.filter((w) => w < width);
  if (widths.length < WIDTHS.length) widths.push(width);

  for (const w of widths) {
    const resized = base.clone().resize({ width: w });
    await resized
      .clone()
      .avif({ quality: 50, effort: 4 })
      .toFile(`${OUT}/${photo.name}-${w}.avif`);
    await resized
      .clone()
      .webp({ quality: 74, effort: 6 })
      .toFile(`${OUT}/${photo.name}-${w}.webp`);
  }

  manifest[photo.name] = { width, height, widths };
  console.log(photo.name, `${width}x${height}`, widths.join(", "));
}

await writeFile(
  "src/data/images.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
