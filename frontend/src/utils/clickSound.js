// Petit "bip" d'interface joué à chaque clic sur un bouton / lien-bouton.
// Son synthétisé (Web Audio) — aucun fichier, fonctionne hors ligne.

const STORAGE_KEY = 'clickSound';
const SELECTOR = 'button, [role="button"], a[href], summary';

let ctx = null;
let lastPlay = 0;

export function isClickSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setClickSoundEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (on) primeAudio();
}

// Doit être appelé depuis un geste utilisateur (clic) pour débloquer l'audio.
function primeAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function beep() {
  const now = performance.now();
  if (now - lastPlay < 40) return; // évite le spam sur double-clic
  lastPlay = now;

  primeAudio();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // petit "tick" clair et court : montée rapide 1200 -> 1650 Hz
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(1650, t + 0.028);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function initClickSound() {
  if (typeof document === 'undefined') return;
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === '' && e.button !== 0) return; // clic non principal
      if (!isClickSoundEnabled()) return;
      const el = e.target?.closest?.(SELECTOR);
      if (!el) return;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      beep();
    },
    true,
  );
}
