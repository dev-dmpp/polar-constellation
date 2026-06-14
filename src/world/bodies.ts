import * as THREE from 'three';
import { PALETTE, WORLD } from '../core/config';
import { CONTENT, type BodyContent } from '../content/bodies';

export interface CelestialBody {
  id: string;
  group: THREE.Group;       // for orbital motion
  pivot: THREE.Object3D;    // for self-rotation
  mesh: THREE.Mesh;
  content: BodyContent;
  /** Current world position (computed each frame from group.matrixWorld). */
  getWorldPosition(out: THREE.Vector3): void;
  /** A user-friendly radius for orbit-zone detection. */
  interactRadius: number;
}

function lowPolySphere(radius: number, color: number, segments = 3): THREE.Mesh {
  const geom = new THREE.IcosahedronGeometry(radius, segments);
  const mat = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.7,
    metalness: 0.1,
  });
  return new THREE.Mesh(geom, mat);
}

function makeStar(): CelestialBody {
  const group = new THREE.Group();
  const pivot = new THREE.Object3D();
  const star = lowPolySphere(WORLD.CENTER_STAR_RADIUS, PALETTE.warm, 4);
  pivot.add(star);
  const glow = new THREE.Mesh(
    new THREE.IcosahedronGeometry(WORLD.CENTER_STAR_RADIUS * 1.4, 3),
    new THREE.MeshBasicMaterial({ color: PALETTE.warm, transparent: true, opacity: 0.18 }),
  );
  pivot.add(glow);
  const light = new THREE.PointLight(PALETTE.warm, 2.4, 0, 1.4);
  light.position.set(0, 0, 0);
  pivot.add(light);
  group.add(pivot);
  return {
    id: 'polar',
    group, pivot, mesh: star,
    content: CONTENT.find((c) => c.id === 'polar')!,
    getWorldPosition: (out) => group.getWorldPosition(out),
    interactRadius: WORLD.CENTER_STAR_RADIUS * 1.6,
  };
}

function makePlanet(content: BodyContent, distance: number, radius: number, color: number, hasRing = false): CelestialBody {
  const group = new THREE.Group();
  group.position.set(distance, 0, 0);
  const pivot = new THREE.Object3D();
  const planet = lowPolySphere(radius, color, 2);
  pivot.add(planet);
  if (hasRing) {
    const ringGeom = new THREE.RingGeometry(radius * 1.5, radius * 2.4, 32, 1);
    const ringMat = new THREE.MeshBasicMaterial({ color: PALETTE.ring, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    pivot.add(ring);
  }
  group.add(pivot);
  return {
    id: content.id,
    group, pivot, mesh: planet,
    content,
    getWorldPosition: (out) => group.getWorldPosition(out),
    interactRadius: radius * 2.2,
  };
}

function makeComet(content: BodyContent, distance: number): CelestialBody {
  const group = new THREE.Group();
  const pivot = new THREE.Object3D();
  const cometGeom = new THREE.IcosahedronGeometry(4, 1);
  const cometMat = new THREE.MeshStandardMaterial({ color: 0x9ec8ff, emissive: 0x6ec1ff, emissiveIntensity: 0.6, flatShading: true });
  const comet = new THREE.Mesh(cometGeom, cometMat);
  pivot.add(comet);
  const tailGeom = new THREE.ConeGeometry(3, 18, 8, 1, true);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0x6ec1ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const tail = new THREE.Mesh(tailGeom, tailMat);
  tail.position.set(-10, 0, 0);
  tail.rotation.z = Math.PI / 2;
  pivot.add(tail);
  group.position.set(distance, 0, 0);
  group.add(pivot);
  return {
    id: content.id,
    group, pivot, mesh: comet,
    content,
    getWorldPosition: (out) => group.getWorldPosition(out),
    interactRadius: 14,
  };
}

function makeNebula(content: BodyContent, distance: number): CelestialBody {
  const group = new THREE.Group();
  group.position.set(distance, 0, 0);
  const pivot = new THREE.Object3D();
  const cluster = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x6b3a99, transparent: true, opacity: 0.35 });
  for (let i = 0; i < 14; i++) {
    const r = 6 + Math.random() * 12;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    m.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60);
    cluster.add(m);
  }
  pivot.add(cluster);
  group.add(pivot);
  return {
    id: content.id,
    group, pivot, mesh: cluster as unknown as THREE.Mesh,
    content,
    getWorldPosition: (out) => group.getWorldPosition(out),
    interactRadius: 50,
  };
}

export function buildBodies(): CelestialBody[] {
  const bodies: CelestialBody[] = [];
  bodies.push(makeStar());

  const planetEntries: Array<[BodyContent, number, number, number, boolean]> = [
    [CONTENT[1], WORLD.PLANET_DISTANCES[0], 14, 0x4a6a8c, true],   // WOHTS
    [CONTENT[2], WORLD.PLANET_DISTANCES[1], 18, 0x8c4a4a, false],  // Trayectoria
    [CONTENT[3], WORLD.PLANET_DISTANCES[2], 10, 0x4a8c7a, false],  // Stack (moon size)
    [CONTENT[4], WORLD.PLANET_DISTANCES[3], 26, 0x6a4a8c, true],   // Certs (giant)
  ];
  for (const [c, d, r, color, ring] of planetEntries) {
    bodies.push(makePlanet(c, d, r, color, ring));
  }

  bodies.push(makeComet(CONTENT[5], WORLD.PLANET_DISTANCES[5]));
  bodies.push(makeNebula(CONTENT[6], WORLD.PLANET_DISTANCES[6]));

  for (const b of bodies) {
    if (b.id === 'polar') continue;
    b.group.rotation.x = WORLD.ORBITAL_INCLINATION * (Math.random() - 0.5);
    b.group.rotation.z = WORLD.ORBITAL_INCLINATION * (Math.random() - 0.5);
  }
  return bodies;
}

const ORBITAL_SPEEDS: Record<string, number> = {
  wohts: 0.05,
  experience: 0.04,
  stack: 0.07,
  certs: 0.025,
  repos: 0.12,
  education: 0.015,
};

export function updateBodies(bodies: CelestialBody[], dt: number, _time: number): void {
  for (const b of bodies) {
    const speed = ORBITAL_SPEEDS[b.id] ?? 0;
    if (speed > 0) {
      b.group.rotation.y += speed * dt;
    }
    b.pivot.rotation.y += 0.4 * dt;
  }
}
