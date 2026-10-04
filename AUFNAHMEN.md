# Aufnahmen für die Erzählstimme

Jede Datei kommt in den Ordner der Stimme: `public/audio/female/` bzw. `public/audio/male/`.
Dateiname = `<key>-<variante>.mp3`. Das Manifest wird beim Start/Build automatisch erzeugt.

## Wie Ansagen mit Namen funktionieren

In keinem Text steht mehr ein Platzhalter. Ansagen mit Spielernamen setzt die App zusammen:

| Die App spielt …                  | Beispiel                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| **[Name]** + `afterBusted-0.mp3`  | „Anna“ + „wurde erwischt. Busted!“                           |
| `roleIntro-0.mp3` + **[Rolle]**   | „Die Rolle war:“ + „Klassensprecher.“ (`role_klassensprecher-0.mp3`) |

**[Name]** = die eigene Aufnahme des Spielers (im Spieler-Editor „Namen einsprechen“) oder die Computerstimme.

**Tipp beim Einsprechen:** Die Textstücke nach dem Namen so sprechen, als ob direkt davor ein Name gesagt
wurde – also ohne Pause am Anfang, Betonung wie mitten im Satz. Ein „–“ am Anfang heißt: kurze Sprechpause
nach dem Namen. Stille am Anfang/Ende schneidet die App automatisch weg.

## Neu aufzunehmen (für beide Stimmen)

### Nach dem Namen: erwischt in der Pause
| Datei | Text |
| --- | --- |
| `afterBusted-0.mp3` | wurde erwischt. Busted! |
| `afterBusted-1.mp3` | ist aufgeflogen. Busted! |
| `afterBusted-2.mp3` | – erwischt! Pack deine Sachen. Busted! |

### Nach dem Namen: fliegt mit der Gruppenarbeit raus
| Datei | Text |
| --- | --- |
| `afterPair-0.mp3` | war in der Gruppenarbeit und fliegt gleich mit raus. Busted! |
| `afterPair-1.mp3` | – mitgehangen, mitgefangen! Die Gruppenarbeit fliegt zusammen raus. Busted! |

### Nach dem Namen: von der Petze mitgenommen
| Datei | Text |
| --- | --- |
| `afterPetze-0.mp3` | wurde verpetzt und fliegt auch raus. Busted! |
| `afterPetze-1.mp3` | – verpetzt! Ab ins Sekretariat. Busted! |

### Nach dem Namen: die Petze ist dran
| Datei | Text |
| --- | --- |
| `afterPetzeCall-0.mp3` | war die Petze! Bevor du gehst, darfst du noch jemanden verpetzen. Nimm das Handy. |
| `afterPetzeCall-1.mp3` | ist die Petze und nimmt vielleicht noch jemanden mit. Nimm das Handy. |

### Nach dem Namen: rausgewählt in der Klassenkonferenz
| Datei | Text |
| --- | --- |
| `afterVoteOut-0.mp3` | fliegt raus. Die Klassenkonferenz hat entschieden. Busted! |
| `afterVoteOut-1.mp3` | – ab ins Sekretariat! Busted! |

### Rollenaufdeckung: Einleitung (vor der Rolle)
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
| `role_schulleiter-0.mp3` | Schulleiter. |
| `role_vertrauenslehrer-0.mp3` | Vertrauenslehrer. |
| `role_petze-0.mp3` | Petze. |
| `role_vertretungslehrer-0.mp3` | Vertretungslehrer. |
| `role_streber-0.mp3` | Streber. |
| `role_spicker-0.mp3` | Spicker. |

### Ohne Namen (ersetzen alte Texte mit Platzhaltern)
| Datei | Text |
| --- | --- |
| `discussionOpen-0.mp3` | Die Diskussion ist eröffnet. Die Uhr läuft. Wer benimmt sich verdächtig? |
| `discussionOpen-1.mp3` | Jetzt wird diskutiert. Wer war das? Ihr habt Zeit, bis der Gong ertönt. |
| `voteRunoff-0.mp3` | Gleichstand! Es gibt eine Stichwahl zwischen den Spielern mit den meisten Stimmen. |
| `voteRunoff-1.mp3` | Unentschieden! Stichwahl! Nur wer vorne lag, steht jetzt noch zur Wahl. |

## Fehlt nur bei der männlichen Stimme

| Datei | Text |
| --- | --- |
| `gruppenarbeit_open-1.mp3` | Die beiden Gruppenpartner öffnen die Augen und erkennen sich. Ab jetzt gilt: mitgehangen, mitgefangen. |
| `klassensprecher_close-0.mp3` | Klassensprecher, Augen zu. |
| `vertrauenslehrer_open-1.mp3` | Vertrauenslehrer, aufwachen! Wähle einen Spieler, den du vor den Lehrern beschützt. |

(Bis dahin nimmt die App die andere Variante derselben Ansage.)

## Nicht mehr verwendet (können gelöscht werden)

`busted-*`, `bustedPair-*`, `bustedPetze-*`, `roleReveal-*`, `petzeCall-*`, `discussionStart-*`, `voteTie-*`, `voteOut-*`

Solange neue Aufnahmen fehlen, spricht die Computerstimme diese Stellen.
