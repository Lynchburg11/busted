# Busted! 🚨

Ein privates Partyspiel im Stil von Werwolf/Mafia – im Klassenzimmer. Die Schüler schreiben eine Klassenarbeit
und dürfen sich nicht von den Lehrern erwischen lassen. **Ein Handy** liegt auf dem Tisch, verteilt geheim die
Rollen und moderiert per Sprachausgabe. Niemand muss Erzähler sein.

- Installierbare PWA, nach dem ersten Laden komplett offline
- Kein Backend, kein Konto, kein Tracking – alles bleibt in IndexedDB auf dem Gerät
- React + TypeScript + Vite, Tailwind CSS, Zustand, idb-keyval, vite-plugin-pwa, Vitest

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server, auch im WLAN erreichbar (--host)
npm test           # Spiellogik-Tests (Vitest)
npm run build      # Typprüfung + Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
npm run icons      # PNG-Icons aus public/icon.svg neu erzeugen
```

> Kamera und Service Worker funktionieren am Handy nur über **HTTPS** (oder `localhost`).
> Zum Testen im WLAN also am besten direkt die GitHub-Pages-Version nehmen.

## Projektstruktur

```
src/
├─ config/roles.ts        Rollen: Namen, Regeltexte, Lager, Balance-Gewichte, Vorschläge
├─ config/narration.ts    Alle Erzähltexte mit Varianten und Platzhaltern
├─ game/                  Reine Spiellogik (kein React, kein Browser)
│  ├─ types.ts            Zustand, Phasen, Aktionen
│  ├─ engine.ts           Zustandsautomat: reduce(state, action) → state
│  ├─ rules.ts            Lager, Siegprüfung, gültige Ziele, Pausenablauf
│  ├─ setup.ts            Rollenvorschlag, Balance-Warnungen, Deck, Mischen
│  └─ *.test.ts           Vitest
├─ audio/                 Erzähler (Warteschlange, Pause, Wiederholen), TTS, MP3-Clips, Soundeffekte
├─ store/                 Zustand-Stores + IndexedDB (Spieler, Einstellungen, Spielstand)
├─ components/            Avatar, Fotoraster, Kamera, BUSTED-Stempel, Dialoge …
└─ screens/               Menüs + screens/game/ (Rollenvergabe, Pause, Stunde, Konferenz, Ende)
```

### Regeln anpassen

- **Rollen** (Texte, Lager, Gewichte, ab welcher Spielerzahl vorgeschlagen): `src/config/roles.ts`
- **Ansagen**: `src/config/narration.ts` – pro Situation beliebig viele Varianten, Platzhalter wie `{name}`
- **Wartezeiten der Schein-Aufrufe**: `DUMMY_MS` in `src/screens/game/NightView.tsx`

### Eigene Sprachaufnahmen statt TTS

Jede Stimme ist ein Ordner unter `public/audio/` (z. B. `female/`, `male/`) mit Dateien `<key>-<variante>.mp3`
(Variante ab 0 gezählt, z. B. `pauseStart-0.mp3`). Das Manifest wird bei `npm run dev`/`npm run build`
automatisch erzeugt, jeder Ordner erscheint in den Optionen als eigene Erzählstimme.
Ansagen mit Spielernamen werden zusammengesetzt: **[Name] + Textstück** – der Name kommt aus der eigenen
Aufnahme des Spielers (Spieler-Editor › „Namen einsprechen“) oder von der Computerstimme.
Alle Dateien mit Texten: [AUFNAHMEN.md](AUFNAHMEN.md). MP3s werden mit gecacht und funktionieren offline.

## Deployment auf GitHub Pages (HTTPS)

1. Auf GitHub ein neues Repository anlegen, z. B. `busted` (darf privat sein, wenn dein Plan Pages für private
   Repos erlaubt – sonst öffentlich; die Seite enthält keine persönlichen Daten).
2. Projekt hochladen:
   ```bash
   git init
   git add .
   git commit -m "Busted!"
   git branch -M main
   git remote add origin https://github.com/<DEIN-NAME>/busted.git
   git push -u origin main
   ```
   Ohne Git auf dem Rechner: [GitHub Desktop](https://desktop.github.com) nutzen oder auf github.com
   „Add file › Upload files“ (die Ordner `node_modules` und `dist` weglassen).
3. Auf GitHub: **Settings › Pages › Build and deployment › Source: „GitHub Actions“** auswählen.
4. Der Workflow `.github/workflows/deploy.yml` läuft bei jedem Push auf `main`: Tests, Build, Veröffentlichung.
   Fortschritt unter dem Reiter **Actions**.
5. Fertig: `https://<DEIN-NAME>.github.io/busted/`

Der Unterpfad wird automatisch aus dem Repo-Namen gesetzt (`BASE_PATH`). Für eine eigene Domain oder eine
`<name>.github.io`-Seite im Workflow `BASE_PATH: /` setzen.

**Updates:** Einfach neu pushen. Die installierte App lädt die neue Version beim nächsten Start im Hintergrund
und nutzt sie ab dem darauffolgenden Start.

## Installation auf dem iPhone

1. Die Seite am besten in **Safari** öffnen (ab iOS 16.4 klappt es auch aus Chrome & Co. über deren Teilen-Menü).
2. Unten auf **Teilen** (Quadrat mit Pfeil) tippen → **„Zum Home-Bildschirm“** → **Hinzufügen**.
3. Busted! über das neue Icon starten – es läuft im Vollbild ohne Browserleiste.
4. Einmal online starten, damit alles im Cache landet. Danach geht's auch im Flugmodus.

**Tipps fürs iPhone**
- **Stumm-Schalter** an der Seite aus, Lautstärke hoch – sonst ist die Erzählstimme nicht zu hören.
- Schönere Stimmen: *Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen › Deutsch* – z. B.
  „Anna (Erweitert)“ laden und dann in Busted! unter **Optionen › Stimme** auswählen.
- Der Ton wird mit dem ersten Tippen in der App freigeschaltet (iOS-Vorgabe).
- Kamera: Beim ersten Foto fragt iOS nach der Erlaubnis. Klappt die Live-Kamera nicht, nimmt „Foto auswählen“ die
  System-Kamera oder ein Bild aus der Mediathek.
- Bildschirm bleibt während des Spiels an (Wake Lock, ab iOS 16.4 in der Home-Bildschirm-App).

## Installation auf Android

In **Chrome** öffnen → Menü ⋮ → **„App installieren“** bzw. „Zum Startbildschirm hinzufügen“.

## Spielablauf in Kürze

1. **Spieler** anlegen (Name + Foto), Mitspieler an-/abhaken.
2. **Rollen** wählen – der Vorschlag passt sich der Spielerzahl an, Warnungen zeigen unausgewogene Setups.
3. **Rollenvergabe:** Handy reihum, gedrückt halten zum Aufdecken.
4. **Pause:** Köpfe auf den Tisch. Die App ruft jede Rolle auf (auch nicht vergebene, mit Zufallswartezeit),
   die aufgerufene Person tippt still ihre Wahl.
5. **Stunde:** BUSTED-Verkündung, ggf. Petze, Diskussion mit Timer, **Klassenkonferenz** (geheim reihum oder
   offen per Handzeichen), Stichwahl bei Gleichstand.
6. Siegprüfung nach jedem Ausscheiden, am Ende Zeugnisausgabe mit allen Rollen und dem kompletten Spielverlauf.
