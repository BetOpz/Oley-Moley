// Overlay cards inside the board: start poster, stage intro, game over.
import type { Stage } from '../game';
import { STR } from '../strings';
import { el } from './board';
import { critterSvg } from './art';

export interface GameOverInfo {
  score: number;
  stage: number;
  bestScore: number;
  bestStreak: number;
  newBest: boolean;
}

export function stageTitle(stage: Stage): { title: string; sub: string; rule: string } {
  if (stage.encore > 0) {
    const last = STR.stages[STR.stages.length - 1];
    return { title: STR.encoreTitle(stage.encore), sub: STR.encoreSub, rule: last.rule };
  }
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

  poster(best: number, onPlay: (viaKeyboard: boolean) => void): void {
    const card = el('div', 'card poster');
    const art = el('div', 'poster-art');
    art.innerHTML = [
      critterSvg({ animal: 'rabbit', color: 'blue' }),
      critterSvg({ animal: 'mole', color: 'red' }),
      critterSvg({ animal: 'bull', color: 'yellow' }),
    ]
      .map((s) => `<div class="poster-critter">${s}</div>`)
      .join('');
    card.innerHTML = `
      <div class="poster-kicker">${STR.posterKicker}</div>
      <div class="poster-title">${STR.gameTitle}</div>`;
    card.append(art);
    const plaza = el('div', 'poster-plaza');
    plaza.textContent = STR.posterPlaza;
    const date = el('div', 'poster-date');
    date.textContent = STR.posterDate(new Date());
    const btn = el('button', 'ticket');
    btn.type = 'button';
    btn.innerHTML = `<span class="ticket-main">${STR.posterPlay}</span><span class="ticket-sub">${STR.posterTicketSub}</span>`;
    card.append(plaza, date, btn);
    if (best > 0) {
      const b = el('div', 'poster-best');
      b.textContent = STR.posterBest(best);
      card.append(b);
    }
    this.show(card, btn, onPlay);
  }

  intro(stage: Stage, onGo: (viaKeyboard: boolean) => void): void {
    const t = stageTitle(stage);
    const card = el('div', 'card intro');
    const num = el('div', 'intro-num');
    num.textContent = STR.introStageLine(stage.number, stage.grid);
    const h = el('h2', 'intro-title');
    h.textContent = t.title;
    const sub = el('p', 'intro-sub');
    sub.textContent = t.sub;
    const rule = el('p', 'intro-rule');
    rule.textContent = t.rule;
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.introGo;
    card.append(num, h, sub, rule, btn);
    this.show(card, btn, onGo);
  }

  gameOver(info: GameOverInfo, onAgain: (viaKeyboard: boolean) => void): void {
    const card = el('div', 'card gameover');
    const h = el('h2', 'go-title');
    h.textContent = STR.gameOverTitle;
    const sub = el('p', 'go-sub');
    sub.textContent = STR.gameOverSub;
    const dl = el('dl', 'go-stats');
    const row = (k: string, v: string | number) => {
      const dt = el('dt');
      dt.textContent = k;
      const dd = el('dd');
      dd.textContent = String(v);
      dl.append(dt, dd);
    };
    row(STR.gameOverScore, info.score);
    row(STR.gameOverStage, info.stage);
    row(STR.gameOverBest, info.bestScore);
    row(STR.gameOverBestStreak, info.bestStreak);
    card.append(h, sub);
    if (info.newBest) {
      const nb = el('div', 'go-newbest');
      nb.textContent = STR.gameOverNewBest;
      card.append(nb);
    }
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.textContent = STR.playAgain;
    card.append(dl, btn);
    this.show(card, btn, onAgain);
  }
}
