import { create } from 'zustand';
import { narrator } from '../audio/narrator';
import { sfx } from '../audio/sfx';
import type { VoteMode } from '../game/types';
import { KEYS, load, save } from './storage';

export interface Settings {
  speechEnabled: boolean;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  discussionSeconds: number;
  revealRoles: boolean;
  callAllRoles: boolean;
  voteMode: VoteMode;
  gong: boolean;
  ambience: boolean;
  tick: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  speechEnabled: true,
  voiceURI: null,
  rate: 1,
  pitch: 1,
  discussionSeconds: 180,
  revealRoles: true,
  callAllRoles: true,
  voteMode: 'geheim',
  gong: true,
  ambience: true,
  tick: true,
};

interface SettingsState extends Settings {
  loaded: boolean;
  load(): Promise<void>;
  set(patch: Partial<Settings>): void;
}

function apply(s: Settings) {
  narrator.speechEnabled = s.speechEnabled;
  narrator.tts.voiceURI = s.voiceURI;
  narrator.tts.rate = s.rate;
  narrator.tts.pitch = s.pitch;
  sfx.enabled = { gong: s.gong, ambience: s.ambience, tick: s.tick };
}

const pick = (s: SettingsState): Settings => {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_SETTINGS)) out[k] = s[k as keyof Settings];
  return out as unknown as Settings;
};

export const useSettings = create<SettingsState>((setState, getState) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  async load() {
    const stored = (await load<Partial<Settings>>(KEYS.settings)) ?? {};
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    apply(merged);
    setState({ ...merged, loaded: true });
  },
  set(patch) {
    setState(patch);
    const s = pick(getState());
    apply(s);
    save(KEYS.settings, s);
  },
}));

apply(DEFAULT_SETTINGS);
