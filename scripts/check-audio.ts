// Prüft jede Stimme in public/audio gegen alle Texte in src/config/narration.ts:
//   node scripts/check-audio.ts       (Node 22.6+ führt TypeScript direkt aus)
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NARRATION } from '../src/config/narration.ts';

const root = join(import.meta.dirname, '..', 'public', 'audio');
const expected = Object.entries(NARRATION).flatMap(([key, variants]) => variants.map((_, v) => `${key}-${v}`));

for (const pack of readdirSync(root)) {
  const dir = join(root, pack);
  if (!statSync(dir).isDirectory()) continue;
  const files = new Set(readdirSync(dir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)));
  const missing = expected.filter((id) => !files.has(id));
  const unused = [...files].filter((id) => !expected.includes(id));
  console.log(`\n== ${pack}: ${files.size - unused.length}/${expected.length} vorhanden`);
  if (missing.length) console.log('  fehlt:     ', missing.join(', '));
  if (unused.length) console.log('  unbenutzt: ', unused.join(', '));
}
