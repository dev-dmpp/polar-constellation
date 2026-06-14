/**
 * Input: keyboard + mouse. The ship aims toward the cursor and accelerates
 * with W/Up, brakes with Space.
 */
export class InputManager {
  private keys = new Set<string>();
  private mouse: { x: number; y: number; nx: number; ny: number; down: boolean } = {
    x: 0, y: 0, nx: 0, ny: 0, down: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent): void => { this.keys.delete(e.code); };
  private onBlur = (): void => { this.keys.clear(); };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.mouse.nx = (this.mouse.x / rect.width) * 2 - 1;
    this.mouse.ny = -((this.mouse.y / rect.height) * 2 - 1);
  };
  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) this.mouse.down = true;
  };
  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.mouse.down = false;
  };

  isDown(code: string): boolean { return this.keys.has(code); }

  getMouse(): { nx: number; ny: number; x: number; y: number; down: boolean } {
    return this.mouse;
  }

  /** Returns true if thrust is being applied (W or Up). */
  isThrusting(): boolean {
    return this.keys.has('KeyW') || this.keys.has('ArrowUp');
  }

  /** Returns true if brake is held (Space). */
  isBraking(): boolean {
    return this.keys.has('Space');
  }

  isBoosting(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
}
