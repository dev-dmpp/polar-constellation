import type { BodyContent } from '../content/bodies';
import { showToast } from './panels';
import { resetSave } from '../core/gameState';
import { PROFILE } from '../content/profile';

export class HUD {
  private root: HTMLElement;
  private reticle!: HTMLElement;
  private telemetry!: HTMLElement;
  private speedEl!: HTMLElement;
  private distEl!: HTMLElement;
  private coordsEl!: HTMLElement;
  private starmap!: HTMLCanvasElement;
  private starmapCtx: CanvasRenderingContext2D;
  private bodyLabel!: HTMLElement;
  private bodyName!: HTMLElement;
  private bodySub!: HTMLElement;
  private interact!: HTMLElement;
  private panel!: HTMLElement;
  private panelContent!: HTMLElement;
  private visited: Set<string> = new Set();
  private save: { visited: string[] };

  constructor(save: { visited: string[] }) {
    this.save = save;
    save.visited.forEach((v) => this.visited.add(v));
    this.root = document.getElementById('hud')!;
    this.buildLayout();
    const ctx = this.starmap.getContext('2d');
    if (!ctx) throw new Error('no 2d ctx for starmap');
    this.starmapCtx = ctx;
  }

  private buildLayout(): void {
    this.root.innerHTML = '';
    // Reticle
    this.reticle = document.createElement('div');
    this.reticle.className = 'reticle';
    this.root.appendChild(this.reticle);

    // Hints
    const hints = document.createElement('div');
    hints.className = 'hints';
    hints.innerHTML = `
      <kbd>W</kbd>/<kbd>↑</kbd> impulso · <kbd>Space</kbd> frenar · <kbd>Shift</kbd> turbo<br>
      <kbd>Ratón</kbd> apuntar · <kbd>Click</kbd> orbitar cuerpo cercano<br>
      <kbd>E</kbd> abrir panel · <kbd>Tab</kbd> mapa estelar · <kbd>M</kbd> menú
    `;
    this.root.appendChild(hints);

    // Telemetry
    this.telemetry = document.createElement('div');
    this.telemetry.className = 'telemetry';
    this.telemetry.innerHTML = `
      <div class="row"><span class="lbl">Velocidad</span><span class="val" data-speed>0</span></div>
      <div class="row"><span class="lbl">Distancia</span><span class="val" data-dist>0</span></div>
      <div class="row"><span class="lbl">Sector</span><span class="val" data-coords>0, 0, 0</span></div>
    `;
    this.root.appendChild(this.telemetry);
    this.speedEl = this.telemetry.querySelector('[data-speed]')!;
    this.distEl = this.telemetry.querySelector('[data-dist]')!;
    this.coordsEl = this.telemetry.querySelector('[data-coords]')!;

    // Starmap
    this.starmap = document.createElement('canvas');
    this.starmap.className = 'starmap';
    this.starmap.width = 180;
    this.starmap.height = 180;
    this.root.appendChild(this.starmap);

    // Body label
    this.bodyLabel = document.createElement('div');
    this.bodyLabel.className = 'body-label';
    this.bodyName = document.createElement('div');
    this.bodyName.className = 'name';
    this.bodySub = document.createElement('div');
    this.bodySub.className = 'sub';
    this.bodyLabel.append(this.bodyName, this.bodySub);
    this.root.appendChild(this.bodyLabel);

    // Interact prompt
    this.interact = document.createElement('div');
    this.interact.className = 'interact';
    this.interact.textContent = 'Pulsa [E] para inspeccionar';
    this.root.appendChild(this.interact);

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    this.panelContent = document.createElement('div');
    this.panel.appendChild(this.panelContent);
    this.root.appendChild(this.panel);
  }

  setTelemetry(speed: number, dist: number, x: number, y: number, z: number): void {
    this.speedEl.textContent = `${Math.round(speed).toLocaleString('es')} km/h`;
    this.distEl.textContent = `${Math.round(dist).toLocaleString('es')} u.a.`;
    this.coordsEl.textContent = `${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}`;
  }

  setBodyLabel(name: string, sub: string, visible: boolean): void {
    this.bodyName.textContent = name;
    this.bodySub.textContent = sub;
    this.bodyLabel.classList.toggle('visible', visible);
  }

  setInteractVisible(visible: boolean): void {
    this.interact.classList.toggle('visible', visible);
  }

