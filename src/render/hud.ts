// Scoreboard (top stand), advertising boards round the pitch, crowd colour, rule flash.
import { PALETTE, STREAK, TUNING } from '../config';
import type { ItemType, Mode } from '../config';
import type { Stage } from '../game';
import { STR } from '../strings';
import { el } from './board';
import type { Board } from './board';
import { boardPanelUri, carnationSvg, fanSvg, tileSvg } from './art';
import type { Side } from './art';
import { pulseClass, reducedMotion } from './fx';

/** Clockwise order the colour wipe runs round the boards. */
const WIPE_ORDER: Side[] = ['top', 'right', 'bottom', 'left'];
const WIPE_STEP_MS = 110;
const WIPE_MS = 260;
const RULE_FLASH_MS = 1500;

/** Streak values at which the Olé meter passes each third, and the stand that cheers. */
const METER_THIRDS: [number, Side][] = [
  [Math.ceil(STREAK.fanSegments / 3), 'left'],
  [Math.ceil((STREAK.fanSegments * 2) / 3), 'right'],
  [STREAK.fanSegments, 'bottom'],
];

export class Hud {
  readonly colourToggle: HTMLButtonElement;
  private scoreEl: HTMLElement;
  private stageEl: HTMLElement;
  private livesEl: HTMLElement;
  private carnations: HTMLElement[] = [];
  private fanEl: HTMLElement;
  private fanSegs: SVGGElement[] = [];
  private progressBar: HTMLElement;
  private progressEl: HTMLElement;
  private nextEl: HTMLElement;
  private ruleFlash: HTMLElement;
  private ruleLive: HTMLElement;
  private flashTimer = 0;
  private lastTargetKey = '';

  constructor(private board: Board) {
    // ---- scoreboard
    const sb = el('div', 'scoreboard');
    const head = el('div', 'sb-head');
    const title = el('h1', 'sb-title');
    title.textContent = STR.gameTitle;
    this.colourToggle = el('button', 'colour-toggle');
    this.colourToggle.type = 'button';
    this.colourToggle.title = STR.colourToggle;
    this.colourToggle.setAttribute('aria-label', STR.colourToggle);
    this.colourToggle.textContent = '◐';
    head.append(title, this.colourToggle);

    const cells = el('div', 'sb-cells');
    const cell = (label: string) => {
      const c = el('div', 'sb-cell');
      const l = el('span', 'sb-label');
      l.textContent = label;
      const v = el('span', 'sb-value');
      c.append(l, v);
      cells.append(c);
      return { c, v };
    };
    this.scoreEl = cell(STR.score).v;
    this.stageEl = cell(STR.stage).v;
    const lives = cell(STR.lives);
    lives.c.classList.add('sb-lives');
    this.livesEl = lives.v;
    this.livesEl.setAttribute('role', 'img');
    for (let i = 0; i < TUNING.maxLives; i++) {
      const s = el('span', 'carnation');
      s.innerHTML = carnationSvg();
      this.livesEl.append(s);
      this.carnations.push(s);
    }
    const ole = cell('Olé');
    ole.c.classList.add('sb-ole');
    this.fanEl = el('div', 'fan');
    this.fanEl.innerHTML = fanSvg(STREAK.fanSegments);
    this.fanSegs = Array.from(this.fanEl.querySelectorAll<SVGGElement>('.fan-seg'));
    ole.v.append(this.fanEl);

    this.progressEl = el('div', 'progress');
    this.progressEl.setAttribute('role', 'progressbar');
    this.progressEl.setAttribute('aria-label', 'Stage progress');
    this.progressBar = el('div', 'progress-bar');
    this.progressEl.append(this.progressBar);

    sb.append(head, cells, this.progressEl);
    board.stands.top.append(sb);

    // ---- next targets plate on the top board
    this.nextEl = el('div', 'next-plate');
    board.pitch.append(this.nextEl);

    // ---- rule flash in the centre circle (never takes pointer events)
    this.ruleFlash = el('div', 'rule-flash');
    this.ruleFlash.setAttribute('aria-hidden', 'true');
    board.arena.append(this.ruleFlash);
    // Screen readers get the rule from a polite live region instead.
    this.ruleLive = el('div', 'sr-only');
    this.ruleLive.setAttribute('aria-live', 'polite');
    board.arena.append(this.ruleLive);

    this.setFan(0);
  }

  setScore(score: number): void {
    this.scoreEl.textContent = String(score);
  }

  setStage(stage: Stage): void {
    this.stageEl.textContent = stage.encore ? `${stage.number}★` : String(stage.number);
  }

  setLives(n: number): void {
    this.carnations.forEach((c, i) => c.classList.toggle('lost', i >= n));
    this.livesEl.setAttribute('aria-label', STR.livesAria(n, TUNING.maxLives));
  }

