// Gera o logo com fundo transparente a partir de source-media/logo.jpg (150px).
// Só o fundo vira transparente: pixels claros ligados à borda da imagem (flood
// fill) e as áreas claras fechadas da metade de baixo (entre as pernas, dentro
// do "D" de Dublin). As áreas claras fechadas da cabeça (rosto, alça da
// xícara, coração) continuam preenchidas em creme. Borda suave: o alfa sai da luminância e a
// cor da borda é preta pura, então não sobra halo claro.
// Uso: node scripts/make-logo.mjs
import sharp from "sharp";

const SRC = "source-media/logo.jpg";
const OUT = "public/assets";
const BG = 236; // creme do fundo do jpg
const INK = 30; // preto do logo
const PAPER = [0xf5, 0xef, 0xd9];

async function build(scale) {
  const size = 150 * scale;
  const { data } = await sharp(SRC)
    .resize(size, size, { kernel: "lanczos3" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const light = (i) => data[i] > 200;
  // Flood fill do fundo a partir das bordas.
  const outside = new Uint8Array(size * size);
  const stack = [];
  for (let i = 0; i < size; i++) {
    stack.push(i, (size - 1) * size + i, i * size, i * size + size - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    if (outside[i] || !light(i)) continue;
    outside[i] = 1;
    const x = i % size;
    if (x > 0) stack.push(i - 1);
    if (x < size - 1) stack.push(i + 1);
    if (i >= size) stack.push(i - size);
    if (i < size * (size - 1)) stack.push(i + size);
  }
  // Áreas claras fechadas: as da metade de baixo também são fundo.
  const seen = new Uint8Array(size * size);
  for (let start = 0; start < size * size; start++) {
    if (seen[start] || outside[start] || !light(start)) continue;
    const region = [];
    const todo = [start];
    seen[start] = 1;
    while (todo.length) {
      const i = todo.pop();
      region.push(i);
      const x = i % size;
      for (const n of [
        x > 0 && i - 1,
        x < size - 1 && i + 1,
        i - size,
        i + size,
      ]) {
        if (n === false || n < 0 || n >= size * size) continue;
        if (!seen[n] && !outside[n] && light(n)) {
          seen[n] = 1;
          todo.push(n);
        }
      }
    }
    const centreY =
      region.reduce((sum, i) => sum + ((i / size) | 0), 0) / region.length;
    if (centreY > size * 0.5) region.forEach((i) => (outside[i] = 1));
  }
  // Pixels de borda: vizinhos (raio 2) do fundo.
  const nearOutside = (i) => {
    const x = i % size;
    const y = (i / size) | 0;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < size &&
          ny < size &&
          outside[ny * size + nx]
        )
          return true;
      }
    return false;
  };
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const t = Math.max(0, Math.min(1, (data[i] - INK) / (BG - INK)));
    if (outside[i] || nearOutside(i)) {
      // Fundo e borda externa: preto com alfa pela escuridão.
      px[i * 4 + 3] = Math.round((1 - t) * 255);
    } else {
      // Dentro do desenho: preto misturado ao creme do site, opaco.
      PAPER.forEach((c, k) => (px[i * 4 + k] = Math.round(c * t)));
      px[i * 4 + 3] = 255;
    }
  }
  const img = sharp(px, { raw: { width: size, height: size, channels: 4 } });
  const name = scale === 1 ? "logo-clear" : `logo-clear@${scale}x`;
  await img.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
  await img
    .clone()
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${OUT}/${name}.webp`);
}

await build(1);
await build(2);