  /** Draws the starmap showing all bodies and the ship. */
  drawStarmap(bodies: Array<{ id: string; getWorldPosition(out: any): void; content: BodyContent }>, shipX: number, _shipY: number, shipZ: number): void {
    const ctx = this.starmapCtx;
    const w = this.starmap.width;
    const h = this.starmap.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = w / 4400; // map range to canvas
    ctx.clearRect(0, 0, w, h);

    // Grid rings
    ctx.strokeStyle = 'rgba(74, 126, 192, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 1; r < 5; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bodies
    for (const b of bodies) {
      const v = { x: 0, y: 0, z: 0 } as any;
      b.getWorldPosition(v);
      const px = cx + v.x * scale;
      const py = cy - v.z * scale;
      const color = b.id === 'polar' ? '#ff7a59' : b.id === 'repos' ? '#6ec1ff' : '#a3c7ff';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, b.id === 'polar' ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = 'rgba(213, 227, 255, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(b.content.name, px + 5, py + 3);
    }

    // Ship
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + shipX * scale, cy - shipZ * scale, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + shipX * scale, cy - shipZ * scale, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  openPanel(content: BodyContent): void {
    this.visited.add(content.id);
    if (!this.save.visited.includes(content.id)) this.save.visited.push(content.id);
    this.renderPanelContent(content);
    this.panel.classList.add('visible');
  }

  closePanel(): void {
    this.panel.classList.remove('visible');
  }

  private renderPanelContent(content: BodyContent): void {
    this.panelContent.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.textContent = content.name;
    const sub = document.createElement('div');
    sub.className = 'subtitle';
    sub.textContent = content.subtitle;
    const desc = document.createElement('p');
    desc.textContent = content.description;
    this.panelContent.append(h2, sub, desc);
    if (content.details) {
      for (const d of content.details) {
        const row = document.createElement('div');
        row.className = 'row';
        const k = document.createElement('span'); k.className = 'k'; k.textContent = d.k;
        const v = document.createElement('span'); v.className = 'v'; v.textContent = d.v;
        row.append(k, v);
        this.panelContent.appendChild(row);
      }
    }
    const actions = document.createElement('div');
    actions.className = 'actions';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar [E]';
    closeBtn.addEventListener('click', () => this.closePanel());
    actions.appendChild(closeBtn);
    if (content.id === 'polar') {
      const cv = document.createElement('button');
      cv.className = 'primary';
      cv.textContent = '📄 Descargar CV';
      cv.addEventListener('click', () => {
        showToast('CV: pendiente de subir (placeholder)');
      });
      actions.appendChild(cv);
    }
    if (content.links) {
      for (const link of content.links) {
        const a = document.createElement('button');
        a.textContent = link.label;
        a.addEventListener('click', () => window.open(link.url, '_blank', 'noopener'));
        actions.appendChild(a);
      }
    }
    this.panelContent.appendChild(actions);
  }

  togglePanel(content: BodyContent | null): void {
    if (!content) {
      this.closePanel();
      return;
    }
    if (this.panel.classList.contains('visible') && this.panelContent.querySelector('h2')?.textContent === content.name) {
      this.closePanel();
    } else {
      this.openPanel(content);
    }
  }

  showMenu(): void {
    const div = document.createElement('div');
    div.className = 'panel visible';
    div.style.transform = 'translateX(-50%) translateY(0)';
    div.innerHTML = `
      <h2>Menú</h2>
      <div class="subtitle">Constelación Polar</div>
      <p style="opacity:.7">David M. Pollard P. — ${PROFILE.location}</p>
      <div class="row"><span class="k">Contacto</span><span class="v">${PROFILE.email}</span></div>
      <div class="row"><span class="k">Teléfono</span><span class="v">${PROFILE.phone}</span></div>
      <div class="row"><span class="k">GitHub</span><span class="v">@dev-dmpp</span></div>
      <div class="actions">
        <button id="cv">📄 CV</button>
        <button id="reset">⚠ Reiniciar partida</button>
        <button id="close">Cerrar</button>
      </div>
    `;
    document.getElementById('hud')!.appendChild(div);
    div.querySelector('#cv')!.addEventListener('click', () => showToast('CV: pendiente de subir'));
    div.querySelector('#reset')!.addEventListener('click', () => {
      if (confirm('¿Borrar la partida guardada?')) {
        resetSave();
        window.location.reload();
      }
    });
    div.querySelector('#close')!.addEventListener('click', () => div.remove());
  }
}
