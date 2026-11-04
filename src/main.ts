// Bootstraps the game and wires the pure game state to the DOM renderers and sound.
import './style.css';
import { DIVISIONS, STAGES } from './config';
import { beginStage, createGame, nextStage, runIndex, startRun, target, tick, whack } from './game';
import type { GameEvent } from './game';
import { AudioManager } from './audio';
import { load, recordDivision, recordRun, save } from './storage';
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
  hud.setCards(g.yellows);
  hud.setProgress(g.progress, g.stage.goal);
  stadium.setTarget(g.stage, g.queue, false, false);
}

function prepareStage(): void {
  fx.reset();
  stadium.sitDown();
  board.build(g.stage.grid);
  syncHud();
}

function play(viaKeyboard = false): void {
  overlay.hide();
  beginStage(g);
  last = performance.now();
  stadium.flashRule(g.stage, target(g));
  // Keyboard players get focus on the grid; pointer players don't see a focus ring.
  if (viaKeyboard) board.focusGrid();
  else (document.activeElement as HTMLElement | null)?.blur();
}

function showIntro(): void {
  prepareStage();
  overlay.intro(g.stage, play);
}

/** Dev/testing aid: ?div=3&stage=5 starts a run at Division One, stage 5. */
function startFromUrl(): number | null {
  try {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('div') && !q.has('stage')) return null;
    const d = Number(q.get('div') ?? 1);
    const s = Number(q.get('stage') ?? 1);
    const ok = (n: number, max: number) => Number.isInteger(n) && n >= 1 && n <= max;
    return runIndex(ok(d, DIVISIONS.length) ? d : 1, ok(s, STAGES.length) ? s : 1);
  } catch {
    return null;
  }
}

function startAt(division: number): void {
  const fromUrl = startFromUrl();
  startRun(g, fromUrl ?? runIndex(division));
  saved = recordDivision(g.stage.division);
}

function showTicket(): void {
  prepareStage();
  overlay.ticket(saved.bestScore, saved.highestDivision, (division) => {
    startAt(division);
    showIntro();
  });
}

function onStageClear(promoted: boolean): void {
  board.clearAll();
  fx.confetti();
  audio.play('ole-4');
  window.setTimeout(
    () => {
      nextStage(g);
      if (promoted) {
        saved = recordDivision(g.stage.division);
        audio.play('roar');
        prepareStage();
        overlay.promoted(g.stage, play);
      } else {
        showIntro();
      }
    },
    reducedMotion() ? 1600 : 3000,
  );
}

function onGameOver(): void {
  board.clearAll();
  audio.play('fulltime');
  const { saved: s, newBest } = recordRun(g.score, g.bestStreak);
  saved = s;
  window.setTimeout(() => {
    overlay.fullTime(
      {
        score: g.score,
        stage: g.stage,
        bestScore: s.bestScore,
        newBest,
        highestDivision: s.highestDivision,
      },
      (division, viaKeyboard) => {
        // Play again starts straight away in the chosen division.
        startRun(g, runIndex(division));
        prepareStage();
        play(viaKeyboard);
      },
    );
  }, 900);
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
          // The full four-olé chant plays with the stage clear.
          if (ev.ole < 4) audio.play(`ole-${ev.ole}`);
        } else {
          audio.hit();
        }
        break;
      case 'wrong':
        board.bonk(ev.critter.hole, true);
        fx.pop(ev.kind === 'role' ? STR.messages.wrongRole : STR.messages.wrongKit, 'oops');
        fx.shake();
        audio.play('groan');
        break;
      case 'ref':
        board.bonk(ev.critter.hole, true);
        fx.card(board.holePoint(ev.critter.hole), ev.card);
        fx.pop(ev.card === 'red' ? STR.messages.red : STR.messages.yellow, ev.card);
        hud.setCards(ev.yellows, ev.card);
        hud.setScore(g.score, g.streak);
        if (ev.card === 'red') fx.shake();
        audio.play('whistle');
        window.setTimeout(() => audio.play('jeer'), 380);
        break;
      case 'escape': {
        fx.pop(STR.messages.escape, 'oops');
        fx.shake();
        // A short, disappointed version of the groan.
        const s = audio.play('groan', 1.18);
        window.setTimeout(() => s?.stop(), 520);
        break;
      }
      case 'sink':
        board.sink(ev.critter.hole, ev.critter.id);
        break;
      case 'clear':
        board.clear(ev.critter.hole, ev.critter.id);
        break;
      case 'queue':
        stadium.setTarget(g.stage, g.queue, true);
        break;
      case 'lives':
        hud.setLives(ev.lives);
        hud.setScore(g.score, g.streak);
        break;
      case 'stageClear':
        onStageClear(ev.promoted);
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
