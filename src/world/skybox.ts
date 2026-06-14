import * as THREE from 'three';
import { PALETTE } from '../core/config';

/**
 * Skybox: 3 layers of stars with parallax + a faint nebula gradient.
 */
export function buildSky(scene: THREE.Scene): { update(dt: number): void; layers: THREE.Points[] } {
  // Solid void background color
  scene.background = new THREE.Color(PALETTE.void);

  const layers: THREE.Points[] = [];

  // Three star layers at different distances and densities
  const configs: Array<{ count: number; spread: number; size: number; color: number }> = [
    { count: 600, spread: 4000, size: 1.4, color: PALETTE.star },
    { count: 280, spread: 2400, size: 2.0, color: 0xb6d2ff },
    { count: 60,  spread: 1600, size: 3.0, color: PALETTE.starCore },
  ];
  for (const cfg of configs) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(cfg.count * 3);
    for (let i = 0; i < cfg.count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * cfg.spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: cfg.color, size: cfg.size, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    const stars = new THREE.Points(geom, mat);
    scene.add(stars);
    layers.push(stars);
  }

  // Subtle nebula — large sphere with vertex-colored gradient
  const nebulaGeom = new THREE.SphereGeometry(3500, 32, 24);
  const nebulaColors = new Float32Array(nebulaGeom.attributes.position.count * 3);
  for (let i = 0; i < nebulaGeom.attributes.position.count; i++) {
    const y = nebulaGeom.attributes.position.getY(i) / 3500;
    const t = (y + 1) * 0.5;
    // deep purple → void
    const r = 0.06 + (1 - t) * 0.12;
    const g = 0.04 + (1 - t) * 0.06;
    const b = 0.20 + (1 - t) * 0.20;
    nebulaColors[i * 3 + 0] = r;
    nebulaColors[i * 3 + 1] = g;
    nebulaColors[i * 3 + 2] = b;
  }
  nebulaGeom.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
  const nebulaMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, transparent: true, opacity: 0.55, depthWrite: false });
  const nebula = new THREE.Mesh(nebulaGeom, nebulaMat);
  scene.add(nebula);

  return {
    update(dt: number): void {
      // Parallax: distant layer barely moves, near layer drifts faster
      layers[0].rotation.y += 0.005 * dt;
      layers[1].rotation.y += 0.01 * dt;
      layers[2].rotation.y += 0.02 * dt;
    },
    layers,
  };
}
