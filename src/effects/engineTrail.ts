import * as THREE from 'three';
import { ParticleSystem } from './particles';

export interface EngineTrailShip {
  readonly group: THREE.Group;
  readonly isThrusting: boolean;
  readonly isBoosting: boolean;
}

export interface EngineTrailHandle {
  update(dt: number): void;
  dispose(): void;
}

const TRAIL_PARTICLE_COUNT = 150;
const TRAIL_COLOR = 0x6ec1ff;
const TRAIL_PARTICLE_SIZE = 0.4;
const TRAIL_LIFETIME = 0.8;
const TRAIL_LOCAL_OFFSET = new THREE.Vector3(0, 0, -2.5);
const TRAIL_SPREAD = 0.5;
const THRUST_SPAWN_PER_FRAME = 3;
const BOOST_SPAWN_PER_FRAME = 6;
const TRAIL_BASE_SPEED = 18; // world units per second for the base vector

/**
 * Attach a particle-based engine trail to a ship.
 *
 * The trail is a {@link ParticleSystem} parented to the ship's group so it
 * inherits the ship's transform automatically. We feed it the inverse-forward
 * direction (i.e. behind the ship) plus a configurable spread to fake the
 * turbulent look of a real plasma plume.
 */
export function attachEngineTrail(ship: EngineTrailShip): EngineTrailHandle {
  const particles = new ParticleSystem(TRAIL_PARTICLE_COUNT, TRAIL_LIFETIME);
  particles.frustumCulled = false;
  ship.group.add(particles);

  // Reusable temporaries to avoid per-frame allocations.
  const spawnPos = new THREE.Vector3();
  const baseDir = new THREE.Vector3();
  const spawnVel = new THREE.Vector3();

  return {
    update(dt: number): void {
      // World-space spawn position: ship origin + local offset transformed
      // by the ship's rotation.
      spawnPos.copy(TRAIL_LOCAL_OFFSET).applyEuler(ship.group.rotation);
      spawnPos.add(ship.group.position);

      // Base direction: opposite of the ship's forward (the ship points along
      // its local +Z, so exhaust pushes toward -Z before the ship's rotation
      // is applied).
      baseDir.set(0, 0, -1).applyEuler(ship.group.rotation);

      const spawnCount = ship.isThrusting
        ? ship.isBoosting
          ? BOOST_SPAWN_PER_FRAME
          : THRUST_SPAWN_PER_FRAME
        : 0;

      for (let i = 0; i < spawnCount; i++) {
        spawnVel.copy(baseDir).multiplyScalar(TRAIL_BASE_SPEED);
        particles.spawn(spawnPos, {
          velocity: spawnVel,
          color: TRAIL_COLOR,
          size: TRAIL_PARTICLE_SIZE,
          spread: TRAIL_SPREAD,
        });
      }

      particles.update(dt);
    },
    dispose(): void {
      ship.group.remove(particles);
      particles.geometry.dispose();
      const mat = particles.material;
      if (Array.isArray(mat)) {
        for (const m of mat) m.dispose();
      } else {
        mat.dispose();
      }
    },
  };
}
