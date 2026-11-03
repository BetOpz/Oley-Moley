// Bootstraps the game and wires the pure game state to the DOM renderers and sound.
import './style.css';
import { beginStage, createGame, nextStage, startRun, target, tick, whack } from './game';
import type { GameEvent } from './game';
import { AudioManager } from './audio';
import { load, recordRun, save } from './storage';
import { STR } from './strings';
import { Board } from './render/board';
import { Fx, reducedMotion } from './render/fx';
import { Hud } from './render/hud';
import { Overlay } from './render/overlay';
import { Stadium } from './render/stadium';

const app = document.getElementById('app')!;
const stadium = new Stadium(app);
const board = new Board(stadium.pitchHost);
stadium.mountRuleLabel();
const hud = new Hud(stadium.stands.top);
const fx = new Fx(board.fxLayer, stadium.frame);
const overlay = new Overlay(board.overlay);
const g = createGame();
let saved = load();
const audio = new AudioManager(saved.muted);

// Sound starts only after the first tap or key press.
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

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

hud.setMuted(saved.muted);
hud.muteToggle.addEventListener('click', () => {
  saved = load();
  saved.muted = !saved.muted;
  save(saved);
  audio.setMuted(saved.muted);
  hud.setMuted(saved.muted);
});

function syncHud(): void {
  hud.setScore(g.score, g.streak);
  hud.setStage(g.stage);
  hud.setLives(g.lives);
  hud.setProgress(g.progress, g.stage.goal);
  stadium.setTarget(g.stage.mode, g.queue, false);
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
  stadium.flashRule(g.stage.mode, target(g));
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

function showTicket(): void {
  prepareStage();
  overlay.ticket(saved.bestScore, () => {
    startRun(g, startIndexFromUrl());
    showIntro();
  });
}

function onStageClear(): void {
  board.clearAll();
  fx.confetti();
  window.setTimeout(
    () => {
      nextStage(g);
      showIntro();
    },
    reducedMotion() ? 1400 : 2600,
  );
}

function onGameOver(): void {
  board.clearAll();
  audio.play('fulltime');
  const { saved: s, newBest } = recordRun(g.score, g.bestStreak);
  saved = s;
  window.setTimeout(() => {
    overlay.fullTime(
      { score: g.score, stage: g.stage.number, bestScore: s.bestScore, newBest },
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
      case 'hit':
        board.bonk(ev.critter.hole, false);
        fx.points(board.holePoint(ev.critter.hole), `+${ev.points}`);
        hud.setScore(g.score, g.streak);
        hud.setProgress(g.progress, g.stage.goal);
        if (ev.ole) {
          fx.pop(STR.cheers[ev.ole - 1], `cheer${ev.ole}`);
          stadium.cheer(ev.ole);
          audio.play(`ole-${ev.ole}`);
        } else {
          audio.hit();
        }
        break;
      case 'wrong':
        board.bonk(ev.critter.hole, true);
        fx.pop(ev.kind === 'animal' ? STR.messages.wrongAnimal : STR.messages.wrongHat, 'oops');
        fx.shake();
        audio.play('groan');
        break;
      case 'escape':
        fx.pop(STR.messages.escape, 'oops');
        fx.shake();
        audio.play('whistle');
        break;
      case 'sink':
        board.sink(ev.critter.hole, ev.critter.id);
        break;
      case 'clear':
        board.clear(ev.critter.hole, ev.critter.id);
        break;
      case 'queue':
        stadium.setTarget(g.stage.mode, g.queue, true);
        break;
      case 'lives':
        hud.setLives(ev.lives);
        hud.setScore(g.score, g.streak);
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

board.onWhack((hole) => {
  if (g.phase !== 'playing') return;
  handle(whack(g, hole));
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(now - last, 100);
  last = now;
  if (g.phase === 'playing') handle(tick(g, dt));
  requestAnimationFrame(frame);
}

showTicket();
requestAnimationFrame(frame);
