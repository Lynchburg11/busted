/**
 * Alle Erzähltexte an einem Ort.
 * Pro Situation mehrere Varianten – eine wird zufällig gewählt.
 * Platzhalter: {name}, {partner}, {names}, {role}, {minutes}, {by}
 *
 * Aufgenommene MP3s: Lege `public/audio/<key>-<variante>.mp3` ab
 * (Variante ab 0 gezählt) und trage sie in `public/audio/manifest.json` ein.
 * Texte mit Platzhaltern werden weiterhin per Sprachausgabe gesprochen.
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

  vertretungslehrer_open: [
    'Der Vertretungslehrer öffnet die Augen. Er hat keine Ahnung vom Stoff, aber er teilt Gruppen ein. Wähle zwei Spieler für die Gruppenarbeit.',
    'Vertretungslehrer, aufwachen! Heute steht Gruppenarbeit auf dem Plan. Tippe zwei Spieler an, die ab jetzt zusammenhängen.',
  ],
  vertretungslehrer_close: [
    'Danke. Vertretungslehrer, tippe jetzt deine beiden Gruppenpartner sanft an die Schulter. Dann leg den Kopf wieder hin.',
    'Gut. Vertretungslehrer, tipp die beiden Auserwählten vorsichtig an die Schulter, und dann Kopf runter.',
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

  vertrauenslehrer_open: [
    'Der Vertrauenslehrer öffnet die Augen. Wen nimmst du heute unter deine Fittiche?',
    'Vertrauenslehrer, aufwachen! Wähle einen Spieler, den du vor den Lehrern beschützt.',
  ],
  vertrauenslehrer_close: ['Vertrauenslehrer, Augen zu.', 'Der Vertrauenslehrer legt den Kopf wieder hin.'],

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

  schulleiter_open: [
    'Der Schulleiter öffnet die Augen. Schau aufs Handy: Wer wurde erwischt? Du kannst retten, jemanden auffliegen lassen oder nichts tun.',
    'Schulleiter, aufwachen! Hier ist der Bericht aus dem Lehrerzimmer.',
  ],
  schulleiter_close: ['Schulleiter, Augen zu.', 'Der Schulleiter verschwindet wieder in seinem Büro. Augen zu.'],

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
  busted: [
    '{name} wurde erwischt. Busted!',
    'Oh oh. {name} ist aufgeflogen. Busted!',
    'Erwischt! {name}, pack deine Sachen. Busted!',
  ],
  bustedPair: [
    '{name} war mit {by} in einer Gruppenarbeit und fliegt gleich mit raus. Busted!',
    'Mitgehangen, mitgefangen: {name} fliegt zusammen mit {by} raus.',
  ],
  bustedPetze: ['{by} hat gepetzt! {name} fliegt auch raus. Busted!', '{by} verpetzt {name}. Busted!'],
  roleReveal: ['{name} war {role}.', 'Und {name} war übrigens {role}.'],

  petzeCall: [
    '{name} war die Petze! Bevor du gehst, darfst du noch jemanden verpetzen. Nimm das Handy.',
    'Moment! {name} ist die Petze und nimmt vielleicht noch jemanden mit.',
  ],
  petzeNone: ['Die Petze schweigt diesmal.', 'Keiner wurde verpetzt.'],

  discussionStart: [
    'Ihr habt {minutes} Zeit zum Diskutieren. Wer benimmt sich verdächtig?',
    'Die Diskussion ist eröffnet. {minutes} Zeit. Wer war das?',
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
  voteTie: [
    'Gleichstand zwischen {names}. Es gibt eine Stichwahl.',
    'Unentschieden! Stichwahl zwischen {names}.',
  ],
  voteOut: [
    'Die Klassenkonferenz hat entschieden: {name} fliegt raus. Busted!',
    '{name}, ab ins Sekretariat! Busted!',
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
