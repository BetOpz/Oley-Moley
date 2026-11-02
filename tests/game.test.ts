import { describe, expect, it } from 'vitest';
import { ENCORE, STAGES, STREAK, TUNING } from '../src/config';
import type { ItemType, Mode } from '../src/config';
import {
  beginStage,
  createGame,
  getStage,
  nextStage,
  oleFor,
  pointsFor,
  shiftQueue,
  startRun,
  target,
  targetOnBoard,
  tick,
  whack,
} from '../src/game';
import type { Critter, GameEvent, GameState } from '../src/game';
import { chooseSpawn, makeDecoy, matches, mulberry32, poolFor } from '../src/spawner';

function newGame(stageIndex = 0, seed = 1): GameState {
  const g = createGame(mulberry32(seed));
  startRun(g, stageIndex);
  beginStage(g);
  return g;
}

/** Put a critter straight onto the board, bypassing the spawner. */
function place(g: GameState, hole: number, item: ItemType, upFor = 5000): Critter {
  const c: Critter = {
    id: g.nextId++,
    hole,
    item,
    state: 'up',
    downAt: g.time + upFor,
    sinkAt: 0,
    clearAt: 0,
  };
  g.critters.push(c);
  return c;
}

function types(events: GameEvent[]): string[] {
  return events.map((e) => e.type);
}

describe('matches()', () => {
  const t: ItemType = { animal: 'rabbit', color: 'red' };
  it('plain: every mole is valid', () => {
    expect(matches({ animal: 'mole', color: 'none' }, t, 'plain')).toBe(true);
  });
  it('hat: colour must match', () => {
    expect(matches({ animal: 'mole', color: 'red' }, t, 'hat')).toBe(true);
    expect(matches({ animal: 'mole', color: 'blue' }, t, 'hat')).toBe(false);
  });
  it('animal: colour and animal must both match', () => {
    expect(matches({ animal: 'rabbit', color: 'red' }, t, 'animal')).toBe(true);
    expect(matches({ animal: 'rabbit', color: 'blue' }, t, 'animal')).toBe(false);
    expect(matches({ animal: 'frog', color: 'red' }, t, 'animal')).toBe(false);
    expect(matches({ animal: 'frog', color: 'blue' }, t, 'animal')).toBe(false);
  });
});

describe('decoys', () => {
  const cases: [string, number][] = STAGES.map((s, i) => [`stage ${i + 1} (${s.mode})`, i]);
  for (const [name, i] of cases) {
    const s = STAGES[i];
    if (s.mode === 'plain') continue;
    it(`never match the target in ${name} over 10,000 samples`, () => {
      const rng = mulberry32(1234 + i);
      const pool = poolFor(s.mode, s.colors, s.animals);
      for (let n = 0; n < 10_000; n++) {
        const tgt: ItemType = {
          animal: s.mode === 'animal' ? pool.animals[n % pool.animals.length] : 'mole',
          color: pool.colors[n % pool.colors.length],
        };
        const d = makeDecoy(rng, pool, tgt);
        expect(matches(d, tgt, s.mode)).toBe(false);
        expect(pool.colors).toContain(d.color);
        expect(pool.animals).toContain(d.animal);
      }
    });
  }

  it('animal decoys roughly follow the 45/35/20 mix', () => {
    const rng = mulberry32(99);
    const pool = poolFor('animal', 4, 4);
    const tgt: ItemType = { animal: 'frog', color: 'blue' };
    let rightAnimal = 0;
    let rightColor = 0;
    const N = 20_000;
    for (let n = 0; n < N; n++) {
      const d = makeDecoy(rng, pool, tgt);
      if (d.animal === tgt.animal) rightAnimal++;
      else if (d.color === tgt.color) rightColor++;
    }
    expect(rightAnimal / N).toBeCloseTo(0.45, 1);
    // 35% plus the share of "wrong animal, any colour" that lands on the right colour (0.2 × 1/4).
    expect(rightColor / N).toBeCloseTo(0.35 + 0.2 / 4, 1);
  });

  it('chooseSpawn picks the target more often when none is up', () => {
    const rng = mulberry32(5);
    const pool = poolFor('hat', 4, 1);
    const tgt: ItemType = { animal: 'mole', color: 'red' };
    let none = 0;
    let some = 0;
    for (let n = 0; n < 10_000; n++) {
      if (matches(chooseSpawn(rng, pool, tgt, false), tgt, 'hat')) none++;
      if (matches(chooseSpawn(rng, pool, tgt, true), tgt, 'hat')) some++;
    }
    expect(none / 10_000).toBeCloseTo(TUNING.targetChanceNone, 1);
    expect(some / 10_000).toBeCloseTo(TUNING.targetChanceSome, 1);
  });
});

