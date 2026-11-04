import { describe, expect, it } from 'vitest';
import { DECOY_RATIOS, DIVISIONS, EXTRA_TIME, KITS, REFEREE, ROLES, STAGES, TUNING } from '../src/config';
import type { ItemType, Kit, Mode, Role } from '../src/config';
import {
  MAIN_STAGES,
  beginStage,
  createGame,
  getStage,
  nextStage,
  oleFor,
  oleThresholds,
  pointsFor,
  runIndex,
  shiftQueue,
  startRun,
  target,
  targetOnBoard,
  tick,
  whack,
} from '../src/game';
import type { Critter, GameEvent, GameState } from '../src/game';
import {
  PLAIN_MOLE,
  REF,
  chooseSpawn,
  makeDecoy,
  matches,
  maxUpFor,
  mulberry32,
  poolFor,
} from '../src/spawner';

/** A game in play at division d, stage s (both 1-based). */
function newGame(division = 1, stage = 1, seed = 1): GameState {
  const g = createGame(mulberry32(seed));
  startRun(g, runIndex(division, stage));
  beginStage(g);
  return g;
}

/** Put a critter straight onto the board, bypassing the spawner. */
function place(g: GameState, hole: number, item: ItemType, upFor = 5000): Critter {
  const c: Critter = {
    id: g.nextId++,
    hole,
    item: { ...item },
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

const mole = (kit: Kit, role: Role | 'none' = 'none'): ItemType => ({ kit, role, isRef: false });
const otherKit = (k: Kit | 'none'): Kit => (k === 'red' ? 'blue' : 'red');
const otherRole = (r: Role | 'none'): Role => (r === 'player' ? 'keeper' : 'player');

describe('matches()', () => {
  const t = mole('red', 'keeper');
  it('plain: every mole is valid', () => {
    expect(matches(PLAIN_MOLE, t, 'plain')).toBe(true);
    expect(matches(mole('blue'), t, 'plain')).toBe(true);
  });
  it('kit: the kit must match', () => {
    expect(matches(mole('red'), t, 'kit')).toBe(true);
    expect(matches(mole('blue'), t, 'kit')).toBe(false);
  });
  it('role: kit and role must both match', () => {
    expect(matches(mole('red', 'keeper'), t, 'role')).toBe(true);
    expect(matches(mole('red', 'player'), t, 'role')).toBe(false);
    expect(matches(mole('blue', 'keeper'), t, 'role')).toBe(false);
    expect(matches(mole('blue', 'fan'), t, 'role')).toBe(false);
  });
  it('the referee never matches, in any mode', () => {
    for (const mode of ['plain', 'kit', 'role'] as Mode[]) {
      expect(matches(REF, t, mode)).toBe(false);
      expect(matches(REF, REF, mode)).toBe(false);
      expect(matches(REF, PLAIN_MOLE, mode)).toBe(false);
    }
  });
});

describe('decoys', () => {
  STAGES.forEach((s, i) => {
    if (s.mode === 'plain') return;
    it(`never match the target in stage ${i + 1} (${s.mode}) over 10,000 samples`, () => {
      const rng = mulberry32(1234 + i);
      const pool = poolFor(s.mode, s.kits, s.roles, s.referee);
      for (let n = 0; n < 10_000; n++) {
        const tgt: ItemType = {
          kit: pool.kits[n % pool.kits.length],
          role: s.mode === 'role' ? pool.roles[n % pool.roles.length] : 'none',
          isRef: false,
        };
        const d = makeDecoy(rng, pool, tgt);
        expect(matches(d, tgt, s.mode)).toBe(false);
        expect(d.isRef).toBe(false);
        expect(pool.kits).toContain(d.kit);
        if (s.mode === 'role') expect(pool.roles).toContain(d.role);
        else expect(d.role).toBe('none');
      }
    });
  });

  it('role decoys roughly follow the 45/35/20 mix', () => {
    const rng = mulberry32(99);
    const pool = poolFor('role', 4, 3, true);
    const tgt = mole('blue', 'keeper');
    let rightRole = 0;
    let rightKit = 0;
    const N = 20_000;
    for (let n = 0; n < N; n++) {
      const d = makeDecoy(rng, pool, tgt);
      if (d.role === tgt.role) rightRole++;
      else if (d.kit === tgt.kit) rightKit++;
    }
    expect(rightRole / N).toBeCloseTo(DECOY_RATIOS.rightRoleWrongKit, 1);
    // 35% plus the share of "wrong role, any kit" that lands on the right kit (0.2 × 1/4).
    expect(rightKit / N).toBeCloseTo(DECOY_RATIOS.rightKitWrongRole + DECOY_RATIOS.wrongRoleAnyKit / 4, 1);
  });

  it('chooseSpawn picks the target more often when none is up', () => {
    const rng = mulberry32(5);
    const pool = poolFor('kit', 4, 0, false);
    const tgt = mole('red');
    let none = 0;
    let some = 0;
    for (let n = 0; n < 10_000; n++) {
      if (matches(chooseSpawn(rng, pool, tgt, false, 0), tgt, 'kit')) none++;
      if (matches(chooseSpawn(rng, pool, tgt, true, 0), tgt, 'kit')) some++;
    }
    expect(none / 10_000).toBeCloseTo(TUNING.targetChanceNone, 1);
    expect(some / 10_000).toBeCloseTo(TUNING.targetChanceSome, 1);
  });
});

describe('referee', () => {
  it(`takes about ${REFEREE.chance * 100}% of spawns when none is up`, () => {
    const rng = mulberry32(17);
    const pool = poolFor('kit', 3, 0, true);
    let refs = 0;
    const N = 20_000;
    for (let n = 0; n < N; n++) if (chooseSpawn(rng, pool, mole('red'), false, 0).isRef) refs++;
    expect(refs / N).toBeCloseTo(REFEREE.chance, 2);
  });

  it('never spawns while one is already up, or in a stage without a referee', () => {
    const rng = mulberry32(18);
    const withRef = poolFor('plain', 0, 0, true);
    const noRef = poolFor('plain', 0, 0, false);
    for (let n = 0; n < 10_000; n++) {
      expect(chooseSpawn(rng, withRef, PLAIN_MOLE, false, 1).isRef).toBe(false);
      expect(chooseSpawn(rng, noRef, PLAIN_MOLE, false, 0).isRef).toBe(false);
    }
  });

  it('is never the target', () => {
    for (let i = 0; i < MAIN_STAGES; i++) {
      const g = newGame(1 + Math.floor(i / 7), 1 + (i % 7), i);
      for (const q of g.queue) expect(q.isRef).toBe(false);
      expect(target(g).isRef).toBe(false);
    }
  });

  it('at most one is up at a time during play', () => {
    for (const seed of [1, 2, 3]) {
      const g = newGame(4, 2, seed);
      g.lives = 1e9;
      for (let t = 0; t < 60_000; t += 16) {
        tick(g, 16);
        expect(g.critters.filter((c) => c.state === 'up' && c.item.isRef).length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('first hit is a yellow card, the second a red that costs a life, then cards reset', () => {
    const g = newGame(2, 3);
    g.streak = 4;
    place(g, 0, REF);
    let ev = whack(g, 0);
    let r = ev.find((e) => e.type === 'ref');
    expect(r && r.type === 'ref' && r.card).toBe('yellow');
    expect(g.yellows).toBe(1);
    expect(g.streak).toBe(0);
    expect(g.lives).toBe(TUNING.startLives);
    expect(g.progress).toBe(0);

    place(g, 1, REF);
    ev = whack(g, 1);
    r = ev.find((e) => e.type === 'ref');
    expect(r && r.type === 'ref' && r.card).toBe('red');
    expect(g.lives).toBe(TUNING.startLives - 1);
    expect(g.yellows).toBe(0);

    place(g, 2, REF);
    r = whack(g, 2).find((e) => e.type === 'ref');
    expect(r && r.type === 'ref' && r.card).toBe('yellow');
  });

  it('yellow cards reset at each stage', () => {
    const g = newGame(1, 2);
    place(g, 0, REF);
    whack(g, 0);
    expect(g.yellows).toBe(1);
    g.phase = 'clear';
    nextStage(g);
    expect(g.yellows).toBe(0);
  });

  it('letting the referee go down is fine', () => {
    const g = newGame(1, 2);
    g.nextSpawnAt = Infinity;
    g.lastTargetAt = Infinity;
    place(g, 0, REF, 100);
    const ev = tick(g, 150);
    expect(types(ev)).not.toContain('escape');
    expect(g.lives).toBe(TUNING.startLives);
  });
});

describe('queue', () => {
  it('is empty in plain stages and 6 long otherwise', () => {
    expect(newGame(1, 1).queue).toHaveLength(0);
    expect(newGame(1, 2).queue).toHaveLength(0);
    expect(newGame(1, 3).queue).toHaveLength(TUNING.queueLength);
    expect(newGame(3, 6).queue).toHaveLength(TUNING.queueLength);
  });

  it('shifts left and appends a new target', () => {
    const g = newGame(1, 3);
    const before = [...g.queue];
    shiftQueue(g);
    expect(g.queue).toHaveLength(TUNING.queueLength);
    expect(g.queue.slice(0, 5)).toEqual(before.slice(1));
  });

  it('shifts on a correct hit in kit mode', () => {
    const g = newGame(1, 4);
    const before = [...g.queue];
    place(g, 0, target(g));
    const ev = whack(g, 0);
    expect(types(ev)).toContain('queue');
    expect(g.queue.slice(0, 5)).toEqual(before.slice(1));
  });

  it('only uses kits and roles in play', () => {
    const g = newGame(2, 6);
    for (const q of g.queue) {
      expect(['red', 'blue', 'yellow']).toContain(q.kit);
      expect(ROLES).toContain(q.role);
    }
    const k = newGame(3, 4);
    for (const q of k.queue) {
      expect(['red', 'blue', 'yellow']).toContain(q.kit);
      expect(q.role).toBe('none');
    }
  });

  it('stage 3 of every division uses exactly red and blue', () => {
    for (let d = 1; d <= DIVISIONS.length; d++) {
      const s = getStage(runIndex(d, 3));
      expect(poolFor(s.mode, s.kits, s.roles, s.referee).kits).toEqual(['red', 'blue']);
    }
  });

  it('no kit is black', () => {
    expect(KITS).not.toContain('black' as Kit);
  });
});

describe('scoring and streak', () => {
  it('points = 10 × division + 2 × stage + min(streak − 1, 10) × 2', () => {
    expect(pointsFor(1, 1, 1)).toBe(12);
    expect(pointsFor(2, 3, 1)).toBe(26);
    expect(pointsFor(2, 3, 4)).toBe(32);
    expect(pointsFor(4, 7, 11)).toBe(74);
    expect(pointsFor(4, 7, 50)).toBe(74);
  });

  it('a correct hit adds points, streak and progress and never costs a life', () => {
    const g = newGame(1, 1);
    for (let i = 0; i < 5; i++) {
      place(g, 0, PLAIN_MOLE);
      expect(types(whack(g, 0))).toContain('hit');
      g.critters = [];
    }
    expect(g.streak).toBe(5);
    expect(g.progress).toBe(5);
    expect(g.lives).toBe(TUNING.startLives);
    expect(g.score).toBe(12 + 14 + 16 + 18 + 20);
  });

  it('a wrong hit costs a life, resets the streak and names the mistake', () => {
    const g = newGame(3, 7);
    const tgt = target(g);
    g.streak = 4;
    place(g, 0, mole(otherKit(tgt.kit), tgt.role));
    let w = whack(g, 0).find((e) => e.type === 'wrong');
    expect(w && w.type === 'wrong' && w.kind).toBe('kit');
    expect(g.lives).toBe(TUNING.startLives - 1);
    expect(g.streak).toBe(0);

    place(g, 1, mole(tgt.kit as Kit, otherRole(tgt.role)));
    w = whack(g, 1).find((e) => e.type === 'wrong');
    expect(w && w.type === 'wrong' && w.kind).toBe('role');
    expect(g.lives).toBe(TUNING.startLives - 2);
  });

  it('hitting any non-target mole always costs a life; the target never does', () => {
    for (let i = 2; i < 7; i++) {
      const g = newGame(2, i + 1, i);
      const rng = mulberry32(i);
      for (let n = 0; n < 50; n++) {
        const before = g.lives;
        place(g, 0, makeDecoy(rng, g.pool, target(g)));
        whack(g, 0);
        expect(g.lives).toBe(before - 1);
        g.critters = [];
        g.lives = 5;
        g.phase = 'playing';
        place(g, 0, target(g));
        whack(g, 0);
        expect(g.lives).toBe(5);
        g.critters = [];
        g.phase = 'playing';
        g.progress = 0;
      }
    }
  });

  it('whacking an empty hole is a harmless miss', () => {
    const g = newGame(2, 1);
    g.streak = 3;
    expect(types(whack(g, 4))).toEqual(['miss']);
    expect(g.lives).toBe(TUNING.startLives);
    expect(g.streak).toBe(3);
  });

  it('tracks the best streak', () => {
    const g = newGame(1, 1);
    for (let i = 0; i < 4; i++) {
      place(g, 0, PLAIN_MOLE);
      whack(g, 0);
      g.critters = [];
    }
    g.streak = 0;
    expect(g.bestStreak).toBe(4);
  });
});

describe('Olé meter', () => {
  it('thresholds are the quarters of the goal', () => {
    expect(oleThresholds(8)).toEqual([2, 4, 6, 8]);
    expect(oleThresholds(12)).toEqual([3, 6, 9, 12]);
    expect(oleThresholds(16)).toEqual([4, 8, 12, 16]);
    expect(oleThresholds(20)).toEqual([5, 10, 15, 20]);
    expect([1, 2, 3, 4, 6, 8].map((p) => oleFor(p, 8))).toEqual([null, 1, null, 2, 3, 4]);
  });

  it('every division goal is a multiple of 4', () => {
    for (const d of DIVISIONS) expect(d.goal % 4).toBe(0);
  });

  for (let d = 1; d <= DIVISIONS.length; d++) {
    for (let s = 1; s <= STAGES.length; s++) {
      it(`division ${d} stage ${s}: each of the four cheers fires exactly once, in order`, () => {
        const g = newGame(d, s, d * 10 + s);
        const oles: number[] = [];
        for (let i = 0; i < g.stage.goal; i++) {
          place(g, 0, target(g));
          const ev = whack(g, 0).find((e) => e.type === 'hit');
          if (ev && ev.type === 'hit' && ev.ole) oles.push(ev.ole);
          g.critters = [];
        }
        expect(oles).toEqual([1, 2, 3, 4]);
        expect(g.phase).toBe('clear');
      });
    }
  }

  it('progress never goes backwards on mistakes, cards or escapes', () => {
    const g = newGame(2, 4, 9);
    place(g, 0, target(g));
    whack(g, 0);
    g.critters = [];
    expect(g.progress).toBe(1);
    place(g, 1, mole(otherKit(target(g).kit)));
    whack(g, 1);
    expect(g.progress).toBe(1);
    place(g, 3, REF);
    whack(g, 3);
    expect(g.progress).toBe(1);
    place(g, 2, target(g), 10);
    tick(g, 20);
    expect(g.progress).toBe(1);
    expect(g.lives).toBe(TUNING.startLives - 2);
  });

  it('streaks still earn bonus points but trigger no cheers', () => {
    const g = newGame(4, 6, 2);
    g.streak = 9;
    place(g, 0, target(g));
    const ev = whack(g, 0).find((e) => e.type === 'hit');
    expect(ev && ev.type === 'hit' && ev.ole).toBeNull();
    expect(ev && ev.type === 'hit' && ev.points).toBe(pointsFor(4, 6, 10));
  });
});

describe('escapes', () => {
  it('a target sinking unhit costs a life', () => {
    const g = newGame(1, 3);
    g.nextSpawnAt = Infinity;
    g.streak = 2;
    place(g, 0, target(g), 100);
    const ev = tick(g, 150);
    expect(types(ev)).toContain('escape');
    expect(g.lives).toBe(TUNING.startLives - 1);
    expect(g.streak).toBe(0);
  });

  it('a decoy sinking is fine', () => {
    const g = newGame(1, 3);
    g.nextSpawnAt = Infinity;
    g.lastTargetAt = Infinity; // stop the forced target spawn for this check
    place(g, 0, makeDecoy(mulberry32(1), g.pool, target(g)), 100);
    const ev = tick(g, 150);
    expect(types(ev)).not.toContain('escape');
    expect(g.lives).toBe(TUNING.startLives);
  });

  it('losing the last life ends the game', () => {
    const g = newGame(1, 1);
    g.lives = 1;
    place(g, 0, PLAIN_MOLE, 50);
    const ev = tick(g, 60);
    expect(types(ev)).toContain('gameOver');
    expect(g.phase).toBe('over');
  });
});

describe('max moles up', () => {
  it('is max(1, min(holes − 1, ceil(holes × factor))) and always leaves a hole empty', () => {
    expect(maxUpFor(4, 0.25)).toBe(1);
    expect(maxUpFor(4, 0.5)).toBe(2);
    expect(maxUpFor(9, 0.35)).toBe(4);
    expect(maxUpFor(25, 0.5)).toBe(13);
    expect(maxUpFor(1, 0.9)).toBe(1);
    for (const d of DIVISIONS) {
      const holes = d.grid * d.grid;
      for (const s of STAGES) {
        const m = maxUpFor(holes, s.maxUpFactor);
        expect(m).toBeGreaterThanOrEqual(1);
        expect(m).toBeLessThanOrEqual(holes - 1);
      }
    }
  });

  it('play never fills every hole', () => {
    for (let d = 1; d <= DIVISIONS.length; d++) {
      for (const s of [1, 5, 7]) {
        const g = newGame(d, s, d + s);
        g.lives = 1e9;
        const holes = g.stage.grid * g.stage.grid;
        for (let t = 0; t < 20_000; t += 16) {
          tick(g, 16);
          expect(g.critters.filter((c) => c.state === 'up').length).toBeLessThanOrEqual(holes - 1);
        }
      }
    }
  });
});

describe('divisions and stages', () => {
  it('a full run is 4 divisions × 7 stages on 2×2, 3×3, 4×4 and 5×5', () => {
    expect(MAIN_STAGES).toBe(28);
    const grids = [2, 3, 4, 5];
    for (let i = 0; i < MAIN_STAGES; i++) {
      const s = getStage(i);
      expect(s.division).toBe(Math.floor(i / 7) + 1);
      expect(s.number).toBe((i % 7) + 1);
      expect(s.grid).toBe(grids[s.division - 1]);
      expect(s.goal).toBe(DIVISIONS[s.division - 1].goal);
      expect(s.encore).toBe(0);
    }
  });

  it('applies the division speed multipliers', () => {
    const s = getStage(runIndex(3, 4));
    expect(s.spawnMs).toBeCloseTo(STAGES[3].spawnMs * 0.75);
    expect(s.upMs).toBeCloseTo(STAGES[3].upMs * 0.9);
  });

  it('stage modes run plain, plain, kit × 3, role × 2 with the referee from stage 2', () => {
    expect(STAGES.map((s) => s.mode)).toEqual(['plain', 'plain', 'kit', 'kit', 'kit', 'role', 'role']);
    expect(STAGES.map((s) => s.referee)).toEqual([false, true, true, true, true, true, true]);
  });

  it('clearing a stage gives a life back; promotion resets lives to 5', () => {
    const g = newGame(1, 1);
    g.lives = 3;
    let ev: GameEvent[] = [];
    for (let i = 0; i < g.stage.goal; i++) {
      place(g, 0, PLAIN_MOLE);
      ev = whack(g, 0);
      g.critters = [];
    }
    const clear = ev.find((e) => e.type === 'stageClear');
    expect(clear && clear.type === 'stageClear' && clear.promoted).toBe(false);
    nextStage(g);
    expect(g.phase).toBe('intro');
    expect(g.stage.number).toBe(2);
    expect(g.stage.grid).toBe(2);
    expect(g.progress).toBe(0);
    expect(g.lives).toBe(4);
    g.lives = TUNING.maxLives;
    nextStage(g);
    expect(g.lives).toBe(TUNING.maxLives);

    // End of the division: promoted, new board, full lives.
    const h = newGame(1, 7, 3);
    h.lives = 1;
    for (let i = 0; i < h.stage.goal; i++) {
      place(h, 0, target(h));
      ev = whack(h, 0);
      h.critters = [];
    }
    const c2 = ev.find((e) => e.type === 'stageClear');
    expect(c2 && c2.type === 'stageClear' && c2.promoted).toBe(true);
    nextStage(h);
    expect(h.stage.division).toBe(2);
    expect(h.stage.number).toBe(1);
    expect(h.stage.grid).toBe(3);
    expect(h.lives).toBe(TUNING.startLives);
  });

  it('a run can start in any division', () => {
    const g = createGame(mulberry32(1));
    startRun(g, runIndex(3));
    expect(g.stage.division).toBe(3);
    expect(g.stage.number).toBe(1);
    expect(g.stage.grid).toBe(4);
    expect(g.lives).toBe(TUNING.startLives);
  });

  it('after Top Flight comes Extra Time: Cup Tie on 5×5, faster each loop, goal 20', () => {
    const last = getStage(MAIN_STAGES - 1);
    const e1 = getStage(MAIN_STAGES);
    const e3 = getStage(MAIN_STAGES + 2);
    expect(e1.encore).toBe(1);
    expect(e3.encore).toBe(3);
    for (const e of [e1, e3]) {
      expect(e.grid).toBe(5);
      expect(e.goal).toBe(20);
      expect(e.mode).toBe('role');
      expect(e.division).toBe(4);
      expect(e.number).toBe(7);
    }
    expect(e1.spawnMs).toBeCloseTo(last.spawnMs * EXTRA_TIME.spawnMul);
    expect(e1.upMs).toBeCloseTo(last.upMs * EXTRA_TIME.upMul);
    expect(e3.spawnMs).toBeCloseTo(last.spawnMs * EXTRA_TIME.spawnMul ** 3);
    expect(e3.upMs).toBeCloseTo(last.upMs * EXTRA_TIME.upMul ** 3);

    // Clearing Top Flight stage 7 is not a promotion, and Extra Time keeps lives going.
    const g = newGame(4, 7, 4);
    g.lives = 2;
    let ev: GameEvent[] = [];
    for (let i = 0; i < g.stage.goal; i++) {
      place(g, 0, target(g));
      ev = whack(g, 0);
      g.critters = [];
    }
    const c = ev.find((e) => e.type === 'stageClear');
    expect(c && c.type === 'stageClear' && c.promoted).toBe(false);
    nextStage(g);
    expect(g.stage.encore).toBe(1);
    expect(g.lives).toBe(3);
  });
});

describe('spawning simulation', () => {
  function simulate(division: number, stage: number, seed: number, ms: number) {
    const g = newGame(division, stage, seed);
    g.lives = 1e9; // never die in the sim
    let gap = 0;
    let longestGap = 0;
    const step = 16;
    for (let t = 0; t < ms; t += step) {
      tick(g, step);
      if (targetOnBoard(g)) gap = 0;
      else gap += step;
      longestGap = Math.max(longestGap, gap);
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
    return longestGap;
  }

  for (let d = 1; d <= DIVISIONS.length; d++) {
    for (const s of [3, 4, 5, 6, 7]) {
      it(`division ${d} stage ${s} never goes more than ~2s without a target`, () => {
        for (const seed of [1, 2, 3]) expect(simulate(d, s, seed, 40_000)).toBeLessThanOrEqual(2000);
      });
    }
  }

  it('critters only use holes on the current grid', () => {
    const g = newGame(1, 2, 7);
    for (let t = 0; t < 20_000; t += 16) {
      for (const e of tick(g, 16)) {
        if (e.type === 'spawn') expect(e.critter.hole).toBeLessThan(4);
      }
      g.lives = 5;
    }
  });
});
