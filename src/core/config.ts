/**
 * Constelación Polar — core configuration.
 * Vista 2.5D, paleta frío profundo, nave con inercia.
 */

export const WORLD = {
  /** Distance units — 1 unit = ~1000 km feel. */
  CENTER_STAR_RADIUS: 30,
  PLANET_DISTANCES: [180, 320, 480, 700, 980, 1320, 1700, 2100],
  PLANET_RADIUS_RANGE: [4, 28] as [number, number],
  ORBITAL_INCLINATION: 0.18, // radians — gentle 2.5D tilt
};

export const SHIP = {
  ACCEL: 60,
  MAX_SPEED: 220,
  FRICTION: 0.985,
  ROTATION_SPEED: 2.4, // rad/s when keyboard rotating
  MOUSE_ROTATION_LERP: 0.12,
  INTERACT_RANGE: 90, // distance to a body to count as "orbiting"
  BOOST_MULTIPLIER: 1.8,
};

export const CAMERA = {
  FOV: 55,
  NEAR: 0.1,
  FAR: 8000,
  FOLLOW_LERP: 0.08,
  LOOK_AHEAD: 1.2,
  TILT: 0.32, // ~18° — gives the 2.5D feel
};

export const SAVE_KEY = 'polar-constellation-save-v1';
export const SETTINGS_KEY = 'polar-constellation-settings-v1';

/** Paleta frío profundo. */
export const PALETTE = {
  void:        0x020617,
  nebula:      0x0b1530,
  star:        0xe8f1ff,
  starCore:    0xfff4c2,
  accent:      0x6ec1ff, // cyan-blue
  warm:        0xff7a59, // single warm accent for the central star
  ring:        0xa3c7ff,
  panel:       0x0a1730,
  panelEdge:   0x4a7ec0,
  text:        0xd5e3ff,
  textDim:     0x6b86b8,
} as const;

export interface Vec3Like { x: number; y: number; z: number }
