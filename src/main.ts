// Bootstraps the game and wires the pure game state to the DOM renderers.
import './style.css';
import {
  beginStage,
  createGame,
  nextStage,
  startRun,
  target,
  tick,
  whack,
} from './game';
import type { GameEvent } from './game';
import { load, recordRun, save } from './storage';
import { STR } from './strings';
import { azulejoDataUri, cursorDataUri } from './render/art';
import { Board } from './render/board';
import { Fx, reducedMotion } from './render/fx';
import { Hud } from './render/hud';
import { Overlay } from './render/overlay';

const app = document.getElementById('app')!;
const rootStyle = document.documentElement.style;
rootStyle.setProperty('--azulejo', azulejoDataUri());
rootStyle.setProperty('--castanet-cursor', cursorDataUri());

const board = new Board(app);
const hud = new Hud(board);
const fx = new Fx(board.fxLayer, board.arena);
const overlay = new Overlay(board.overlay);
const g = createGame();
let saved = load();

function applyPatternsOnly(on: boolean): void {
  document.documentElement.classList.toggle('patterns-only', on);
  hud.colourToggle.setAttribute('aria-pressed', String(on));
}
applyPatternsOnly(saved.patternsOnly);
hud.colourToggle.addEventListener('click', () => {
  saved = load();
  saved.patternsOnly = !saved.patternsOnly;
  save(saved);
  applyPatternsOnly(saved.patternsOnly);
});

function syncHud(): void {
  hud.setScore(g.score);
  hud.setStage(g.stage);
  hud.setLives(g.lives);
  hud.setTarget(g.stage.mode, g.queue, false);
  hud.setFan(g.streak);
  hud.setProgress(g.progress, g.stage.goal);
}

/** Olé meter: when the streak passes a third, one stand jumps up and cheers. */
function updateMeter(prevStreak: number): void {
  const side = hud.setFan(g.streak, prevStreak);
  if (side) hud.cheer(side);
}

function prepareStage(): void {
  fx.reset();
  board.build(g.stage.grid);
  syncHud();
}

function play(viaKeyboard = false): void {
  overlay.hide();
  beginStage(g);
  last = performance.now();
  // The rule flashes in the centre circle as play starts.
  hud.flashRule(g.stage.mode, target(g));
  // Keyboard players get focus on the grid; pointer players don't see a focus ring.
  if (viaKeyboard) board.focusGrid();
  else (document.activeElement as HTMLElement | null)?.blur();
}

function showIntro(): void {
  prepareStage();
  overlay.intro(g.stage, play);
}

/** Dev/testing aid: ?stage=5 starts the run at stage 5. */
function startIndexFromUrl(): number {
  try {
    const n = Number(new URLSearchParams(window.location.search).get('stage'));
    return Number.isInteger(n) && n >= 1 && n <= 50 ? n - 1 : 0;
  } catch {
    return 0;
  }
}

function showPoster(): void {
  prepareStage();
  overlay.poster(saved.bestScore, () => {
    startRun(g, startIndexFromUrl());
    showIntro();
  });
}

function onStageClear(): void {
  board.clearAll();
  hud.setFan(g.streak);
  fx.callout(STR.stageClear, 'clear');
  fx.celebrate();
  hud.cheerAll();
  window.setTimeout(
    () => {
      nextStage(g);
      showIntro();
    },
    reducedMotion() ? 1200 : 2200,
  );
}

function onGameOver(): void {
  board.clearAll();
  const { saved: s, newBest } = recordRun(g.score, g.bestStreak);
  saved = s;
  window.setTimeout(() => {
    overlay.gameOver(
      {
        score: g.score,
        stage: g.stage.number,
        bestScore: s.bestScore,
        bestStreak: s.bestStreak,
        newBest,
      },
      (viaKeyboard) => {
        // Play again starts immediately at stage 1.
        startRun(g);
        prepareStage();
        play(viaKeyboard);
      },
    );
  }, 650);
}

function handle(events: GameEvent[]): void {
  for (const ev of events) {
    switch (ev.type) {
      case 'spawn':
        board.spawn(ev.critter.hole, ev.critter.id, ev.critter.item);
        break;
      case 'hit': {
        board.bonk(ev.critter.hole, false);
        fx.points(board.holePoint(ev.critter.hole), `+${ev.points}`);
        hud.setScore(g.score);
        updateMeter(ev.streak - 1);
        hud.setProgress(g.progress, g.stage.goal);
        if (ev.ole) {
          fx.callout(STR.callouts[ev.ole], ev.ole);
          if (ev.ole === 'oleMax' && !reducedMotion()) fx.sparkle();
          if (ev.ole === 'torero') fx.roseLand();
        }
        break;
      }
      case 'wrong':
        board.bonk(ev.critter.hole, true);
        fx.callout(ev.kind === 'animal' ? STR.callouts.wrongAnimal : STR.callouts.wrongHat, 'oops');
        fx.shake();
        break;
      case 'escape':
        fx.callout(STR.callouts.escape, 'oops');
        fx.shake();
        break;
      case 'sink':
        board.sink(ev.critter.hole, ev.critter.id);
        break;
      case 'clear':
        board.clear(ev.critter.hole, ev.critter.id);
        break;
      case 'queue':
        hud.setTarget(g.stage.mode, g.queue, true);
        break;
      case 'lives':
        hud.setLives(ev.lives);
        hud.setFan(g.streak);
        break;
      case 'stageClear':
        onStageClear();
        break;
      case 'gameOver':
        onGameOver();
        break;
      case 'miss':
        break;
    }
  }
}

board.onWhack((hole, at) => {
  if (g.phase !== 'playing') return;
  if (at) fx.castanet(at);
  handle(whack(g, hole));
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  if (g.phase === 'playing') handle(tick(g, dt));
  requestAnimationFrame(frame);
}

showPoster();
requestAnimationFrame(frame);
