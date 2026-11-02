// Callouts, floating points, confetti, roses, sparkles, shake and the castanet tap.
import { el } from './board';
import type { Point } from './board';
import { castanetSvg, roseSvg, sparkleSvg } from './art';

const CONFETTI = ['#d8262c', '#f5c518', '#2a67d1', '#fff6e6', '#2e9e4f', '#e8b22c', '#6b2a96'];

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

export class Fx {
  private roses: HTMLElement[] = [];

  constructor(
    private layer: HTMLElement,
    private shakeTarget: HTMLElement,
  ) {}

  /** Big centred callout. `tone` styles it: ole levels or a mistake. */
  callout(text: string, tone: 'ole' | 'oleOle' | 'oleMax' | 'torero' | 'oops' | 'clear'): void {
    // Keep only the newest callout so text never stacks unreadably on a phone.
    this.layer.querySelectorAll('.callout').forEach((c) => c.remove());
    const c = el('div', `callout callout-${tone}`);
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

  castanet(at: Point): void {
    const c = el('div', 'castanet');
    c.innerHTML = castanetSvg();
    c.style.left = `${at.x}px`;
    c.style.top = `${at.y}px`;
    this.layer.append(c);
    removeLater(c, 320);
  }

  shake(): void {
    if (reducedMotion()) return;
    this.shakeTarget.classList.remove('shake');
    void this.shakeTarget.offsetWidth;
    this.shakeTarget.classList.add('shake');
    removeLaterClass(this.shakeTarget, 'shake', 400);
  }

  sparkle(): void {
    const w = this.layer.clientWidth;
    const h = this.layer.clientHeight;
    for (let i = 0; i < 14; i++) {
      const s = el('div', 'sparkle');
      s.innerHTML = sparkleSvg();
      s.style.left = `${8 + Math.random() * (w - 16)}px`;
      s.style.top = `${8 + Math.random() * (h - 16)}px`;
      s.style.animationDelay = `${Math.random() * 0.35}s`;
      this.layer.append(s);
      removeLater(s, 1200);
    }
  }

  /** A single rose tossed onto the sand. It stays until the stage ends. */
  roseLand(): void {
    const w = this.layer.clientWidth;
    const h = this.layer.clientHeight;
    const r = el('div', reducedMotion() ? 'rose rose-landed' : 'rose rose-toss');
    r.innerHTML = roseSvg();
    r.style.left = `${w * (0.15 + Math.random() * 0.7)}px`;
    r.style.top = `${h * (0.15 + Math.random() * 0.7)}px`;
    r.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
    this.layer.append(r);
    this.roses.push(r);
  }

  /** Roses and confetti rain onto the sand for a stage clear. */
  celebrate(): void {
    if (reducedMotion()) return;
    const w = this.layer.clientWidth;
    for (let i = 0; i < 60; i++) {
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
    for (let i = 0; i < 12; i++) {
      const r = el('div', 'rose rose-rain');
      r.innerHTML = roseSvg();
      r.style.left = `${Math.random() * (w - 30)}px`;
      r.style.animationDelay = `${Math.random() * 0.8}s`;
      r.style.setProperty('--rot', `${Math.round(Math.random() * 360)}deg`);
      r.style.setProperty('--land', `${Math.round(30 + Math.random() * 60)}%`);
      this.layer.append(r);
      removeLater(r, 2600);
    }
  }

  /** Remove lingering roses and effects (between stages). */
  reset(): void {
    this.roses.forEach((r) => r.remove());
    this.roses = [];
    this.layer.innerHTML = '';
  }
}

function removeLaterClass(node: Element, cls: string, ms: number): void {
  window.setTimeout(() => node.classList.remove(cls), ms);
}

/** Briefly toggle a class to retrigger a CSS animation. */
export function pulseClass(node: Element, cls: string, ms: number): void {
  node.classList.remove(cls);
  void (node as HTMLElement).offsetWidth;
  node.classList.add(cls);
  removeLaterClass(node, cls, ms);
}
