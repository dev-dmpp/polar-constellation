/**
 * Audio infrastructure — silent stub for now. When a soundtrack is added,
 * the public API (play/pause/setVolume/mute) stays the same.
 */

import type { Settings } from './gameState';

export interface AudioApi {
  play(track: string, loop?: boolean): Promise<void>;
  pause(track?: string): void;
  setVolume(v: number): void;
  setMuted(muted: boolean): void;
  stopAll(): void;
}

class StubAudio implements AudioApi {
  private currentVolume = 0.6;
  private muted = true;
  private currentTrack: string | null = null;

  constructor(s: Settings) {
    this.currentVolume = s.volume;
    this.muted = s.muted;
  }

  async play(track: string, _loop = true): Promise<void> {
    // TODO: load an actual track when available.
    this.currentTrack = track;
    console.info(`[audio] would play "${track}" (stub — no audio loaded)`);
  }

  pause(track?: string): void {
    if (!track || track === this.currentTrack) {
      this.currentTrack = null;
    }
  }

  setVolume(v: number): void { this.currentVolume = Math.max(0, Math.min(1, v)); if (this.muted) return; /* noop until loaded */ }
  setMuted(m: boolean): void { this.muted = m; }
  stopAll(): void { this.currentTrack = null; }
  get currentVolumeValue(): number { return this.currentVolume; }
  get isMuted(): boolean { return this.muted; }
  get nowPlaying(): string | null { return this.currentTrack; }
}

export function createAudio(s: Settings): AudioApi {
  return new StubAudio(s);
}
