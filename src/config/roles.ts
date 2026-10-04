import type { Camp, RoleId } from '../game/types';

/**
 * Zentrale Rollen-Konfiguration.
 * Hier lassen sich Namen, Regeltexte, Gewichte (für die Balance-Anzeige)
 * und die Mindest-Spielerzahl für den automatischen Vorschlag anpassen.
 */
export interface RoleDef {
  id: RoleId;
  name: string;
  /** Artikel-Form für Ansagen, z. B. "der Klassensprecher". */
  withArticle: string;
  camp: Camp;
  emoji: string;
  /** Ein Satz für Setup-Liste. */
  short: string;
  /** Regeltext, den der Spieler nach dem Aufdecken sieht. */
  rules: string;
  /** Darf mehrfach vorkommen (nur Lehrer und Schüler). */
  multiple: boolean;
  /**
   * Balance-Gewicht: positiv stärkt das Schüler-Lager, negativ das Lehrer-Lager.
   * Summe nahe 0 ⇒ ausgewogen.
   */
  weight: number;
  /** Ab dieser Spielerzahl wird die Rolle automatisch vorgeschlagen (null = nie). */
  suggestFrom: number | null;
}

export const ROLES: Record<RoleId, RoleDef> = {
  lehrer: {
    id: 'lehrer',
    name: 'Lehrer',
    withArticle: 'ein Lehrer',
    camp: 'lehrer',
    emoji: '👩‍🏫',
    short: 'Erwischen in jeder Pause gemeinsam einen Spieler.',
    rules:
      'Du gehörst zum Lehrer-Lager. In jeder Pause öffnet ihr Lehrer die Augen, einigt euch lautlos und tippt auf dem Handy an, wen ihr erwischt. Tagsüber tust du so, als wärst du ein harmloser Schüler. Ihr gewinnt, sobald ihr mindestens so viele seid wie alle anderen.',
    multiple: true,
    weight: -6,
    suggestFrom: 4,
  },
  schueler: {
    id: 'schueler',
    name: 'Schüler',
    withArticle: 'ein Schüler',
    camp: 'schueler',
    emoji: '🎒',
    short: 'Keine Fähigkeit – nur Köpfchen und Bauchgefühl.',
    rules:
      'Du gehörst zum Schüler-Lager. Du hast keine besondere Fähigkeit, aber deine Stimme in der Klassenkonferenz zählt. Finde heraus, wer die Lehrer sind, und wirf sie raus!',
    multiple: true,
    weight: 1,
    suggestFrom: null,
  },
  klassensprecher: {
    id: 'klassensprecher',
    name: 'Klassensprecher',
    withArticle: 'der Klassensprecher',
    camp: 'schueler',
    emoji: '📣',
    short: 'Sieht in jeder Pause die Rolle eines Spielers.',
    rules:
      'Du gehörst zum Schüler-Lager. In jeder Pause darfst du dir die Rolle eines Mitspielers ansehen. Nutze dein Wissen geschickt – wenn du dich zu früh verrätst, erwischen dich die Lehrer.',
    multiple: false,
    weight: 7,
    suggestFrom: 4,
  },
  schuelersprecher: {
    id: 'schuelersprecher',
    name: 'Schülersprecher',
    withArticle: 'der Schülersprecher',
    camp: 'schueler',
    emoji: '🎤',
    short: 'Erfährt, wen die Lehrer erwischt haben. Kann einmal retten und einmal jemanden auffliegen lassen.',
    rules:
      'Du gehörst zum Schüler-Lager. In jeder Pause erfährst du, wen die Lehrer erwischt haben. Einmal im Spiel kannst du diesen Spieler retten, und einmal im Spiel kannst du einen beliebigen Spieler auffliegen lassen. Du musst nichts tun – „Nichts tun“ ist immer erlaubt.',
    multiple: false,
    weight: 4,
    suggestFrom: 7,
  },
  vertrauensschueler: {
    id: 'vertrauensschueler',
    name: 'Vertrauensschüler',
    withArticle: 'der Vertrauensschüler',
    camp: 'schueler',
    emoji: '🛡️',
    short: 'Schützt in jeder Pause einen Spieler vor den Lehrern, nicht zweimal denselben.',
    rules:
      'Du gehörst zum Schüler-Lager. In jeder Pause schützt du einen Spieler (auch dich selbst) vor den Lehrern, aber nie zweimal hintereinander denselben. Gegen den Schülersprecher hilft dein Schutz nicht.',
    multiple: false,
    weight: 3,
    suggestFrom: 8,
  },
  petze: {
    id: 'petze',
    name: 'Petze',
    withArticle: 'die Petze',
    camp: 'schueler',
    emoji: '🗣️',
    short: 'Nimmt beim Ausscheiden einen Spieler mit.',
    rules:
      'Du gehörst zum Schüler-Lager. Wenn du erwischt oder rausgewählt wirst, verpetzt du noch schnell jemanden: Du darfst einen Spieler mitnehmen, der ebenfalls ausscheidet.',
    multiple: false,
    weight: 3,
    suggestFrom: 9,
  },
  verkupplerin: {
    id: 'verkupplerin',
    name: 'Verkupplerin (Amor)',
    withArticle: 'die Verkupplerin',
    camp: 'schueler',
    emoji: '💘',
    short: 'Bringt in Pause 1 zwei Mitschüler zur Gruppenarbeit zusammen.',
    rules:
      'Du gehörst zum Schüler-Lager. In der ersten Pause bringst du zwei Mitschüler zur Gruppenarbeit zusammen (du darfst dich selbst wählen) und tippst sie an. Scheidet einer der beiden aus, scheidet der andere sofort mit aus. Gehören die beiden verschiedenen Lagern an, bilden sie ein eigenes Lager und gewinnen nur, wenn am Ende nur noch sie beide übrig sind. Sind beide raus und du bist noch dabei, bildest du in der nächsten Pause eine neue Gruppenarbeit.',
    multiple: false,
    weight: -3,
    suggestFrom: 9,
  },
  streber: {
    id: 'streber',
    name: 'Streber',
    withArticle: 'der Streber',
    camp: 'schueler',
    emoji: '🤓',
    short: 'Wählt ein Vorbild – scheidet es aus, wird er Lehrer.',
    rules:
      'Du startest im Schüler-Lager. In der ersten Pause wählst du ein Vorbild. Solange dein Vorbild im Spiel ist, bist du Schüler. Scheidet es aus (egal wodurch), wechselst du ins Lehrer-Lager: Du bekommst still einen Hinweis auf dem Handy und wachst ab dann mit den Lehrern auf.',
    multiple: false,
    weight: -1,
    suggestFrom: 10,
  },
  spicker: {
    id: 'spicker',
    name: 'Der Spicker',
    withArticle: 'der Spicker',
    camp: 'schueler',
    emoji: '👀',
    short: 'Darf blinzeln, während die Lehrer wach sind.',
    rules:
      'Du gehörst zum Schüler-Lager. Wenn die Lehrer in der Pause aufwachen, darfst du vorsichtig blinzeln, um sie zu erkennen. Aber pass auf: Wenn die Lehrer dich beim Spicken erwischen, bist du ihr nächstes Ziel!',
    multiple: false,
    weight: 1,
    suggestFrom: 12,
  },
};

/** Reihenfolge der Sonderrollen im Setup und beim Vorschlag. */
export const SPECIAL_ROLES: RoleId[] = [
  'klassensprecher',
  'schuelersprecher',
  'vertrauensschueler',
  'petze',
  'verkupplerin',
  'streber',
  'spicker',
];

export const CAMP_NAMES: Record<Camp, string> = {
  schueler: 'Schüler-Lager',
  lehrer: 'Lehrer-Lager',
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 18;

/** Vorschlag: etwa ein Lehrer auf 4,5 Spieler. */
export function suggestedTeacherCount(players: number): number {
  return Math.max(1, Math.round(players / 4.5));
}

/** Schwellen für die Balance-Warnung. */
export const BALANCE = {
  teacherAdvantageBelow: -6,
  studentAdvantageAbove: 9,
};
