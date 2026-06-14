import { SAVE_KEY, SETTINGS_KEY } from './config';

export interface SaveData {
  version: 1;
  ship: { x: number; y: number; z: number; rotY: number };
  visited: string[];
  unlockedAchievements: string[];
  time: number; // in-game seconds elapsed
}

export interface Settings {
  volume: number;
  muted: boolean;
  showHints: boolean;
  pixelRatio: number;
}

const DEFAULT_SAVE: SaveData = {
  version: 1,
  ship: { x: -380, y: 0, z: 0, rotY: 0 },
  visited: [],
  unlockedAchievements: [],
  time: 0,
};

const DEFAULT_SETTINGS: Settings = {
  volume: 0.6,
  muted: true, // muted by default — no music until we add it
  showHints: true,
  pixelRatio: 1,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return structuredClone(DEFAULT_SAVE);
    return parsed;
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist save', e);
  }
}

export function resetSave(): SaveData {
  localStorage.removeItem(SAVE_KEY);
  return structuredClone(DEFAULT_SAVE);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function persistSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Failed to persist settings', e);
  }
}
