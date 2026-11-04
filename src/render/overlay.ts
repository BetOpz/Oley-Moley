// Overlay cards over the pitch, inside the hoardings: matchday ticket (with the division choice),
// stage intro, promotion and full time.
import { DIVISIONS } from '../config';
import type { Stage } from '../game';
import { STR } from '../strings';
import { el } from './board';
import { moleSvg } from './art';

export interface FullTimeInfo {
  score: number;
  stage: Stage;
  bestScore: number;
  newBest: boolean;
  highestDivision: number;
}

export function stageTitle(stage: Stage): { title: string; rule: string } {
  if (stage.encore > 0) return { title: STR.extraTimeTitle(stage.encore), rule: STR.extraTimeRule };
  return STR.stages[stage.number - 1];
}

export function stageLabel(stage: Stage): string {
  return stage.encore > 0 ? STR.extraTimeTitle(stage.encore) : `${STR.stage} ${stage.number}`;
}

type Go = (viaKeyboard: boolean) => void;
type GoDivision = (division: number, viaKeyboard: boolean) => void;

export class Overlay {
  constructor(private root: HTMLElement) {}

  hide(): void {
    this.root.classList.remove('show');
    this.root.innerHTML = '';
  }

  private show(card: HTMLElement, button: HTMLButtonElement, onGo: Go): void {
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

  /** A row of division buttons; only divisions already reached can be picked. */
  private divisionPicker(highest: number): { root: HTMLElement; value: () => number } {
    const root = el('div', 'div-pick');
    root.setAttribute('role', 'radiogroup');
    root.setAttribute('aria-label', STR.ticketChoose);
    let chosen = highest;
    const buttons: HTMLButtonElement[] = [];
    DIVISIONS.forEach((d, i) => {
      const n = i + 1;
      const b = el('button', 'div-btn');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="div-name">${STR.divisions[i]}</span><span class="div-grid">${d.grid} × ${d.grid}</span>`;
      b.disabled = n > highest;
      b.addEventListener('click', () => {
        chosen = n;
        buttons.forEach((x, j) => x.setAttribute('aria-checked', String(j + 1 === n)));
      });
      b.setAttribute('aria-checked', String(n === chosen));
      buttons.push(b);
      root.append(b);
    });
    return { root, value: () => chosen };
  }

  /** Start screen: a matchday ticket. The Play button is the tear-off stub. */
  ticket(best: number, highestDivision: number, onPlay: GoDivision): void {
    const card = el('div', 'ticket');
    const main = el('div', 'ticket-main');
    const kicker = el('div', 'ticket-kicker');
    kicker.textContent = STR.ticketKicker;
    const title = el('div', 'ticket-title');
    title.textContent = STR.gameTitle;
    const art = el('div', 'ticket-art');
    art.innerHTML = [
      moleSvg({ kit: 'blue', role: 'keeper', isRef: false }),
      moleSvg({ kit: 'red', role: 'player', isRef: false }),
      moleSvg({ kit: 'yellow', role: 'fan', isRef: false }),
    ]
      .map((s) => `<div class="ticket-critter">${s}</div>`)
      .join('');
    const fixture = el('div', 'ticket-fixture');
    fixture.textContent = STR.ticketFixture;
    main.append(kicker, title, art, fixture);
    let pick: { value: () => number } | null = null;
    if (highestDivision > 1) {
      const label = el('div', 'ticket-choose');
      label.textContent = STR.ticketChoose;
      const p = this.divisionPicker(highestDivision);
      pick = p;
      main.append(label, p.root);
    } else {
      const seat = el('div', 'ticket-seat');
      seat.textContent = STR.ticketGround;
      main.append(seat);
    }
    if (best > 0) {
      const b = el('div', 'ticket-best');
      b.textContent = STR.ticketBest(best);
      main.append(b);
    }
    const stub = el('button', 'ticket-stub');
    stub.type = 'button';
    stub.innerHTML = `<span class="stub-main">${STR.ticketPlay}</span><span class="stub-sub">${STR.ticketStubSub}</span>`;
    card.append(main, stub);
    this.show(card, stub, (kb) => onPlay(pick ? pick.value() : 1, kb));
  }

  intro(stage: Stage, onGo: Go): void {
    const t = stageTitle(stage);
    const card = el('div', 'card intro');
    const num = el('div', 'card-kicker');
    num.textContent = STR.introLine(
      STR.divisions[stage.division - 1],
      stage.encore ? 7 : stage.number,
      stage.grid,
    );
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

  /** Division complete: "Promoted to Division Two!" with the new board size. */
  promoted(stage: Stage, onGo: Go): void {
    const card = el('div', 'card promoted');
    const k = el('div', 'card-kicker promo-kicker');
    k.textContent = STR.promotedKicker;
    const h = el('h2', 'card-title');
    h.textContent = STR.promotedTitle(STR.divisions[stage.division - 1]);
    const rule = el('p', 'card-rule');
    rule.textContent = STR.promotedBoard(stage.grid);
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.promotedGo;
    card.append(k, h, rule, btn);
    this.show(card, btn, onGo);
  }

  fullTime(info: FullTimeInfo, onAgain: GoDivision): void {
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
    row(
      STR.fullTimeReached,
      STR.fullTimeReachedValue(STR.divisions[info.stage.division - 1], stageLabel(info.stage)),
    );
    row(STR.fullTimeBest, info.bestScore);
    card.append(h);
    if (info.newBest) {
      const nb = el('div', 'ft-newbest');
      nb.textContent = STR.fullTimeNewBest;
      card.append(nb);
    }
    card.append(dl);
    let pick: { value: () => number } | null = null;
    if (info.highestDivision > 1) {
      const p = this.divisionPicker(info.highestDivision);
      pick = p;
      card.append(p.root);
    }
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.playAgain;
    card.append(btn);
    this.show(card, btn, (kb) => onAgain(pick ? pick.value() : 1, kb));
  }
}
