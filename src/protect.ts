const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function blockedShortcut(e: KeyboardEvent): boolean {
  if (e.key === 'F12' || e.code === 'F12') return true;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return false;
  const code = e.code;
  if (e.shiftKey && ['KeyI', 'KeyJ', 'KeyC', 'KeyK', 'KeyE', 'KeyM'].includes(code)) return true;
  if (e.metaKey && e.altKey && ['KeyI', 'KeyJ', 'KeyC', 'KeyU'].includes(code)) return true;
  if (!e.shiftKey && !e.altKey && (code === 'KeyU' || code === 'KeyS')) return true;
  return false;
}

function stop(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

function lockScreen() {
  const root = document.getElementById('root');
  if (root) root.remove();
  document.body.replaceChildren();
  document.body.removeAttribute('class');
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:#08060a;color:#f6f0ed;font:600 16px/1.6 system-ui,sans-serif;text-align:center';
  box.textContent = 'A fejlesztői eszközök ezen az oldalon nem használhatók. Zárd be őket, és az oldal magától újratölt.';
  document.body.appendChild(box);
}

export function shouldProtect(): boolean {
  if (import.meta.env.VITE_PROTECT_EVERYWHERE === '1') return true;
  return import.meta.env.PROD && !LOCAL_HOSTS.has(window.location.hostname);
}

export function installProtection() {
  window.addEventListener('contextmenu', stop, { capture: true });
  window.addEventListener('keydown', (e) => { if (blockedShortcut(e)) stop(e); }, { capture: true });
  window.addEventListener('dragstart', (e) => { if (e.target instanceof HTMLImageElement) stop(e); }, { capture: true });

  const trap = new Function('debugger') as () => void;
  let locked = false;
  let quietChecks = 0;

  window.setInterval(() => {
    const started = performance.now();
    trap();
    const paused = performance.now() - started > 120;
    if (paused) {
      quietChecks = 0;
      if (!locked) {
        locked = true;
        lockScreen();
        console.clear();
      }
      return;
    }
    if (locked && ++quietChecks >= 3) window.location.reload();
  }, 700);
}
