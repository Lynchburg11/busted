# Aufnahmen für die Erzählstimme

Jede Datei kommt in den Ordner der Stimme: `public/audio/female/` bzw. `public/audio/male/`.
Dateiname = `<key>-<variante>.mp3`. Das Manifest wird beim Start/Build automatisch erzeugt.
Alle Texte stehen auch in `src/config/narration.ts`.

**Stand:** Beide Stimmen sind vollständig (95/95). Prüfen, ob etwas fehlt oder übrig ist:

```bash
npm run audio:check
```

Alte, nicht mehr benutzte Aufnahmen liegen in `audio-archiv/` (wird nicht veröffentlicht).
Die Listen unten zeigen, was für die Umstellung neu aufgenommen wurde.

## Wie Ansagen mit Namen funktionieren

In keinem Text steht ein Platzhalter. Ansagen mit Spielernamen setzt die App zusammen:

| Die App spielt …                  | Beispiel                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| **[Name]** + `afterBusted-0.mp3`  | „Anna“ + „wurde erwischt. Busted!“                           |
| `roleIntro-0.mp3` + **[Rolle]**   | „Die Rolle war:“ + „Klassensprecher.“ (`role_klassensprecher-0.mp3`) |

**[Name]** = die eigene Aufnahme des Spielers (im Spieler-Editor „Namen einsprechen“) oder die Computerstimme.

**Tipp beim Einsprechen:** Die Textstücke nach dem Namen so sprechen, als ob direkt davor ein Name gesagt
wurde – also ohne Pause am Anfang, Betonung wie mitten im Satz. Ein „–“ am Anfang heißt: kurze Sprechpause
nach dem Namen. Stille am Anfang/Ende schneidet die App automatisch weg.

---

## 1. Umbenannte Rollen (neu aufzunehmen, beide Stimmen)

Schulleiter → **Schülersprecher**, Vertretungslehrer → **Verkupplerin (Amor)**,
Vertrauenslehrer → **Vertrauensschüler**.

### Verkupplerin
| Datei | Text |
| --- | --- |
| `verkupplerin_open-0.mp3` | Die Verkupplerin öffnet die Augen. Amors Pfeil ist gespannt! Wähle zwei Mitschüler, die ab jetzt in einer Gruppenarbeit zusammenarbeiten. |
| `verkupplerin_open-1.mp3` | Verkupplerin, aufwachen! Heute wird verkuppelt. Tippe zwei Mitschüler an, die ab jetzt zusammenhängen. |
| `verkupplerin_close-0.mp3` | Danke. Verkupplerin, tippe jetzt deine beiden Gruppenpartner sanft an die Schulter. Dann leg den Kopf wieder hin. |
| `verkupplerin_close-1.mp3` | Gut. Verkupplerin, tipp die beiden Auserwählten vorsichtig an die Schulter, und dann Kopf runter. |

### Vertrauensschüler
| Datei | Text |
| --- | --- |
| `vertrauensschueler_open-0.mp3` | Der Vertrauensschüler öffnet die Augen. Wen nimmst du heute unter deine Fittiche? |
| `vertrauensschueler_open-1.mp3` | Vertrauensschüler, aufwachen! Wähle einen Spieler, den du vor den Lehrern beschützt. |
| `vertrauensschueler_close-0.mp3` | Vertrauensschüler, Augen zu. |
| `vertrauensschueler_close-1.mp3` | Der Vertrauensschüler legt den Kopf wieder hin. |

### Schülersprecher
| Datei | Text |
| --- | --- |
| `schuelersprecher_open-0.mp3` | Der Schülersprecher öffnet die Augen. Schau aufs Handy: Wer wurde erwischt? Du kannst retten, jemanden auffliegen lassen oder nichts tun. |
| `schuelersprecher_open-1.mp3` | Schülersprecher, aufwachen! Hier ist der geheime Bericht aus dem Lehrerzimmer. |
| `schuelersprecher_close-0.mp3` | Schülersprecher, Augen zu. |
| `schuelersprecher_close-1.mp3` | Der Schülersprecher legt den Kopf wieder hin. Augen zu. |

---

## 2. Ansagen mit Namen (neu aufzunehmen, beide Stimmen)

