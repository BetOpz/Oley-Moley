// The stadium scoreboard in the top stand: score with streak, division and stage, football lives,
// yellow/red cards and the four-section Olé meter (stage progress), plus the sound and colour
// toggles.
import { OLE_SECTIONS, TUNING } from '../config';
import type { Stage } from '../game';
import { oleThresholds } from '../game';
import { STR } from '../strings';
import { el } from './board';
import { cardSvg, contrastSvg, footballSvg, speakerSvg } from './art';
import { pulseClass } from './fx';

export class Hud {
  readonly colourToggle: HTMLButtonElement;
  readonly muteToggle: HTMLButtonElement;
  private scoreEl: HTMLElement;
  private streakEl: HTMLElement;
  private divisionEl: HTMLElement;
  private stageEl: HTMLElement;
  private livesEl: HTMLElement;
  private balls: HTMLElement[] = [];
  private cardsEl: HTMLElement;
  private yellowEl: HTMLElement;
  private redEl: HTMLElement;
  private meter: HTMLElement;
  private sections: { root: HTMLElement; fill: HTMLElement }[] = [];

  constructor(parent: HTMLElement) {
    const sb = el('div', 'scoreboard');

    const head = el('div', 'sb-head');
    const title = el('h1', 'sb-title');
    title.textContent = STR.gameTitle;
    const tools = el('div', 'sb-tools');
    this.muteToggle = el('button', 'sb-btn mute-toggle');
    this.muteToggle.type = 'button';
    this.muteToggle.title = STR.mute;
    this.muteToggle.setAttribute('aria-label', STR.mute);
    this.muteToggle.innerHTML = speakerSvg();
    this.colourToggle = el('button', 'sb-btn colour-toggle');
    this.colourToggle.type = 'button';
    this.colourToggle.title = STR.colourToggle;
    this.colourToggle.setAttribute('aria-label', STR.colourToggle);
    this.colourToggle.innerHTML = contrastSvg();
    tools.append(this.muteToggle, this.colourToggle);
    head.append(title, tools);

    const cells = el('div', 'sb-cells');
    const cell = (label: string, cls: string) => {
      const c = el('div', `sb-cell ${cls}`);
      const l = el('span', 'sb-label');
      l.textContent = label;
      const v = el('span', 'sb-value');
      c.append(l, v);
      cells.append(c);
      return v;
    };
    const score = cell(STR.score, 'sb-score');
    this.scoreEl = el('span', 'sb-digits');
    this.streakEl = el('span', 'sb-streak');
    score.append(this.scoreEl, this.streakEl);
    this.divisionEl = cell(STR.division, 'sb-division');
    this.stageEl = cell(STR.stage, 'sb-stage');
    this.livesEl = cell(STR.lives, 'sb-lives');
    this.livesEl.setAttribute('role', 'img');
    for (let i = 0; i < TUNING.maxLives; i++) {
      const b = el('span', 'ball');
      b.innerHTML = footballSvg();
      this.livesEl.append(b);
      this.balls.push(b);
    }
    this.cardsEl = cell(STR.cards, 'sb-cards');
    this.cardsEl.setAttribute('role', 'img');
    this.yellowEl = el('span', 'sb-card yellow');
    this.yellowEl.innerHTML = cardSvg('yellow');
    this.redEl = el('span', 'sb-card red');
    this.redEl.innerHTML = cardSvg('red');
    this.cardsEl.append(this.yellowEl, this.redEl);

    this.meter = el('div', 'meter');
    this.meter.setAttribute('role', 'progressbar');
    this.meter.setAttribute('aria-label', STR.meterAria);
    for (let i = 0; i < OLE_SECTIONS; i++) {
      const root = el('div', 'meter-section');
      const fill = el('div', 'meter-fill');
      root.append(fill);
      this.meter.append(root);
      this.sections.push({ root, fill });
    }

    sb.append(head, cells, this.meter);
    parent.append(sb);
  }

  setScore(score: number, streak: number): void {
    this.scoreEl.textContent = String(score);
    this.streakEl.textContent = streak >= 2 ? STR.streak(streak) : '';
  }

  setStage(stage: Stage): void {
    this.divisionEl.textContent = String(stage.division);
    this.divisionEl.title = STR.divisions[stage.division - 1];
    this.stageEl.textContent = stage.encore ? STR.extraTimeShort(stage.encore) : String(stage.number);
  }

  setLives(n: number): void {
    this.balls.forEach((b, i) => b.classList.toggle('lost', i >= n));
    this.livesEl.setAttribute('aria-label', STR.livesAria(n, TUNING.maxLives));
  }

  /** Yellow cards this stage. `shown` flashes the card just given (a red then resets to none). */
  setCards(yellows: number, shown: 'yellow' | 'red' | null = null): void {
    this.yellowEl.classList.toggle('on', yellows > 0);
    if (shown === 'yellow') pulseClass(this.yellowEl, 'flash', 700);
    if (shown === 'red') pulseClass(this.redEl, 'flash-red', 1400);
    this.cardsEl.setAttribute('aria-label', STR.cardsAria(yellows));
  }

  /** Fill the four sections. A section lights up once its threshold is reached. */
  setProgress(p: number, goal: number): void {
    const t = oleThresholds(goal);
    let from = 0;
    this.sections.forEach((s, i) => {
      const to = t[i];
      const frac = to > from ? Math.max(0, Math.min(1, (p - from) / (to - from))) : p >= to ? 1 : 0;
      s.fill.style.width = `${frac * 100}%`;
      s.root.classList.toggle('lit', p >= to);
      from = to;
    });
    this.meter.setAttribute('aria-valuenow', String(p));
    this.meter.setAttribute('aria-valuemax', String(goal));
  }

  setMuted(muted: boolean): void {
    this.muteToggle.classList.toggle('muted', muted);
    this.muteToggle.setAttribute('aria-pressed', String(muted));
  }
}