describe('queue', () => {
  it('is empty in plain stages and 6 long otherwise', () => {
    expect(newGame(0).queue).toHaveLength(0);
    expect(newGame(2).queue).toHaveLength(TUNING.queueLength);
    expect(newGame(4).queue).toHaveLength(TUNING.queueLength);
  });

  it('shifts left and appends a new target', () => {
    const g = newGame(2);
    const before = [...g.queue];
    shiftQueue(g);
    expect(g.queue).toHaveLength(TUNING.queueLength);
    expect(g.queue.slice(0, 5)).toEqual(before.slice(1));
  });

  it('shifts on a correct hit in hat mode', () => {
    const g = newGame(2);
    const before = [...g.queue];
    place(g, 0, { ...target(g) });
    const ev = whack(g, 0);
    expect(types(ev)).toContain('queue');
    expect(g.queue.slice(0, 5)).toEqual(before.slice(1));
  });

  it('only uses colours/animals in play', () => {
    const g = newGame(4);
    for (const q of g.queue) {
      expect(['red', 'blue', 'yellow']).toContain(q.color);
      expect(['mole', 'rabbit', 'frog']).toContain(q.animal);
    }
  });
});

describe('scoring and streak', () => {
  it('points = 10 × stage + min(streak − 1, 10) × 2', () => {
    expect(pointsFor(1, 1)).toBe(10);
    expect(pointsFor(3, 1)).toBe(30);
    expect(pointsFor(3, 4)).toBe(36);
    expect(pointsFor(2, 11)).toBe(40);
    expect(pointsFor(2, 50)).toBe(40);
  });

  it('a correct hit adds points, streak and progress and never costs a life', () => {
    const g = newGame(0);
    for (let i = 0; i < 5; i++) {
      place(g, 0, { animal: 'mole', color: 'none' });
      const ev = whack(g, 0);
      expect(types(ev)).toContain('hit');
      g.critters = [];
    }
    expect(g.streak).toBe(5);
    expect(g.progress).toBe(5);
    expect(g.lives).toBe(TUNING.startLives);
    expect(g.score).toBe(10 + 12 + 14 + 16 + 18);
  });

  it('a wrong hit costs a life, resets the streak and names the mistake', () => {
    const g = newGame(4);
    const tgt = target(g);
    g.streak = 4;
    const wrongHat: ItemType = { animal: tgt.animal, color: tgt.color === 'red' ? 'blue' : 'red' };
    place(g, 0, wrongHat);
    let ev = whack(g, 0);
    const w = ev.find((e) => e.type === 'wrong');
    expect(w && w.type === 'wrong' && w.kind).toBe('hat');
    expect(g.lives).toBe(TUNING.startLives - 1);
    expect(g.streak).toBe(0);

    const wrongAnimal: ItemType = { animal: tgt.animal === 'mole' ? 'frog' : 'mole', color: tgt.color };
    place(g, 1, wrongAnimal);
    ev = whack(g, 1);
    const w2 = ev.find((e) => e.type === 'wrong');
    expect(w2 && w2.type === 'wrong' && w2.kind).toBe('animal');
    expect(g.lives).toBe(TUNING.startLives - 2);
  });

  it('whacking an empty hole is a harmless miss', () => {
    const g = newGame(1);
    g.streak = 3;
    expect(types(whack(g, 4))).toEqual(['miss']);
    expect(g.lives).toBe(TUNING.startLives);
    expect(g.streak).toBe(3);
  });

  it('tracks the best streak', () => {
    const g = newGame(0);
    for (let i = 0; i < 4; i++) {
      place(g, 0, { animal: 'mole', color: 'none' });
      whack(g, 0);
      g.critters = [];
    }
    g.streak = 0;
    expect(g.bestStreak).toBe(4);
  });
});

describe('Olé callouts', () => {
  it('fire at 3, 5, 10 and every 5 from 15', () => {
    const hits: Record<number, string | null> = {};
    for (let s = 1; s <= 30; s++) hits[s] = oleFor(s);
    expect(hits[3]).toBe('ole');
    expect(hits[5]).toBe('oleOle');
    expect(hits[10]).toBe('oleMax');
    expect(hits[15]).toBe('torero');
    expect(hits[20]).toBe('torero');
    expect(hits[25]).toBe('torero');
    for (const s of [1, 2, 4, 6, 9, 11, 14, 16, 19, 21]) expect(hits[s]).toBeNull();
  });

  it('come through on hit events and reset after a mistake', () => {
    const g = newGame(1, 3);
    const oles: (string | null)[] = [];
    for (let i = 0; i < 5; i++) {
      place(g, 0, { animal: 'mole', color: 'none' });
      const ev = whack(g, 0).find((e) => e.type === 'hit');
      if (ev && ev.type === 'hit') oles.push(ev.ole);
      g.critters = [];
    }
    expect(oles).toEqual([null, null, 'ole', null, 'oleOle']);
    // An escape resets the streak.
    place(g, 0, { animal: 'mole', color: 'none' }, 10);
    tick(g, 20);
    expect(g.streak).toBe(0);
    expect(STREAK.ole).toBe(3);
  });
});