### [Name] + … erwischt in der Pause
| Datei | Text |
| --- | --- |
| `afterBusted-0.mp3` | wurde erwischt. Busted! |
| `afterBusted-1.mp3` | ist aufgeflogen. Busted! |
| `afterBusted-2.mp3` | – erwischt! Pack deine Sachen. Busted! |

### [Name] + … fliegt mit der Gruppenarbeit raus
| Datei | Text |
| --- | --- |
| `afterPair-0.mp3` | war in der Gruppenarbeit und fliegt gleich mit raus. Busted! |
| `afterPair-1.mp3` | – mitgehangen, mitgefangen! Die Gruppenarbeit fliegt zusammen raus. Busted! |

### [Name] + … von der Petze mitgenommen
| Datei | Text |
| --- | --- |
| `afterPetze-0.mp3` | wurde verpetzt und fliegt auch raus. Busted! |
| `afterPetze-1.mp3` | – verpetzt! Ab ins Sekretariat. Busted! |

### [Name] + … die Petze ist dran
| Datei | Text |
| --- | --- |
| `afterPetzeCall-0.mp3` | war die Petze! Bevor du gehst, darfst du noch jemanden verpetzen. Nimm das Handy. |
| `afterPetzeCall-1.mp3` | ist die Petze und nimmt vielleicht noch jemanden mit. Nimm das Handy. |

### [Name] + … rausgewählt in der Klassenkonferenz
| Datei | Text |
| --- | --- |
| `afterVoteOut-0.mp3` | fliegt raus. Die Klassenkonferenz hat entschieden. Busted! |
| `afterVoteOut-1.mp3` | – ab ins Sekretariat! Busted! |

### Rollenaufdeckung: … + [Rolle]
| Datei | Text |
| --- | --- |
| `roleIntro-0.mp3` | Die Rolle war: |
| `roleIntro-1.mp3` | Ein Blick ins Zeugnis verrät: |

### Rollennamen
| Datei | Text |
| --- | --- |
| `role_lehrer-0.mp3` | Lehrer. |
| `role_schueler-0.mp3` | Schüler. |
| `role_klassensprecher-0.mp3` | Klassensprecher. |
| `role_schuelersprecher-0.mp3` | Schülersprecher. |
| `role_vertrauensschueler-0.mp3` | Vertrauensschüler. |
| `role_petze-0.mp3` | Petze. |
| `role_verkupplerin-0.mp3` | Verkupplerin. |
| `role_streber-0.mp3` | Streber. |
| `role_spicker-0.mp3` | Spicker. |

---

## 3. Ohne Namen (ersetzen alte Texte mit Platzhaltern, beide Stimmen)

| Datei | Text |
| --- | --- |
| `discussionOpen-0.mp3` | Die Diskussion ist eröffnet. Die Uhr läuft. Wer benimmt sich verdächtig? |
| `discussionOpen-1.mp3` | Jetzt wird diskutiert. Wer war das? Ihr habt Zeit, bis der Gong ertönt. |
| `voteRunoff-0.mp3` | Gleichstand! Es gibt eine Stichwahl zwischen den Spielern mit den meisten Stimmen. |
| `voteRunoff-1.mp3` | Unentschieden! Stichwahl! Nur wer vorne lag, steht jetzt noch zur Wahl. |

## 4. Fehlt nur bei der männlichen Stimme

| Datei | Text |
| --- | --- |
| `gruppenarbeit_open-1.mp3` | Die beiden Gruppenpartner öffnen die Augen und erkennen sich. Ab jetzt gilt: mitgehangen, mitgefangen. |
| `klassensprecher_close-0.mp3` | Klassensprecher, Augen zu. |

(Bis dahin nimmt die App die andere Variante derselben Ansage.)

---

## Nicht mehr verwendet (liegen jetzt in `audio-archiv/`)

- Alte Rollennamen: `vertretungslehrer_*`, `vertrauenslehrer_*`, `schulleiter_*`
- Alte Texte mit Platzhaltern: `busted-*`, `bustedPair-*`, `bustedPetze-*`, `roleReveal-*`, `petzeCall-*`,
  `discussionStart-*`, `voteTie-*`, `voteOut-*`

Solange neue Aufnahmen fehlen, spricht die Computerstimme diese Stellen.

**Summe neu aufzunehmen:** 12 (umbenannte Rollen) + 22 (Namen/Rollen) + 4 (ohne Namen) = **38 pro Stimme**,
bei der männlichen Stimme zusätzlich 2.
