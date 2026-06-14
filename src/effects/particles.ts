import * as THREE from 'three';

export interface ParticleSpawnOptions {
  velocity?: THREE.Vector3;
  color?: number;
  size?: number;
  spread?: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  age: number;
  life: number;
  active: boolean;
}

/**
 * Lightweight, pooled particle system built on top of `THREE.Points`.
 *
 * Each particle owns its own CPU state (position, velocity, age, life, color,
 * size). The corresponding `BufferAttribute`s (`position`, `color`, custom
 * `size`) are uploaded to the GPU once per frame via the `update` method.
 *
 * Particles are recycled from an internal pool: when `spawn` is called we look
 * for the first inactive slot and reuse it. If every slot is alive we fall
 * back to recycling the oldest (highest `age`) particle so the system never
 * blocks the caller.
 */
export class ParticleSystem extends THREE.Points {
  private readonly particles: Particle[];
  private readonly count: number;
  private readonly lifetime: number;
  private readonly positionAttr: THREE.BufferAttribute;
  private readonly colorAttr: THREE.BufferAttribute;
  private readonly sizeAttr: THREE.BufferAttribute;
  private readonly positionArray: Float32Array;
  private readonly colorArray: Float32Array;
  private readonly sizeArray: Float32Array;

  constructor(count: number, lifetime: number) {
    // -- Buffer arrays ----------------------------------------------------
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);

    const positionAttr = new THREE.BufferAttribute(positionArray, 3);
    const colorAttr = new THREE.BufferAttribute(colorArray, 3);
    const sizeAttr = new THREE.BufferAttribute(sizeArray, 1);

    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    colorAttr.setUsage(THREE.DynamicDrawUsage);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('color', colorAttr);
    geometry.setAttribute('size', sizeAttr);
    // Bounding sphere covering a generous region around the ship.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);

    // -- Material ---------------------------------------------------------
    const material = new THREE.PointsMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      size: 1.0,
      sizeAttenuation: true,
    });

    super(geometry, material);

    this.count = count;
    this.lifetime = lifetime;
    this.positionArray = positionArray;
    this.colorArray = colorArray;
    this.sizeArray = sizeArray;
    this.positionAttr = positionAttr;
    this.colorAttr = colorAttr;
    this.sizeAttr = sizeAttr;

    // -- Particle pool ----------------------------------------------------
    this.particles = new Array<Particle>(count);
    for (let i = 0; i < count; i++) {
      const life = lifetime * (0.5 + Math.random() * 0.5);
      this.particles[i] = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(0xffffff),
        size: 1.0,
        age: 0,
        life,
        active: false,
      };
      // Start fully transparent by writing alpha=0 to the color buffer.
      colorArray[i * 3 + 0] = 0;
      colorArray[i * 3 + 1] = 0;
      colorArray[i * 3 + 2] = 0;
      sizeArray[i] = 0;
    }
  }

  /**
   * Re-emit a particle at `origin`. The first inactive slot is reused; if
   * every slot is alive the oldest one is recycled.
   */
  spawn(origin: THREE.Vector3, options: ParticleSpawnOptions = {}): void {
    const index = this.getInactive();
    const particle = this.particles[index];

    particle.position.copy(origin);
    if (options.velocity) {
      particle.velocity.copy(options.velocity);
    } else {
      particle.velocity.set(0, 0, 0);
    }
    if (options.color !== undefined) {
      particle.color.setHex(options.color);
    }
    if (options.size !== undefined) {
      particle.size = options.size;
    }
    const spread = options.spread ?? 0;
    if (spread > 0) {
      particle.velocity.x += (Math.random() - 0.5) * spread * 2;
      particle.velocity.y += (Math.random() - 0.5) * spread * 2;
      particle.velocity.z += (Math.random() - 0.5) * spread * 2;
    }
    particle.life = this.lifetime * (0.5 + Math.random() * 0.5);
    particle.age = 0;
    particle.active = true;

    // Push initial color/size to GPU buffers.
    const i3 = index * 3;
    this.colorArray[i3 + 0] = particle.color.r;
    this.colorArray[i3 + 1] = particle.color.g;
    this.colorArray[i3 + 2] = particle.color.b;
    this.sizeArray[index] = particle.size;
    this.positionArray[i3 + 0] = particle.position.x;
    this.positionArray[i3 + 1] = particle.position.y;
    this.positionArray[i3 + 2] = particle.position.z;
  }

  /**
   * Step every active particle by `dt` seconds, upload the new state to the
   * GPU and recycle particles that have outlived their lifetime.
   */
  update(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        // Keep recycled particles invisible.
        this.sizeArray[i] = 0;
        this.colorArray[i * 3 + 0] = 0;
        this.colorArray[i * 3 + 1] = 0;
        this.colorArray[i * 3 + 2] = 0;
        continue;
      }

      p.age += dt;
      if (p.age >= p.life) {
        this.recycle(i);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);

      const t = 1 - p.age / p.life; // 1 -> 0
      const i3 = i * 3;
      // Color carries alpha: scale RGB by lifetime progress. With
      // AdditiveBlending this yields a smooth fade-to-black.
      this.colorArray[i3 + 0] = p.color.r * t;
      this.colorArray[i3 + 1] = p.color.g * t;
      this.colorArray[i3 + 2] = p.color.b * t;
      this.sizeArray[i] = p.size * t;
      this.positionArray[i3 + 0] = p.position.x;
      this.positionArray[i3 + 1] = p.position.y;
      this.positionArray[i3 + 2] = p.position.z;
    }

    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  /** Mark particle `i` as inactive and clear its GPU footprint. */
  private recycle(i: number): void {
    const p = this.particles[i];
    p.active = false;
    p.age = 0;
    this.sizeArray[i] = 0;
    this.colorArray[i * 3 + 0] = 0;
    this.colorArray[i * 3 + 1] = 0;
    this.colorArray[i * 3 + 2] = 0;
    this.positionArray[i * 3 + 0] = 0;
    this.positionArray[i * 3 + 1] = 0;
    this.positionArray[i * 3 + 2] = 0;
  }

  /**
   * Return the index of the first inactive slot. If every slot is alive,
   * recycle the oldest one (highest `age`) and return its index.
   */
  private getInactive(): number {
    for (let i = 0; i < this.count; i++) {
      if (!this.particles[i].active) return i;
    }
    // Pool exhausted: steal the oldest.
    let oldest = 0;
    let oldestAge = -1;
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (p.age > oldestAge) {
        oldestAge = p.age;
        oldest = i;
      }
    }
    this.recycle(oldest);
    return oldest;
  }
}
