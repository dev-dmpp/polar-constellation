import * as THREE from 'three';
import { SHIP } from '../core/config';
import type { InputManager } from '../core/input';

export class Ship {
  readonly group: THREE.Group;
  private engineGlow: THREE.Mesh;
  private velocity = new THREE.Vector3();
  private speedKmh = 0;
  private distanceFromOrigin = 0;
  private thrusting = false;
  private boosting = false;

  constructor() {
    this.group = new THREE.Group();
    // Hull: low-poly triangular dart
    const hull = new THREE.ConeGeometry(1.2, 3.2, 6, 1);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xe8f1ff, flatShading: true, metalness: 0.4, roughness: 0.45 });
    const mesh = new THREE.Mesh(hull, hullMat);
    mesh.rotation.x = -Math.PI / 2; // nose along +Z
    this.group.add(mesh);
    // Engine glow
    const glowGeom = new THREE.ConeGeometry(0.8, 1.6, 6, 1);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x6ec1ff, transparent: true, opacity: 0.7 });
    this.engineGlow = new THREE.Mesh(glowGeom, glowMat);
    this.engineGlow.rotation.x = Math.PI / 2;
    this.engineGlow.position.set(0, 0, -2.2);
    this.group.add(this.engineGlow);
    // A subtle point light to illuminate nearby planets
    const light = new THREE.PointLight(0x6ec1ff, 0.6, 60, 2);
    this.group.add(light);
  }

  setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  get position(): THREE.Vector3 { return this.group.position; }
  get speed(): number { return this.speedKmh; }
  get dist(): number { return this.distanceFromOrigin; }
  get rotY(): number { return this.group.rotation.y; }
  /** Real input state, fed from the InputManager. */
  setInputState(thrusting: boolean, boosting: boolean): void {
    this.thrusting = thrusting;
    this.boosting = boosting;
  }
  get isThrusting(): boolean { return this.thrusting; }
  get isBoosting(): boolean { return this.boosting; }

  update(dt: number, input: InputManager): void {
    // Mouse-based rotation: aim toward the cursor.
    const m = input.getMouse();
    const targetYaw = m.nx * Math.PI * 0.6;
    const targetPitch = -m.ny * 0.35;

    // Smooth rotation toward target
    const rotLerp = SHIP.MOUSE_ROTATION_LERP;
    this.group.rotation.y += (targetYaw - this.group.rotation.y) * rotLerp;
    this.group.rotation.x += (targetPitch - this.group.rotation.x) * (rotLerp * 0.7);

    // Thrust
    const thrust = input.isThrusting() ? SHIP.ACCEL * (input.isBoosting() ? SHIP.BOOST_MULTIPLIER : 1) : 0;
    if (thrust > 0) {
      const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.group.rotation);
      this.velocity.addScaledVector(forward, thrust * dt);
      (this.engineGlow.material as THREE.MeshBasicMaterial).opacity = input.isBoosting() ? 0.95 : 0.75;
    } else {
      (this.engineGlow.material as THREE.MeshBasicMaterial).opacity = 0.35;
    }

    // Brake
    if (input.isBraking()) {
      this.velocity.multiplyScalar(0.92);
    }

    // Friction + clamp
    this.velocity.multiplyScalar(SHIP.FRICTION);
    const sp = this.velocity.length();
    if (sp > SHIP.MAX_SPEED) this.velocity.setLength(SHIP.MAX_SPEED);

    // Integrate
    this.group.position.addScaledVector(this.velocity, dt);
    this.group.position.y = THREE.MathUtils.clamp(this.group.position.y, -300, 300);

    // Telemetry
    this.speedKmh = this.velocity.length() * 3.6;
    this.distanceFromOrigin = this.group.position.length();
  }
}
