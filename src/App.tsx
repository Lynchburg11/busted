import { useEffect } from 'react';
import { narrator } from './audio/narrator';
import { loadVoices } from './audio/tts';
import { Backdrop } from './components/Backdrop';
import { ConfirmDialog } from './components/Dialog';
import { LOGO_URL } from './lib/assets';
import { GameScreen } from './screens/game/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { RulesScreen } from './screens/RulesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';
import { useApp } from './store/app';
import { useGame } from './store/game';
import { usePlayers } from './store/players';
import { useSettings } from './store/settings';
import { requestPersistence } from './store/storage';

export default function App() {
  const { screen, go, confirmLeave, setConfirmLeave } = useApp();
  const playersLoaded = usePlayers((s) => s.loaded);
  const settingsLoaded = useSettings((s) => s.loaded);
  const gameLoaded = useGame((s) => s.loaded);

  // Daten laden
  useEffect(() => {
    usePlayers.getState().load();
    useSettings.getState().load();
    useGame.getState().load();
    loadVoices();
    narrator.nameAudio = (id) => usePlayers.getState().players.find((p) => p.id === id)?.nameAudio;
    narrator.loadClipManifest(import.meta.env.BASE_URL);
    requestPersistence();
  }, []);

  // iOS: Ton erst nach dem ersten Tippen freischalten
  useEffect(() => {
    const unlock = () => narrator.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // App-Wechsel: Erzähler anhalten (Spielstand ist ohnehin gespeichert)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && useApp.getState().screen === 'game') narrator.pause();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // Zurück-Taste (Android/Browser) abfangen
  useEffect(() => {
    if (screen === 'home') return;
    history.pushState({ busted: screen }, '');
    const onPop = () => {
      const { screen: current } = useApp.getState();
      const game = useGame.getState().game;
      if (current === 'game' && game && game.phase.type !== 'gameOver') {
        history.pushState({ busted: current }, '');
        setConfirmLeave(true);
      } else if (current === 'setup') {
        go('players');
      } else {
        go('home');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [screen, go, setConfirmLeave]);

  // Neu laden / Tab schließen während eines Spiels nur mit Rückfrage
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const game = useGame.getState().game;
      if (useApp.getState().screen === 'game' && game && game.phase.type !== 'gameOver') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  if (!playersLoaded || !settingsLoaded || !gameLoaded) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <img src={LOGO_URL} alt="Busted!" className="w-full max-w-sm" />
      </div>
    );
  }

  return (
    <>
      <Backdrop full={screen === 'home'} />
      {screen === 'home' && <HomeScreen />}
      {screen === 'players' && <PlayersScreen />}
      {screen === 'setup' && <SetupScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'rules' && <RulesScreen />}
      {screen === 'game' && <GameScreen />}
      <ConfirmDialog
        open={confirmLeave}
        title="Spiel verlassen?"
        confirmLabel="Ja, zum Hauptmenü"
        cancelLabel="Weiterspielen"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          go('home');
        }}
      >
        Keine Sorge: Der Spielstand bleibt gespeichert und du kannst später weitermachen.
      </ConfirmDialog>
    </>
  );
}
