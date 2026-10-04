// Bereitet die Original-Grafiken aus assets-src/ für die App auf:
//   - Karten:  weißen Rand + Schlagschatten entfernen (transparent), zuschneiden, WebP
//   - Logo:    weißen Hintergrund entfernen, beigen Schatten in dunklen Schatten umwandeln, WebP
//   - Hintergrund: als WebP komprimieren
// Aufruf: npm run images
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const src = (...p) => join(root, 'assets-src', ...p);
const out = (...p) => join(root, 'public', ...p);

/**
 * Entfernt den Hintergrund per Flutfüllung vom Bildrand aus.
 * classify(r,g,b) → null (Motiv, Füllung stoppt) oder [r,g,b,a] (neuer Pixelwert, Füllung läuft weiter)
 */
async function removeBackground(file, classify) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i]) continue;
    seen[i] = 1;
    const o = i * 4;
    const px = classify(data[o], data[o + 1], data[o + 2]);
    if (!px) continue;
    data[o] = px[0];
    data[o + 1] = px[1];
    data[o + 2] = px[2];
    data[o + 3] = px[3];
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

const chroma = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// Karten: Weiß und grauer Schatten sind farblos – der cremefarbene Kartenrand nicht.
const cardBackground = (r, g, b) => (chroma(r, g, b) <= 12 && Math.min(r, g, b) >= 140 ? [0, 0, 0, 0] : null);

// Logo: Weiß weg, Kanten zu Weiß abdunkeln (kein heller Saum), beigen Schatten dunkel machen.
const logoBackground = (r, g, b) => {
  const l = lum(r, g, b);
  const c = chroma(r, g, b);
  if (c <= 16 && Math.min(r, g, b) >= 238) return [0, 0, 0, 0];
  if (c <= 16 && l >= 150) return [11, 16, 48, Math.round(255 - l)];
  const beige = r >= 165 && r - b >= 12 && r - b <= 60 && g <= r && g >= b && l >= 150;
  if (beige) return [8, 14, 12, Math.round(Math.min(1, (250 - l) / 90) * 120)];
  return null;
};

mkdirSync(out('cards'), { recursive: true });
mkdirSync(out('backgrounds'), { recursive: true });
mkdirSync(out('logo'), { recursive: true });

for (const f of readdirSync(src('cards'))) {
  const name = basename(f, extname(f));
  const png = await removeBackground(src('cards', f), cardBackground);
  const info = await sharp(png)
    .trim({ threshold: 1 })
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out('cards', `${name}.webp`));
  console.log(`Karte ${name}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}

{
  const png = await removeBackground(src('logo', 'busted-logo.jpg'), logoBackground);
  const info = await sharp(png)
    .trim({ threshold: 1 })
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 95 })
    .toFile(out('logo', 'busted-logo.webp'));
  console.log(`Logo: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}

{
  const info = await sharp(src('backgrounds', 'klassenraum.jpg'))
    .webp({ quality: 78 })
    .toFile(out('backgrounds', 'klassenraum.webp'));
  console.log(`Hintergrund: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}
