import { useEffect, useState } from 'react';
import { line } from '../audio/lines';
import { narrator } from '../audio/narrator';
import { sfx } from '../audio/sfx';
import { germanVoices, loadVoices, ttsSupported } from '../audio/tts';
import { Page, Stepper, Toggle } from '../components/Layout';
import { useApp } from '../store/app';
import { useSettings } from '../store/settings';

export function SettingsScreen() {
  const go = useApp((s) => s.go);
  const s = useSettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    loadVoices().then((all) => setVoices(germanVoices(all)));
  }, []);

  const test = () => {
    narrator.unlock();
    narrator.say(line('voiceTest')).catch(() => {});
  };

  const minutes = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <Page title="Optionen" onBack={() => go('home')}>
      <section className="card-chalk mb-4 px-4 py-2">
        <h2 className="chalk-title pt-2 text-xl">🔊 Erzähler</h2>
        <Toggle
          label="Sprachausgabe"
          hint={ttsSupported() ? 'Ohne Ton erscheint der Text nur auf dem Bildschirm.' : 'Dieser Browser unterstützt keine Sprachausgabe.'}
          checked={s.speechEnabled}
          onChange={(speechEnabled) => s.set({ speechEnabled })}
        />
        <label className="block py-2">
          <span className="mb-1 block text-xl">Stimme</span>
          <select
            className="field text-lg"
            value={s.voiceURI ?? ''}
            onChange={(e) => s.set({ voiceURI: e.target.value || null })}
          >
            <option value="">Automatisch (Deutsch)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {voices.length === 0 && (
            <span className="mt-1 block text-base text-chalk-dim">
              Keine deutsche Stimme gefunden. Auf dem iPhone: Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen.
            </span>
          )}
        </label>
        <label className="block py-2">
          <span className="mb-1 flex justify-between text-xl">
            Tempo <span className="text-chalk-dim">{s.rate.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min={0.6}
            max={1.5}
            step={0.05}
            value={s.rate}
            onChange={(e) => s.set({ rate: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="block py-2">
          <span className="mb-1 flex justify-between text-xl">
            Tonhöhe <span className="text-chalk-dim">{s.pitch.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={s.pitch}
            onChange={(e) => s.set({ pitch: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <button className="btn btn-chalk my-2 w-full" onClick={test}>
          ▶ Stimme testen
        </button>
      </section>

      <section className="card-chalk mb-4 px-4 py-2">
        <h2 className="chalk-title pt-2 text-xl">🔔 Geräusche</h2>
        <Toggle label="Schulgong" hint="Zu Beginn und Ende jeder Pause." checked={s.gong} onChange={(gong) => s.set({ gong })} />
        <Toggle
          label="Pausen-Rauschen"
          hint="Leises Pausenhof-Rauschen übertönt Geraschel beim Tippen."
          checked={s.ambience}
          onChange={(ambience) => s.set({ ambience })}
        />
        <Toggle label="Tickende Uhr" hint="Während der Diskussion." checked={s.tick} onChange={(tick) => s.set({ tick })} />
        <button
          className="btn btn-chalk my-2 w-full"
          onClick={() => {
            narrator.unlock();
            sfx.gong();
          }}
        >
          ▶ Gong testen
        </button>
      </section>

      <section className="card-chalk mb-4 px-4 py-2">
        <h2 className="chalk-title pt-2 text-xl">📝 Spiel</h2>
        <div className="flex items-center justify-between py-3">
          <span className="text-xl">Diskussionszeit</span>
          <Stepper
            value={s.discussionSeconds / 30}
            min={1}
            max={20}
            format={(v) => minutes(v * 30)}
            onChange={(v) => s.set({ discussionSeconds: v * 30 })}
          />
        </div>
        <Toggle label="Rollen beim Ausscheiden aufdecken" checked={s.revealRoles} onChange={(revealRoles) => s.set({ revealRoles })} />
        <Toggle
          label="Geheime Abstimmung"
          hint="Aus: offene Abstimmung per Handzeichen."
          checked={s.voteMode === 'geheim'}
          onChange={(v) => s.set({ voteMode: v ? 'geheim' : 'offen' })}
        />
        <Toggle
          label="Alle Rollen aufrufen"
          hint="Auch nicht vergebene Rollen werden in der Pause aufgerufen. So verrät der Ablauf nicht, welche Rollen mitspielen."
          checked={s.callAllRoles}
          onChange={(callAllRoles) => s.set({ callAllRoles })}
        />
      </section>

      <p className="pb-4 text-center text-base text-chalk-dim">
        Alle Daten bleiben auf diesem Gerät. Kein Konto, kein Tracking.
      </p>
    </Page>
  );
}
