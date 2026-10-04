import { create } from 'zustand';

export type Screen = 'home' | 'players' | 'setup' | 'settings' | 'rules' | 'game';

interface AppState {
  screen: Screen;
  go(screen: Screen): void;
  /** Bestätigungsdialog "Spiel verlassen?" */
  confirmLeave: boolean;
  setConfirmLeave(v: boolean): void;
}

export const useApp = create<AppState>((set) => ({
  screen: 'home',
  go: (screen) => set({ screen }),
  confirmLeave: false,
  setConfirmLeave: (confirmLeave) => set({ confirmLeave }),
}));