describe('escapes', () => {
  it('a target sinking unhit costs a life', () => {
    const g = newGame(2);
    g.nextSpawnAt = Infinity;
    g.streak = 2;
    place(g, 0, { ...target(g) }, 100);
    const ev = tick(g, 150);
    expect(types(ev)).toContain('escape');
    expect(g.lives).toBe(TUNING.startLives - 1);
    expect(g.streak).toBe(0);
  });

  it('a decoy sinking is fine', () => {
    const g = newGame(2);
    g.nextSpawnAt = Infinity;
    g.lastTargetAt = Infinity; // stop the forced target spawn for this check
    const tgt = target(g);
    place(g, 0, makeDecoy(mulberry32(1), g.pool, tgt), 100);
    const ev = tick(g, 150);
    expect(types(ev)).not.toContain('escape');
    expect(g.lives).toBe(TUNING.startLives);
  });

  it('losing the last life ends the game', () => {
    const g = newGame(0);
    g.lives = 1;
    place(g, 0, { animal: 'mole', color: 'none' }, 50);
    const ev = tick(g, 60);
    expect(types(ev)).toContain('gameOver');
    expect(g.phase).toBe('over');
  });
});

describe('stages', () => {
  it('stage 1 is 2×2 and stage 6 is 5×5', () => {
    expect(getStage(0).grid).toBe(2);
    expect(getStage(5).grid).toBe(5);
  });

  it('clearing the goal advances to the next stage with a life back', () => {
    const g = newGame(0);
    g.lives = 3;
    let ev: GameEvent[] = [];
    for (let i = 0; i < STAGES[0].goal; i++) {
      place(g, 0, { animal: 'mole', color: 'none' });
      ev = whack(g, 0);
      g.critters = g.critters.filter((c) => c.state === 'up');
    }
    expect(types(ev)).toContain('stageClear');
    expect(g.phase).toBe('clear');
    nextStage(g);
    expect(g.phase).toBe('intro');
    expect(g.stage.number).toBe(2);
    expect(g.stage.grid).toBe(3);
    expect(g.progress).toBe(0);
    expect(g.lives).toBe(4);
    g.lives = TUNING.maxLives;
    nextStage(g);
    expect(g.lives).toBe(TUNING.maxLives);
  });

  it('encore loops repeat stage 6 and scale timings', () => {
    const last = STAGES[STAGES.length - 1];
    const e1 = getStage(6);
    const e3 = getStage(8);
    expect(e1.encore).toBe(1);
    expect(e3.encore).toBe(3);
    expect(e1.grid).toBe(5);
    expect(e1.goal).toBe(15);
    expect(e1.spawnMs).toBeCloseTo(last.spawnMs * ENCORE.spawnMul);
    expect(e1.upMs).toBeCloseTo(last.upMs * ENCORE.upMul);
    expect(e3.spawnMs).toBeCloseTo(last.spawnMs * ENCORE.spawnMul ** 3);
    expect(e3.upMs).toBeCloseTo(last.upMs * ENCORE.upMul ** 3);
  });
});

describe('spawning simulation', () => {
  function simulate(stageIndex: number, seed: number, ms: number) {
    const g = newGame(stageIndex, seed);
    g.lives = 1e9; // never die in the sim
    let gapWithoutTarget = 0;
    let longestGap = 0;
    let maxUp = 0;
    const step = 16;
    for (let t = 0; t < ms; t += step) {
      tick(g, step);
      const up = g.critters.filter((c) => c.state === 'up').length;
      maxUp = Math.max(maxUp, up);
      if (targetOnBoard(g)) gapWithoutTarget = 0;
      else gapWithoutTarget += step;
      longestGap = Math.max(longestGap, gapWithoutTarget);
      // Occasionally whack the target to shift the queue.
      if (t % 1500 === 0) {
        const c = g.critters.find((x) => x.state === 'up' && matches(x.item, target(g), g.stage.mode));
        if (c) whack(g, c.hole);
        if (g.phase === 'clear') {
          g.phase = 'playing';
          g.progress = 0;
        }
      }
    }
    return { longestGap, maxUp, g };
  }

  for (const i of [2, 3, 4, 5]) {
    it(`stage ${i + 1} never goes much more than ~2s without a target`, () => {
      for (const seed of [1, 2, 3]) {
        const { longestGap, maxUp, g } = simulate(i, seed, 60_000);
        expect(longestGap).toBeLessThanOrEqual(2000);
        expect(maxUp).toBeLessThanOrEqual(g.stage.maxUp + 1);
      }
    });
  }

  it('critters only use holes on the current grid', () => {
    const g = newGame(0, 7);
    for (let t = 0; t < 20_000; t += 16) {
      for (const e of tick(g, 16)) {
        if (e.type === 'spawn') expect(e.critter.hole).toBeLessThan(4);
      }
      g.lives = 5;
    }
  });
});

describe('modes', () => {
  it('stage table modes progress plain → hat → animal', () => {
    const modes: Mode[] = STAGES.map((s) => s.mode);
    expect(modes).toEqual(['plain', 'plain', 'hat', 'hat', 'animal', 'animal']);
  });
});
