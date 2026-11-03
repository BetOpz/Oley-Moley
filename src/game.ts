// Pure game state + rules. No DOM. Time is a game clock advanced by tick().
import { ENCORE, OLE_SECTIONS, STAGES, TUNING } from './config';
import type { ItemType, Mode, StageDef } from './config';
import { between, chooseSpawn, matches, pick, poolFor, randomTarget } from './spawner';
import type { Rng, StagePool } from './spawner';

export { matches } from './spawner';

export type Phase = 'title' | 'intro' | 'playing' | 'clear' | 'over';
export type CritterState = 'up' | 'bonked' | 'sinking';

export interface Critter {
  id: number;
  hole: number;
  item: ItemType;
  state: CritterState;
  /** When an 'up' critter sinks on its own. */
  downAt: number;
  /** When a 'bonked' critter starts sinking. */
  sinkAt: number;
  /** When a 'sinking' critter is removed and its hole freed. */
  clearAt: number;
}

export interface Stage extends StageDef {
  /** 0-based index into the run (stage 7 = index 6 = Extra Time 1). */
  index: number;
  /** 1-based stage number used for scoring and display. */
  number: number;
  /** 0 for the main stages, 1, 2, 3… for encore loops. */
  encore: number;
}

/** Olé meter section reached: 1 = "Olé!", 2 = "Olé, olé!", 3 = "Olé, olé, olé!" (stage clear). */
export type OleLevel = 1 | 2 | 3;
export type WrongKind = 'hat' | 'animal';

export type GameEvent =
  | { type: 'spawn'; critter: Critter }
  | { type: 'hit'; critter: Critter; points: number; streak: number; ole: OleLevel | null }
  | { type: 'wrong'; critter: Critter; kind: WrongKind }
  | { type: 'miss'; hole: number }
  | { type: 'escape'; critter: Critter }
  | { type: 'sink'; critter: Critter }
  | { type: 'clear'; critter: Critter }
  | { type: 'queue' }
  | { type: 'lives'; lives: number }
  | { type: 'stageClear'; stage: Stage }
  | { type: 'gameOver' };

export interface GameState {
  phase: Phase;
  rng: Rng;
  time: number;
  stage: Stage;
  pool: StagePool;
  score: number;
  lives: number;
  streak: number;
  bestStreak: number;
  progress: number;
  queue: ItemType[];
  critters: Critter[];
  nextSpawnAt: number;
  lastTargetAt: number;
  nextId: number;
}

export function getStage(index: number): Stage {
  const last = STAGES.length - 1;
  if (index <= last) return { ...STAGES[index], index, number: index + 1, encore: 0 };
  const encore = index - last;
  const base = STAGES[last];
  return {
    ...base,
    spawnMs: base.spawnMs * Math.pow(ENCORE.spawnMul, encore),
    upMs: base.upMs * Math.pow(ENCORE.upMul, encore),
    index,
    number: index + 1,
    encore,
  };
}

export function holeCount(g: GameState): number {
  return g.stage.grid * g.stage.grid;
}

export function target(g: GameState): ItemType {
  return g.queue[0] ?? { animal: 'mole', color: 'none' };
}

export function pointsFor(stageNumber: number, streak: number): number {
  return (
    TUNING.basePoints * stageNumber +
    Math.min(Math.max(streak - 1, 0), TUNING.comboCap) * TUNING.comboStep
  );
}

/** Hits needed to reach each Olé meter section: ceil(goal × 1/3), ceil(goal × 2/3), goal. */
export function oleThresholds(goal: number): number[] {
  const t: number[] = [];
  for (let k = 1; k < OLE_SECTIONS; k++) t.push(Math.ceil((goal * k) / OLE_SECTIONS));
  t.push(goal);
  return t;
}

/** The Olé cheer that fires when progress reaches `progress`, if any. Progress only rises by 1. */
export function oleFor(progress: number, goal: number): OleLevel | null {
  const t = oleThresholds(goal);
  // If thresholds coincide (tiny goals), the highest section wins.
  for (let k = t.length - 1; k >= 0; k--) if (t[k] === progress) return (k + 1) as OleLevel;
  return null;
}

function buildQueue(rng: Rng, pool: StagePool): ItemType[] {
  if (pool.mode === 'plain') return [];
  const q: ItemType[] = [];
  for (let i = 0; i < TUNING.queueLength; i++) q.push(randomTarget(rng, pool));
  return q;
}

function setStage(g: GameState, index: number): void {
  g.stage = getStage(index);
  g.pool = poolFor(g.stage.mode, g.stage.colors, g.stage.animals);
  g.progress = 0;
  g.critters = [];
  g.queue = buildQueue(g.rng, g.pool);
}

export function createGame(rng: Rng = Math.random): GameState {
  const stage = getStage(0);
  return {
    phase: 'title',
    rng,
    time: 0,
    stage,
    pool: poolFor(stage.mode, stage.colors, stage.animals),
    score: 0,
    lives: TUNING.startLives,
    streak: 0,
    bestStreak: 0,
    progress: 0,
    queue: [],
    critters: [],
    nextSpawnAt: 0,
    lastTargetAt: 0,
    nextId: 1,
  };
}

/** Reset for a fresh run at stage 1, showing its intro. */
export function startRun(g: GameState, startIndex = 0): void {
  g.score = 0;
  g.lives = TUNING.startLives;
  g.streak = 0;
  g.bestStreak = 0;
  setStage(g, startIndex);
  g.phase = 'intro';
}

