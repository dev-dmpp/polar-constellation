export function showToast(msg: string): void {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('hud')!.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
