// Overlay cards over the pitch, inside the hoardings: matchday ticket, stage intro, full time.
import type { Stage } from '../game';
import { STR } from '../strings';
import { el } from './board';
import { critterSvg } from './art';

export interface FullTimeInfo {
  score: number;
  stage: number;
  bestScore: number;
  newBest: boolean;
}

export function stageTitle(stage: Stage): { title: string; rule: string } {
  if (stage.encore > 0) return { title: STR.extraTimeTitle(stage.encore), rule: STR.extraTimeRule };
  return STR.stages[stage.index];
}

export class Overlay {
  constructor(private root: HTMLElement) {}

  hide(): void {
    this.root.classList.remove('show');
    this.root.innerHTML = '';
  }

  private show(card: HTMLElement, button: HTMLButtonElement, onGo: (viaKeyboard: boolean) => void): void {
    this.root.innerHTML = '';
    this.root.append(card);
    this.root.classList.add('show');
    let done = false;
    button.addEventListener('click', (e) => {
      if (done) return;
      done = true;
      // detail === 0 means the click came from the keyboard (Enter/Space).
      onGo(e.detail === 0);
    });
    window.setTimeout(() => button.focus({ preventScroll: true }), 30);
  }

  /** Start screen: a matchday ticket. The Play button is the tear-off stub. */
  ticket(best: number, onPlay: (viaKeyboard: boolean) => void): void {
    const card = el('div', 'ticket');
    const main = el('div', 'ticket-main');
    const kicker = el('div', 'ticket-kicker');
    kicker.textContent = STR.ticketKicker;
    const title = el('div', 'ticket-title');
    title.textContent = STR.gameTitle;
    const art = el('div', 'ticket-art');
    art.innerHTML = [
      critterSvg({ animal: 'rabbit', color: 'blue' }),
      critterSvg({ animal: 'mole', color: 'red' }),
      critterSvg({ animal: 'fox', color: 'yellow' }),
    ]
      .map((s) => `<div class="ticket-critter">${s}</div>`)
      .join('');
    const fixture = el('div', 'ticket-fixture');
    fixture.textContent = STR.ticketFixture;
    const seat = el('div', 'ticket-seat');
    seat.textContent = STR.ticketGround;
    main.append(kicker, title, art, fixture, seat);
    if (best > 0) {
      const b = el('div', 'ticket-best');
      b.textContent = STR.ticketBest(best);
      main.append(b);
    }
    const stub = el('button', 'ticket-stub');
    stub.type = 'button';
    stub.innerHTML = `<span class="stub-main">${STR.ticketPlay}</span><span class="stub-sub">${STR.ticketStubSub}</span>`;
    card.append(main, stub);
    this.show(card, stub, onPlay);
  }

  intro(stage: Stage, onGo: (viaKeyboard: boolean) => void): void {
    const t = stageTitle(stage);
    const card = el('div', 'card intro');
    const num = el('div', 'card-kicker');
    num.textContent = STR.introStageLine(stage.number, stage.grid);
    const h = el('h2', 'card-title');
    h.textContent = t.title;
    const rule = el('p', 'card-rule');
    rule.textContent = t.rule;
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.introGo;
    card.append(num, h, rule, btn);
    this.show(card, btn, onGo);
  }

  fullTime(info: FullTimeInfo, onAgain: (viaKeyboard: boolean) => void): void {
    const card = el('div', 'card fulltime');
    const h = el('h2', 'card-title');
    h.textContent = STR.fullTimeTitle;
    const dl = el('dl', 'ft-stats');
    const row = (k: string, v: string | number) => {
      const dt = el('dt');
      dt.textContent = k;
      const dd = el('dd');
      dd.textContent = String(v);
      dl.append(dt, dd);
    };
    row(STR.fullTimeScore, info.score);
    row(STR.fullTimeStage, info.stage);
    row(STR.fullTimeBest, info.bestScore);
    card.append(h);
    if (info.newBest) {
      const nb = el('div', 'ft-newbest');
      nb.textContent = STR.fullTimeNewBest;
      card.append(nb);
    }
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.playAgain;
    card.append(dl, btn);
    this.show(card, btn, onAgain);
  }
}
