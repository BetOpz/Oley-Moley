// Header chips, rule panel, tile queue, Olé meter and progress bar.
import { STREAK, TUNING } from '../config';
import type { ItemType, Mode } from '../config';
import type { Stage } from '../game';
import { STR } from '../strings';
import { el } from './board';
import { carnationSvg, fanSvg, tileSvg } from './art';

export class Hud {
  readonly header: HTMLElement;
  readonly panel: HTMLElement;
  readonly colourToggle: HTMLButtonElement;
  private scoreEl: HTMLElement;
  private stageEl: HTMLElement;
  private livesEl: HTMLElement;
  private carnations: HTMLElement[] = [];
  private ruleEl: HTMLElement;
  private gridEl: HTMLElement;
  private queueRow: HTMLElement;
  private queueEl: HTMLElement;
  private fanEl: HTMLElement;
  private fanSegs: SVGGElement[] = [];
  private progressBar: HTMLElement;
  private progressEl: HTMLElement;
  private lastQueueKey = '';

  constructor(parent: HTMLElement) {
    this.header = el('header', 'hdr');
    const title = el('h1', 'title');
    title.textContent = STR.gameTitle;
    this.colourToggle = el('button', 'colour-toggle');
    this.colourToggle.type = 'button';
    this.colourToggle.title = STR.colourToggle;
    this.colourToggle.setAttribute('aria-label', STR.colourToggle);
    this.colourToggle.textContent = '◐';
    const titleRow = el('div', 'title-row');
    titleRow.append(title, this.colourToggle);

    const chips = el('div', 'chips');
    const chip = (label: string) => {
      const c = el('div', 'chip');
      const l = el('span', 'chip-label');
      l.textContent = label;
      const v = el('span', 'chip-value');
      c.append(l, v);
      chips.append(c);
      return { c, v };
    };
    this.scoreEl = chip(STR.score).v;
    this.scoreEl.setAttribute('aria-live', 'off');
    this.stageEl = chip(STR.stage).v;
    const lives = chip(STR.lives);
    lives.c.classList.add('chip-lives');
    this.livesEl = lives.v;
    this.livesEl.setAttribute('role', 'img');
    for (let i = 0; i < TUNING.maxLives; i++) {
      const s = el('span', 'carnation');
      s.innerHTML = carnationSvg();
      this.livesEl.append(s);
      this.carnations.push(s);
    }
    this.header.append(titleRow, chips);

    this.panel = el('section', 'panel');
    const ruleRow = el('div', 'rule-row');
    this.ruleEl = el('div', 'rule-text');
    this.ruleEl.setAttribute('aria-live', 'polite');
    this.gridEl = el('div', 'grid-size');
    ruleRow.append(this.ruleEl, this.gridEl);

    this.queueRow = el('div', 'queue-row');
    this.queueEl = el('div', 'queue');
    this.fanEl = el('div', 'fan');
    this.fanEl.innerHTML = fanSvg(STREAK.fanSegments);
    this.fanSegs = Array.from(this.fanEl.querySelectorAll<SVGGElement>('.fan-seg'));
    this.queueRow.append(this.queueEl, this.fanEl);

    this.progressEl = el('div', 'progress');
    this.progressEl.setAttribute('role', 'progressbar');
    this.progressBar = el('div', 'progress-bar');
    this.progressEl.append(this.progressBar);

    const inner = el('div', 'panel-inner');
    inner.append(ruleRow, this.queueRow, this.progressEl);
    this.panel.append(inner);
    parent.append(this.header, this.panel);
    this.setFan(0);
  }

  setScore(score: number): void {
    this.scoreEl.textContent = String(score);
  }

  setStage(stage: Stage): void {
    this.stageEl.textContent = stage.encore ? `${stage.number}★` : String(stage.number);
    this.gridEl.textContent = STR.gridSize(stage.grid);
    this.panel.dataset.mode = stage.mode;
  }

  setLives(n: number): void {
    this.carnations.forEach((c, i) => c.classList.toggle('lost', i >= n));
    this.livesEl.setAttribute('aria-label', STR.livesAria(n, TUNING.maxLives));
  }

  setRule(mode: Mode, target: ItemType): void {
    if (mode === 'plain' || target.color === 'none') {
      this.ruleEl.textContent = STR.ruleAny;
      return;
    }
    this.ruleEl.textContent =
      mode === 'hat' ? STR.ruleHat(target.color) : STR.ruleAnimal(target.animal, target.color);
    // The band pattern is named too, so the rule reads without colour.
    const hint = el('span', 'rule-pattern');
    hint.textContent = ` ${STR.patternHint(target.color)}`;
    this.ruleEl.append(hint);
  }

  /** Render the tile queue. `shifted` animates the tiles sliding left. */
  setQueue(queue: ItemType[], mode: Mode, shifted: boolean): void {
    this.queueRow.classList.toggle('plain', mode === 'plain');
    if (mode === 'plain') {
      this.queueEl.innerHTML = '';
      this.lastQueueKey = '';
      return;
    }
    const key = mode + queue.map((q) => q.animal + q.color).join('|');
    if (key === this.lastQueueKey && !shifted) return;
    this.lastQueueKey = key;
    this.queueEl.innerHTML = '';
    queue.forEach((item, i) => {
      const t = el('div', i === 0 ? 'tile tile-now' : 'tile');
      t.innerHTML = tileSvg(item, mode);
      if (i === 0) {
        const label = el('span', 'tile-label');
        label.textContent = STR.nowLabel;
        t.append(label);
        t.setAttribute('aria-hidden', 'true');
      }
      if (shifted) {
        t.classList.add('slide');
        if (i === queue.length - 1) t.classList.add('slide-new');
      }
      this.queueEl.append(t);
    });
  }

  setFan(streak: number): void {
    const open = Math.min(streak, STREAK.fanSegments);
    const span = 160 / STREAK.fanSegments;
    this.fanSegs.forEach((s, i) => {
      s.style.transform = `rotate(${i < open ? i * span : 0}deg)`;
      s.classList.toggle('closed', i >= Math.max(open, 1));
    });
    this.fanEl.classList.toggle('full', open >= STREAK.fanSegments);
    this.fanEl.setAttribute('title', `Olé ×${streak}`);
  }

  setProgress(p: number, goal: number): void {
    const pct = Math.max(0, Math.min(1, p / goal)) * 100;
    this.progressBar.style.width = `${pct}%`;
    this.progressEl.setAttribute('aria-valuenow', String(p));
    this.progressEl.setAttribute('aria-valuemax', String(goal));
  }
}
