// Erzeugt public/audio/manifest.json aus den Unterordnern (eine Stimme pro Ordner):
//   public/audio/female/pauseStart-0.mp3  →  { "female": ["pauseStart-0", …], … }
// Läuft automatisch vor `npm run dev` und `npm run build`.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'public', 'audio');
const manifest = {};

for (const pack of readdirSync(root).sort()) {
  const dir = join(root, pack);
  if (!statSync(dir).isDirectory()) continue;
  const clips = readdirSync(dir)
    .filter((f) => /^[\w]+-\d+\.mp3$/.test(f))
    .map((f) => f.replace(/\.mp3$/, ''))
    .sort();
  if (clips.length) manifest[pack] = clips;
}

writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  'Audio-Manifest:',
  Object.entries(manifest)
    .map(([k, v]) => `${k} (${v.length})`)
    .join(', ') || 'keine Aufnahmen',
);
