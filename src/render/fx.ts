// Text pops, floating points, confetti and the shake.
import { el } from './board';
import type { Point } from './board';

const CONFETTI = ['#d62b36', '#f4c430', '#2f6fd6', '#ffffff', '#7b3fa8', '#3f9b4a'];

export function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function removeLater(node: Element, ms: number): void {
  window.setTimeout(() => node.remove(), ms);
}

export type PopTone = 'cheer1' | 'cheer2' | 'cheer3' | 'oops';

export class Fx {
  constructor(
    private layer: HTMLElement,
    private shakeTarget: HTMLElement,
  ) {}

  /** A text pop over the pitch: the crowd's cheers (bigger each section) or a mistake. */
  pop(text: string, tone: PopTone): void {
    // Keep only the newest pop so text never stacks unreadably on a phone.
    this.layer.querySelectorAll('.pop').forEach((c) => c.remove());
    const c = el('div', `pop pop-${tone}`);
    c.textContent = text;
    c.setAttribute('role', 'status');
    this.layer.append(c);
    removeLater(c, 1300);
  }

  points(at: Point, text: string): void {
    const p = el('div', 'float-points');
    p.textContent = text;
    p.style.left = `${at.x}px`;
    p.style.top = `${at.y}px`;
    this.layer.append(p);
    removeLater(p, 900);
  }

  shake(): void {
    if (reducedMotion()) return;
    pulseClass(this.shakeTarget, 'shake', 400);
  }

  /** Confetti over the pitch for a stage clear. */
  confetti(): void {
    if (reducedMotion()) return;
    const w = this.layer.clientWidth;
    for (let i = 0; i < 70; i++) {
      const c = el('div', 'confetti');
      c.style.left = `${Math.random() * w}px`;
      c.style.background = CONFETTI[i % CONFETTI.length];
      c.style.animationDelay = `${Math.random() * 0.7}s`;
      c.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
      c.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 80)}px`);
      c.style.setProperty('--spin', `${Math.round(360 + Math.random() * 720)}deg`);
      this.layer.append(c);
      removeLater(c, 2400);
    }
  }

  reset(): void {
    this.layer.innerHTML = '';
  }
}

/** Briefly toggle a class to retrigger a CSS animation. */
export function pulseClass(node: Element, cls: string, ms: number): void {
  node.classList.remove(cls);
  void (node as HTMLElement).offsetWidth;
  node.classList.add(cls);
  window.setTimeout(() => node.classList.remove(cls), ms);
}
