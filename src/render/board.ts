// The arena: stands, sand floor, holes and critters.
import type { ItemType } from '../config';
import { STR } from '../strings';
import { critterSvg, dizzyStarsSvg, standsSvg } from './art';

export interface Point {
  x: number;
  y: number;
}

interface HoleEl {
  root: HTMLElement;
  critter: HTMLElement;
  item: ItemType | null;
  id: number;
}

export class Board {
  readonly wrap: HTMLElement;
  readonly stands: HTMLElement;
  readonly arena: HTMLElement;
  readonly grid: HTMLElement;
  readonly fxLayer: HTMLElement;
  readonly overlay: HTMLElement;
  private holes: HoleEl[] = [];
  private n = 0;
  private focusIndex = 0;
  private whackCb: (hole: number, at: Point | null) => void = () => {};

  constructor(parent: HTMLElement) {
    this.wrap = el('div', 'board-wrap');
    this.stands = el('div', 'stands');
    this.stands.innerHTML = standsSvg();
    this.arena = el('div', 'arena');
    const barrier = el('div', 'barrier');
    const sand = el('div', 'sand');
    this.grid = el('div', 'grid');
    this.grid.setAttribute('role', 'group');
    this.grid.setAttribute('aria-label', STR.boardAria);
    this.fxLayer = el('div', 'fx-layer');
    this.overlay = el('div', 'overlay');
    sand.append(this.grid);
    barrier.append(sand);
    this.arena.append(barrier, this.fxLayer, this.overlay);
    this.wrap.append(this.stands, this.arena);
    parent.append(this.wrap);

    this.grid.addEventListener('pointerdown', (e) => {
      const hole = (e.target as HTMLElement).closest<HTMLElement>('.hole');
      if (!hole || !this.grid.contains(hole)) return;
      e.preventDefault();
      const i = Number(hole.dataset.i);
      this.whackCb(i, this.toLocal(e.clientX, e.clientY));
    });
    this.grid.addEventListener('keydown', (e) => this.onKey(e));
  }

  onWhack(cb: (hole: number, at: Point | null) => void): void {
    this.whackCb = cb;
  }

  get size(): number {
    return this.n;
  }

  build(n: number): void {
    this.n = n;
    this.grid.innerHTML = '';
    this.grid.style.setProperty('--n', String(n));
    this.arena.dataset.n = String(n);
    this.holes = [];
    for (let i = 0; i < n * n; i++) {
      const root = el('div', 'hole');
      root.dataset.i = String(i);
      root.setAttribute('role', 'button');
      root.tabIndex = i === 0 ? 0 : -1;
      const pit = el('div', 'pit');
      const win = el('div', 'win');
      const critter = el('div', 'critter');
      win.append(critter);
      const lip = el('div', 'lip');
      const daze = el('div', 'daze');
      daze.innerHTML = dizzyStarsSvg();
      root.append(pit, win, lip, daze);
      this.grid.append(root);
      const h: HoleEl = { root, critter, item: null, id: 0 };
      this.holes.push(h);
      this.label(i);
    }
    this.focusIndex = 0;
  }

  spawn(hole: number, id: number, item: ItemType): void {
    const h = this.holes[hole];
    if (!h) return;
    h.item = item;
    h.id = id;
    h.critter.innerHTML = critterSvg(item);
    h.root.classList.remove('hit', 'wrong', 'up');
    h.root.dataset.animal = item.animal;
    // Force a style flush so the rise transition runs from the hidden position.
    void h.critter.offsetWidth;
    h.root.classList.add('up');
    this.label(hole);
  }

  bonk(hole: number, wrong: boolean): void {
    const h = this.holes[hole];
    if (!h) return;
    h.root.classList.add('hit');
    if (wrong) h.root.classList.add('wrong');
  }

  sink(hole: number, id: number): void {
    const h = this.holes[hole];
    if (!h || h.id !== id) return;
    h.root.classList.remove('up');
  }

  clear(hole: number, id: number): void {
    const h = this.holes[hole];
    if (!h || h.id !== id) return;
    h.root.classList.remove('up', 'hit', 'wrong');
    h.critter.innerHTML = '';
    h.item = null;
    this.label(hole);
  }

  clearAll(): void {
    for (let i = 0; i < this.holes.length; i++) {
      const h = this.holes[i];
      h.root.classList.remove('up', 'hit', 'wrong');
      h.item = null;
      h.id = 0;
      this.label(i);
    }
  }

  /** Centre-top of a hole in arena-local px, for floating text. */
  holePoint(hole: number): Point {
    const h = this.holes[hole];
    if (!h) return { x: 0, y: 0 };
    const r = h.root.getBoundingClientRect();
    return this.toLocal(r.left + r.width / 2, r.top + r.height * 0.4);
  }

  focusGrid(): void {
    this.holes[this.focusIndex]?.root.focus({ preventScroll: true });
  }

  private toLocal(x: number, y: number): Point {
    const a = this.arena.getBoundingClientRect();
    return { x: x - a.left, y: y - a.top };
  }

  private label(i: number): void {
    const h = this.holes[i];
    const row = Math.floor(i / this.n);
    const col = i % this.n;
    h.root.setAttribute(
      'aria-label',
      STR.holeAria(row, col, h.item ? STR.itemLabel(h.item.animal, h.item.color) : null),
    );
  }

  private onKey(e: KeyboardEvent): void {
    const n = this.n;
    let i = this.focusIndex;
    const cur = (e.target as HTMLElement).closest<HTMLElement>('.hole');
    if (cur) i = Number(cur.dataset.i);
    let next = i;
    switch (e.key) {
      case 'ArrowLeft':
        next = i % n === 0 ? i + n - 1 : i - 1;
        break;
      case 'ArrowRight':
        next = i % n === n - 1 ? i - n + 1 : i + 1;
        break;
      case 'ArrowUp':
        next = i - n < 0 ? i + n * (n - 1) : i - n;
        break;
      case 'ArrowDown':
        next = i + n >= n * n ? i % n : i + n;
        break;
      case ' ':
      case 'Spacebar':
      case 'Enter':
        e.preventDefault();
        if (!e.repeat) {
          const r = this.holes[i].root.getBoundingClientRect();
          this.whackCb(i, this.toLocal(r.left + r.width / 2, r.top + r.height * 0.45));
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    this.holes[i].root.tabIndex = -1;
    this.focusIndex = next;
    const h = this.holes[next];
    h.root.tabIndex = 0;
    h.root.focus({ preventScroll: true });
  }
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
