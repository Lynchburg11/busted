/**
 * Alle Erzähltexte an einem Ort.
 * Pro Situation mehrere Varianten – eine wird zufällig gewählt.
 *
 * Keine Platzhalter im Text! Ansagen mit Spielernamen werden zusammengesetzt:
 *   [Name des Spielers] + after…-Text   (z. B. "Anna" + "wurde erwischt. Busted!")
 *   roleIntro-Text + [role_…]           (z. B. "Die Rolle war:" + "Klassensprecher.")
 * Der Name kommt aus der eigenen Aufnahme des Spielers oder von der Computerstimme.
 *
 * Aufgenommene MP3s: `public/audio/<stimme>/<key>-<variante>.mp3` (Variante ab 0).
 * Das Manifest wird automatisch erzeugt. Liste aller Aufnahmen: AUFNAHMEN.md
 */
export const NARRATION = {
  // --- Spielstart & Rollen ---------------------------------------------------
  gameStart: [
    'Willkommen zur Klassenarbeit! Gleich bekommt jeder heimlich seine Rolle. Gebt das Handy reihum weiter und schaut nur auf euren eigenen Zettel.',
    'Setzt euch, packt die Handys weg – bis auf dieses eine. Jeder erfährt jetzt geheim seine Rolle.',
  ],
  revealDone: [
    'Alle kennen ihre Rolle. Legt das Handy in die Mitte. Gleich klingelt es.',
    'Rollen verteilt. Handy in die Tischmitte, und dann: viel Glück.',
  ],

  // --- Pause -----------------------------------------------------------------
  pauseStart: [
    'Es klingelt zur Pause. Alle Köpfe auf den Tisch, Augen zu!',
    'Pause! Köpfe runter, Augen zu, und niemand spickt. Na ja, fast niemand.',
    'Ding dong, große Pause. Alle legen den Kopf auf den Tisch und schließen die Augen.',
  ],

  verkupplerin_open: [
    'Die Verkupplerin öffnet die Augen. Amors Pfeil ist gespannt! Wähle zwei Mitschüler, die ab jetzt in einer Gruppenarbeit zusammenarbeiten.',
    'Verkupplerin, aufwachen! Heute wird verkuppelt. Tippe zwei Mitschüler an, die ab jetzt zusammenhängen.',
  ],
  verkupplerin_close: [
    'Danke. Verkupplerin, tippe jetzt deine beiden Gruppenpartner sanft an die Schulter. Dann leg den Kopf wieder hin.',
    'Gut. Verkupplerin, tipp die beiden Auserwählten vorsichtig an die Schulter, und dann Kopf runter.',
  ],
  gruppenarbeit_open: [
    'Wer gerade angetippt wurde, öffnet die Augen und schaut sich an. Ihr seid jetzt eine Gruppenarbeit. Fliegt einer raus, fliegt der andere mit.',
    'Die beiden Gruppenpartner öffnen die Augen und erkennen sich. Ab jetzt gilt: mitgehangen, mitgefangen.',
  ],
  gruppenarbeit_close: [
    'Gruppenarbeit, Augen wieder zu.',
    'Die Gruppenpartner legen den Kopf wieder auf den Tisch.',
  ],

  streber_open_first: [
    'Der Streber öffnet die Augen und sucht sich ein Vorbild aus. Wähle weise.',
    'Streber, aufwachen! Such dir jemanden aus, zu dem du aufschaust.',
  ],
  streber_open: [
    'Der Streber schaut kurz aufs Handy, ob sein Vorbild noch da ist.',
    'Streber, kurzer Blick aufs Handy, bitte.',
  ],
  streber_close: ['Streber, Augen zu.', 'Der Streber legt den Kopf wieder hin.'],

  vertrauensschueler_open: [
    'Der Vertrauensschüler öffnet die Augen. Wen nimmst du heute unter deine Fittiche?',
    'Vertrauensschüler, aufwachen! Wähle einen Spieler, den du vor den Lehrern beschützt.',
  ],
  vertrauensschueler_close: ['Vertrauensschüler, Augen zu.', 'Der Vertrauensschüler legt den Kopf wieder hin.'],

  klassensprecher_open: [
    'Der Klassensprecher öffnet die Augen. Wessen Zeugnis willst du heimlich lesen?',
    'Klassensprecher, aufwachen! Tippe einen Spieler an und schau dir seine Rolle an.',
  ],
  klassensprecher_close: ['Klassensprecher, Augen zu.', 'Der Klassensprecher legt den Kopf wieder hin.'],

  lehrer_open: [
    'Die Lehrer betreten das Lehrerzimmer. Öffnet die Augen und einigt euch lautlos, wen ihr erwischen wollt.',
    'Lehrer, aufwachen! Der Kaffee ist kalt, die Laune schlecht. Wen erwischt ihr heute?',
    'Die Lehrer öffnen die Augen. Zeit für eine kleine Taschenkontrolle. Einigt euch auf ein Opfer.',
  ],
  spicker_hint: [
    'Der Spicker darf jetzt vorsichtig blinzeln. Aber lass dich nicht erwischen!',
    'Und wer spicken will, blinzelt jetzt ganz vorsichtig.',
  ],
  lehrer_close: [
    'Die Lehrer verlassen das Lehrerzimmer. Augen zu.',
    'Lehrer, Augen zu. Die Kaffeepause ist vorbei.',
  ],

  schuelersprecher_open: [
    'Der Schülersprecher öffnet die Augen. Schau aufs Handy: Wer wurde erwischt? Du kannst retten, jemanden auffliegen lassen oder nichts tun.',
    'Schülersprecher, aufwachen! Hier ist der geheime Bericht aus dem Lehrerzimmer.',
  ],
  schuelersprecher_close: ['Schülersprecher, Augen zu.', 'Der Schülersprecher legt den Kopf wieder hin. Augen zu.'],

  // --- Stunde ----------------------------------------------------------------
  dayStart: [
    'Es gongt. Die Stunde beginnt. Alle Köpfe hoch!',
    'Pause vorbei! Alle wieder wach, die Klassenarbeit geht weiter.',
    'Guten Morgen, liebe Klasse. Alle Augen auf.',
  ],
  nobodyBusted: [
    'Wunder geschehen: In dieser Pause wurde niemand erwischt.',
    'Alle noch da? Tatsächlich! Niemand wurde erwischt.',
  ],
  // [Name] + …
  afterBusted: [
    'wurde erwischt. Busted!',
    'ist aufgeflogen. Busted!',
    '– erwischt! Pack deine Sachen. Busted!',
  ],
  // [Name] + … (Partner einer Gruppenarbeit)
  afterPair: [
    'war in der Gruppenarbeit und fliegt gleich mit raus. Busted!',
    '– mitgehangen, mitgefangen! Die Gruppenarbeit fliegt zusammen raus. Busted!',
  ],
  // [Name] + … (von der Petze mitgenommen)
  afterPetze: ['wurde verpetzt und fliegt auch raus. Busted!', '– verpetzt! Ab ins Sekretariat. Busted!'],

  // … + [Rolle]
  roleIntro: ['Die Rolle war:', 'Ein Blick ins Zeugnis verrät:'],
  role_lehrer: ['Lehrer.'],
  role_schueler: ['Schüler.'],
  role_klassensprecher: ['Klassensprecher.'],
  role_schuelersprecher: ['Schülersprecher.'],
  role_vertrauensschueler: ['Vertrauensschüler.'],
  role_petze: ['Petze.'],
  role_verkupplerin: ['Verkupplerin.'],
  role_streber: ['Streber.'],
  role_spicker: ['Spicker.'],

  // [Name] + …
  afterPetzeCall: [
    'war die Petze! Bevor du gehst, darfst du noch jemanden verpetzen. Nimm das Handy.',
    'ist die Petze und nimmt vielleicht noch jemanden mit. Nimm das Handy.',
  ],
  petzeNone: ['Die Petze schweigt diesmal.', 'Keiner wurde verpetzt.'],

  discussionOpen: [
    'Die Diskussion ist eröffnet. Die Uhr läuft. Wer benimmt sich verdächtig?',
    'Jetzt wird diskutiert. Wer war das? Ihr habt Zeit, bis der Gong ertönt.',
  ],
  discussionWarn: ['Noch dreißig Sekunden!', 'Noch eine halbe Minute. Kommt zum Punkt!'],
  discussionEnd: ['Stifte weg! Die Zeit ist um.', 'Die Zeit ist um.'],

  voteStart: [
    'Klassenkonferenz! Jetzt wird abgestimmt, wer die Schule verlassen muss.',
    'Die Klassenkonferenz tritt zusammen. Wer fliegt raus?',
  ],
  voteSecret: [
    'Gebt das Handy reihum weiter. Jeder stimmt geheim ab.',
    'Das Handy geht reihum. Tippt heimlich, wen ihr rauswerfen wollt.',
  ],
  voteOpen: [
    'Hände hoch! Zählt die Stimmen für jeden Kandidaten und tippt sie ein.',
    'Offene Abstimmung: Zeigt auf euren Verdächtigen und tragt die Stimmen ein.',
  ],
  voteRunoff: [
    'Gleichstand! Es gibt eine Stichwahl zwischen den Spielern mit den meisten Stimmen.',
    'Unentschieden! Stichwahl! Nur wer vorne lag, steht jetzt noch zur Wahl.',
  ],
  // [Name] + …
  afterVoteOut: [
    'fliegt raus. Die Klassenkonferenz hat entschieden. Busted!',
    '– ab ins Sekretariat! Busted!',
  ],
  voteNobodyTie: [
    'Wieder Gleichstand. Die Konferenz ist sich uneinig, niemand fliegt raus.',
    'Keine Einigung. Heute fliegt niemand.',
  ],
  voteNobody: ['Keine Stimmen, kein Rauswurf.', 'Niemand wurde gewählt.'],

  // --- Spielende -------------------------------------------------------------
  win_schueler: [
    'Alle Lehrer sind raus! Das Schüler-Lager gewinnt. Hitzefrei für alle!',
    'Die Schüler haben es geschafft. Kein Lehrer mehr im Haus. Schulfrei!',
  ],
  win_lehrer: [
    'Die Lehrer haben die Klasse im Griff. Das Lehrer-Lager gewinnt. Nachsitzen für alle!',
    'Das Lehrer-Lager gewinnt. Die Klassenarbeit wird mit sechs bewertet.',
  ],
  win_gruppenarbeit: [
    'Nur noch die Gruppenarbeit ist übrig. Die beiden gewinnen zusammen. Eins plus mit Sternchen!',
  ],
  win_niemand: ['Die Schule ist leer. Niemand gewinnt.'],

  // --- Sonstiges -------------------------------------------------------------
  voiceTest: [
    'Hallo, ich bin eure Erzählstimme. Es klingelt gleich zur Pause.',
    'Test, Test. Hört mich die letzte Reihe?',
  ],
} as const satisfies Record<string, readonly string[]>;

export type NarrationKey = keyof typeof NARRATION;
