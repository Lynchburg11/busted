import { describe, expect, it } from 'vitest';
import { analyzeSetup, buildDeck, shuffle, suggestSetup } from './setup';

describe('Setup-Vorschlag', () => {
  it('liefert für jede erlaubte Spielerzahl ein fehlerfreies Setup', () => {
    for (let n = 4; n <= 18; n++) {
      const setup = suggestSetup(n);
      const a = analyzeSetup(setup, n);
      expect(a.errors, `n=${n}`).toEqual([]);
      expect(a.warnings, `n=${n}`).toEqual([]);
      expect(a.deck).toHaveLength(n);
    }
  });

  it('skaliert die Lehrerzahl', () => {
    expect(suggestSetup(4).teacherCount).toBe(1);
    expect(suggestSetup(9).teacherCount).toBe(2);
    expect(suggestSetup(18).teacherCount).toBe(4);
  });
});

describe('Setup-Prüfung', () => {
  it('meldet zu viele Lehrer als Fehler', () => {
    expect(analyzeSetup({ teacherCount: 2, specials: [] }, 4).errors.length).toBeGreaterThan(0);
  });

  it('meldet mehr Rollen als Spieler', () => {
    const a = analyzeSetup({ teacherCount: 1, specials: ['klassensprecher', 'schulleiter', 'petze', 'streber'] }, 4);
    expect(a.errors).toContain('Mehr Rollen als Spieler. Bitte Sonderrollen abwählen.');
  });

  it('warnt bei unausgewogenem Setup', () => {
    const a = analyzeSetup({ teacherCount: 4, specials: [] }, 12);
    expect(a.warnings.some((w) => w.includes('Lehrer sind klar im Vorteil'))).toBe(true);
    const b = analyzeSetup(
      { teacherCount: 1, specials: ['klassensprecher', 'schulleiter', 'vertrauenslehrer', 'petze'] },
      10,
    );
    expect(b.warnings.some((w) => w.includes('Schüler sind klar im Vorteil'))).toBe(true);
  });

  it('füllt das Deck mit Schülern auf', () => {
    expect(buildDeck({ teacherCount: 2, specials: ['petze'] }, 6)).toEqual([
      'lehrer',
      'lehrer',
      'petze',
      'schueler',
      'schueler',
      'schueler',
    ]);
  });

  it('shuffle behält alle Elemente', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(shuffle(items).sort()).toEqual(items);
  });
});