/** Leave the intro card and start play. */
export function beginStage(g: GameState): void {
  g.phase = 'playing';
  g.critters = [];
  g.nextSpawnAt = g.time + TUNING.firstSpawnMs;
  g.lastTargetAt = g.time;
}

/** After a stage clear: move to the next stage, regain a life, show its intro. */
export function nextStage(g: GameState): void {
  g.lives = Math.min(TUNING.maxLives, g.lives + 1);
  setStage(g, g.stage.index + 1);
  g.phase = 'intro';
}

export function isTarget(g: GameState, item: ItemType): boolean {
  return matches(item, target(g), g.stage.mode);
}

export function targetOnBoard(g: GameState): boolean {
  return g.critters.some((c) => c.state === 'up' && isTarget(g, c.item));
}

function freeHoles(g: GameState): number[] {
  const taken = new Set(g.critters.map((c) => c.hole));
  const free: number[] = [];
  for (let i = 0; i < holeCount(g); i++) if (!taken.has(i)) free.push(i);
  return free;
}

function upCount(g: GameState): number {
  return g.critters.filter((c) => c.state === 'up').length;
}

function spawn(g: GameState, item: ItemType, events: GameEvent[]): boolean {
  const free = freeHoles(g);
  if (free.length === 0) return false;
  const [lo, hi] = TUNING.upJitter;
  const c: Critter = {
    id: g.nextId++,
    hole: pick(g.rng, free),
    item,
    state: 'up',
    downAt: g.time + g.stage.upMs * between(g.rng, lo, hi),
    sinkAt: 0,
    clearAt: 0,
  };
  g.critters.push(c);
  events.push({ type: 'spawn', critter: c });
  return true;
}

function loseLife(g: GameState, events: GameEvent[]): void {
  g.lives = Math.max(0, g.lives - 1);
  g.streak = 0;
  events.push({ type: 'lives', lives: g.lives });
  if (g.lives === 0) {
    g.phase = 'over';
    events.push({ type: 'gameOver' });
  }
}

/** Advance the game clock by dt ms. */
export function tick(g: GameState, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (g.phase !== 'playing') return events;
  g.time += dt;
  const t = g.time;

  for (const c of [...g.critters]) {
    if (c.state === 'up' && t >= c.downAt) {
      c.state = 'sinking';
      c.clearAt = t + TUNING.sinkMs;
      events.push({ type: 'sink', critter: c });
      if (isTarget(g, c.item)) {
        events.push({ type: 'escape', critter: c });
        loseLife(g, events);
        if (g.phase !== 'playing') return events;
      }
    } else if (c.state === 'bonked' && t >= c.sinkAt) {
      c.state = 'sinking';
      c.clearAt = t + TUNING.sinkMs;
      events.push({ type: 'sink', critter: c });
    } else if (c.state === 'sinking' && t >= c.clearAt) {
      g.critters = g.critters.filter((x) => x !== c);
      events.push({ type: 'clear', critter: c });
    }
  }

  const mode: Mode = g.stage.mode;
  const hasTarget = targetOnBoard(g);
  if (hasTarget) g.lastTargetAt = t;

  // Keep a target on screen: if none has been up for a while, force one in.
  if (!hasTarget && t - g.lastTargetAt >= TUNING.forceTargetAfterMs) {
    if (spawn(g, { ...target(g) }, events)) g.lastTargetAt = t;
  }

  if (t >= g.nextSpawnAt) {
    const [lo, hi] = TUNING.spawnJitter;
    g.nextSpawnAt = t + g.stage.spawnMs * between(g.rng, lo, hi);
    if (upCount(g) < g.stage.maxUp) {
      const item = chooseSpawn(g.rng, g.pool, target(g), targetOnBoard(g));
      spawn(g, item, events);
      if (mode !== 'plain' && isTarget(g, item)) g.lastTargetAt = t;
    }
  }
  return events;
}

/** Player whacks a hole. */
export function whack(g: GameState, hole: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (g.phase !== 'playing') return events;
  const c = g.critters.find((x) => x.hole === hole && x.state === 'up');
  if (!c) {
    events.push({ type: 'miss', hole });
    return events;
  }
  c.state = 'bonked';
  c.sinkAt = g.time + TUNING.bonkMs;
  const tgt = target(g);

  if (matches(c.item, tgt, g.stage.mode)) {
    g.streak += 1;
    g.bestStreak = Math.max(g.bestStreak, g.streak);
    const points = pointsFor(g.stage.number, g.streak);
    g.score += points;
    g.progress += 1;
    events.push({ type: 'hit', critter: c, points, streak: g.streak, ole: oleFor(g.progress, g.stage.goal) });
    if (g.stage.mode !== 'plain') {
      shiftQueue(g);
      events.push({ type: 'queue' });
      g.lastTargetAt = g.time;
    }
    if (g.progress >= g.stage.goal) {
      g.phase = 'clear';
      g.critters = [];
      events.push({ type: 'stageClear', stage: g.stage });
    }
  } else {
    const kind: WrongKind =
      g.stage.mode === 'animal' && c.item.animal !== tgt.animal ? 'animal' : 'hat';
    events.push({ type: 'wrong', critter: c, kind });
    loseLife(g, events);
  }
  return events;
}

/** Drop the front target and append a fresh random one. */
export function shiftQueue(g: GameState): void {
  g.queue.shift();
  g.queue.push(randomTarget(g.rng, g.pool));
}
