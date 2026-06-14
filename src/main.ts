import * as THREE from 'three';
import './styles/hud.css';
import { CAMERA, SHIP } from './core/config';
import { InputManager } from './core/input';
import { loadSave, persistSave } from './core/gameState';
import { createAudio } from './core/audio';
import { Ship } from './entities/ship';
import { buildBodies, updateBodies, type CelestialBody } from './world/bodies';
import { buildSky } from './world/skybox';
import { HUD } from './ui/hud';
import { showToast } from './ui/panels';

async function bootstrap(): Promise<void> {
  const app = document.getElementById('app')!;
  const save = loadSave();
  const settings = (await import('./core/gameState')).loadSettings();
  // Audio API is created here; track loads later when we have a real file.
  const audio = createAudio(settings);
  void audio;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);

  // Scene + camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.FOV, window.innerWidth / window.innerHeight, CAMERA.NEAR, CAMERA.FAR);
  camera.position.set(-380, 60, 90);
  camera.lookAt(0, 0, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0x4a5a8c, 0.45));
  const dirLight = new THREE.DirectionalLight(0xe8f1ff, 0.5);
  dirLight.position.set(200, 300, 200);
  scene.add(dirLight);

  // Sky + bodies + ship
  const sky = buildSky(scene);
  const bodies = buildBodies();
  for (const b of bodies) scene.add(b.group);
  const ship = new Ship();
  ship.setPosition(save.ship.x, save.ship.y, save.ship.z);
  scene.add(ship.group);

  // Input
  const input = new InputManager(renderer.domElement);

  // Engine particle trail
  const { attachEngineTrail } = await import('./effects/engineTrail');
  const trail = attachEngineTrail(ship);
  scene.add(ship.group); // ensure ship group is in scene

  // HUD
  const hud = new HUD({ visited: save.visited });

  // Resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Global keyboard shortcuts (E = nearest body panel, M = menu, Esc = close)
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyE') {
      const nearest = findNearestBody(bodies, ship.position);
      if (nearest) hud.togglePanel(nearest.content);
    } else if (e.code === 'KeyM') {
      hud.showMenu();
    } else if (e.code === 'Escape') {
      hud.closePanel();
    }
  });

  // Click on a body (raycast) opens its panel
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const meshes = bodies.map((b) => b.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      const hit = hits[0].object;
      const found = bodies.find((b) => b.mesh === hit || (b.mesh as any).children?.includes(hit));
      if (found) hud.togglePanel(found.content);
    } else {
      // No body hit: open the nearest one
      const nearest = findNearestBody(bodies, ship.position);
      if (nearest) hud.togglePanel(nearest.content);
    }
  });

  // Save state periodically
  setInterval(() => {
    save.ship.x = ship.position.x;
    save.ship.y = ship.position.y;
    save.ship.z = ship.position.z;
    persistSave(save);
  }, 5000);

  // Initial toast
  setTimeout(() => showToast('Bienvenido a la Constelación Polar'), 600);

  // Main loop
  const clock = new THREE.Clock();
  let elapsed = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    // Feed input state into the ship BEFORE update so trails know the state.
    ship.setInputState(input.isThrusting(), input.isBoosting());
    ship.update(dt, input);
    trail.update(dt);
    updateBodies(bodies, dt, elapsed);
    sky.update(dt);

    // Camera follow with tilt
    const desired = new THREE.Vector3(
      ship.position.x - Math.cos(ship.rotY) * 60,
      ship.position.y + 30,
      ship.position.z - Math.sin(ship.rotY) * 60,
    );
    camera.position.lerp(desired, CAMERA.FOLLOW_LERP);
    camera.lookAt(
      ship.position.x + Math.cos(ship.rotY) * CAMERA.LOOK_AHEAD,
      ship.position.y,
      ship.position.z + Math.sin(ship.rotY) * CAMERA.LOOK_AHEAD,
    );
    // Apply a slight 2.5D tilt to the camera up-vector
    camera.up.set(Math.sin(CAMERA.TILT), Math.cos(CAMERA.TILT), 0);

    // Find nearest body for HUD
    const nearest = findNearestBody(bodies, ship.position);
    if (nearest && nearest.content.id !== 'polar') {
      hud.setBodyLabel(nearest.content.name, nearest.content.subtitle, true);
      const wp = new THREE.Vector3();
      nearest.getWorldPosition(wp);
      hud.setInteractVisible(wp.distanceTo(ship.position) < SHIP.INTERACT_RANGE);
    } else {
      hud.setBodyLabel('', '', false);
      hud.setInteractVisible(false);
    }

    // Telemetry
    hud.setTelemetry(ship.speed, ship.dist, ship.position.x, ship.position.y, ship.position.z);
    // Starmap
    hud.drawStarmap(bodies, ship.position.x, ship.position.y, ship.position.z);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

function findNearestBody(bodies: CelestialBody[], pos: THREE.Vector3): CelestialBody | null {
  let nearest: CelestialBody | null = null;
  let bestDist = Infinity;
  for (const b of bodies) {
    const wp = new THREE.Vector3();
    b.getWorldPosition(wp);
    const d = wp.distanceTo(pos);
    if (d < bestDist) {
      bestDist = d;
      nearest = b;
    }
  }
  return nearest;
}

bootstrap().catch((e) => {
  console.error('Bootstrap failed', e);
  const c = document.getElementById('app')!;
  c.innerHTML = `<pre style="color:#ff6b6b; padding:20px">Error al iniciar: ${e}</pre>`;
});
