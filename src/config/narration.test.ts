import { describe, expect, it } from 'vitest';
import { ROLES } from './roles';
import { NARRATION, type NarrationKey } from './narration';

describe('Erzähltexte', () => {
  it('enthalten keine Platzhalter (Namen werden als eigene Aufnahme davorgesetzt)', () => {
    for (const [key, variants] of Object.entries(NARRATION)) {
      for (const text of variants) expect(text, key).not.toMatch(/[{}[\]]/);
    }
  });

  it('haben für jede Rolle eine aufnehmbare Rollenansage', () => {
    for (const id of Object.keys(ROLES)) {
      expect(NARRATION[`role_${id}` as NarrationKey], id).toBeDefined();
    }
  });
});