  /**
   * Show the current target on the boards and in the crowd, and the next three on the
   * top board. When the target changed and `announce` is set, the colour wipes round
   * the boards and the rule flashes in the centre circle.
   */
  setTarget(mode: Mode, queue: ItemType[], announce: boolean): void {
    // Before a run starts the queue is empty: show the plain mole boards.
    const now: ItemType = queue[0] ?? { animal: 'mole', color: 'none' };
    const key = `${mode}:${now.animal}:${now.color}`;
    const changed = key !== this.lastTargetKey;
    this.lastTargetKey = key;
    this.setNext(mode, queue.slice(1, 4), changed && announce);
    if (!changed) return;

    const plain = mode === 'plain' || now.color === 'none';
    const root = document.documentElement.style;
    root.setProperty('--tgt', plain ? PALETTE.gold : PALETTE.hats[now.color]);
    root.setProperty('--tgt-dark', plain ? PALETTE.deepRed : PALETTE.hatsDark[now.color]);
    document.documentElement.dataset.tgt = plain ? 'none' : now.color;

    const wipe = announce && !reducedMotion();
    WIPE_ORDER.forEach((side, i) => {
      const b = this.board.boards[side];
      const vertical = side === 'left' || side === 'right';
      const layer = el('div', 'ad-layer');
      layer.style.backgroundImage = boardPanelUri(now, mode, vertical);
      if (wipe) {
        layer.classList.add('wipe');
        layer.style.animationDelay = `${i * WIPE_STEP_MS}ms`;
      }
      b.append(layer);
      // Drop the layers underneath once the new one covers them.
      const old = Array.from(b.children).slice(0, -1);
      window.setTimeout(() => old.forEach((o) => o.remove()), wipe ? i * WIPE_STEP_MS + WIPE_MS + 40 : 0);
    });

    if (announce) this.flashRule(mode, now);
  }

  /** Flash the rule text in the centre circle for about 1.5 s. */
  flashRule(mode: Mode, target: ItemType): void {
    const text = ruleText(mode, target);
    this.ruleFlash.innerHTML = '';
    const main = el('span', 'rule-main');
    main.textContent = text.main;
    this.ruleFlash.append(main);
    if (text.hint) {
      const hint = el('span', 'rule-hint');
      hint.textContent = text.hint;
      this.ruleFlash.append(hint);
    }
    this.ruleLive.textContent = text.hint ? `${text.main} ${text.hint}` : text.main;
    this.ruleFlash.classList.remove('show');
    void this.ruleFlash.offsetWidth;
    this.ruleFlash.classList.add('show');
    window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => this.ruleFlash.classList.remove('show'), RULE_FLASH_MS);
  }

  private setNext(mode: Mode, next: ItemType[], shifted: boolean): void {
    this.nextEl.classList.toggle('hidden', mode === 'plain');
    if (mode === 'plain') {
      this.nextEl.innerHTML = '';
      return;
    }
    this.nextEl.innerHTML = '';
    const label = el('span', 'next-label');
    label.textContent = STR.nextLabel;
    this.nextEl.append(label);
    next.forEach((item, i) => {
      const t = el('div', 'tile');
      t.innerHTML = tileSvg(item, mode);
      if (shifted) {
        t.classList.add('slide');
        if (i === next.length - 1) t.classList.add('slide-new');
      }
      this.nextEl.append(t);
    });
  }

  /** Update the Olé meter. Returns the stand that should cheer, if a third was just reached. */
  setFan(streak: number, prevStreak = streak): Side | null {
    const open = Math.min(streak, STREAK.fanSegments);
    const span = 160 / STREAK.fanSegments;
    this.fanSegs.forEach((s, i) => {
      s.style.transform = `rotate(${i < open ? i * span : 0}deg)`;
      s.classList.toggle('closed', i >= Math.max(open, 1));
    });
    this.fanEl.classList.toggle('full', open >= STREAK.fanSegments);
    this.fanEl.setAttribute('title', `Olé ×${streak}`);
    for (const [at, side] of METER_THIRDS) {
      if (prevStreak < at && streak >= at) return side;
    }
    return null;
  }

  setProgress(p: number, goal: number): void {
    const pct = Math.max(0, Math.min(1, p / goal)) * 100;
    this.progressBar.style.width = `${pct}%`;
    this.progressEl.setAttribute('aria-valuenow', String(p));
    this.progressEl.setAttribute('aria-valuemax', String(goal));
  }

  /** One stand jumps up and cheers. */
  cheer(side: Side): void {
    pulseClass(this.board.stands[side], 'cheer', 1000);
  }

  /** All four stands cheer (stage clear). */
  cheerAll(): void {
    for (const side of WIPE_ORDER) pulseClass(this.board.stands[side], 'cheer-big', 1500);
  }
}

function ruleText(mode: Mode, target: ItemType): { main: string; hint: string } {
  if (mode === 'plain' || target.color === 'none') return { main: STR.ruleAny, hint: '' };
  return {
    main: mode === 'hat' ? STR.ruleHat(target.color) : STR.ruleAnimal(target.animal, target.color),
    hint: STR.patternHint(target.color),
  };
}
