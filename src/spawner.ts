// Spawn, referee and decoy selection. Pure functions over an injected RNG.
import { DECOY_RATIOS, KITS, REFEREE, ROLES, TUNING } from './config';
import type { ItemType, Kit, Mode, Role } from './config';

export type Rng = () => number;

export interface StagePool {
  mode: Mode;
  kits: Kit[];
  roles: Role[];
  referee: boolean;
}

export const PLAIN_MOLE: ItemType = Object.freeze({ kit: 'none', role: 'none', isRef: false }) as ItemType;
export const REF: ItemType = Object.freeze({ kit: 'none', role: 'none', isRef: true }) as ItemType;

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

export function between(rng: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * rng();
}

export function poolFor(mode: Mode, kits: number, roles: number, referee: boolean): StagePool {
  return {
    mode,
    kits: mode === 'plain' ? [] : KITS.slice(0, kits),
    roles: mode === 'role' ? ROLES.slice(0, roles) : [],
    referee,
  };
}

/** Does the item count as a valid hit for this target in this mode? The referee never does. */
export function matches(item: ItemType, target: ItemType, mode: Mode): boolean {
  if (item.isRef) return false;
  switch (mode) {
    case 'plain':
      return true;
    case 'kit':
      return item.kit === target.kit;
    case 'role':
      return item.kit === target.kit && item.role === target.role;
  }
}

/** A random target for the queue. Never the referee. */
export function randomTarget(rng: Rng, pool: StagePool): ItemType {
  if (pool.mode === 'plain') return { ...PLAIN_MOLE };
  return {
    kit: pick(rng, pool.kits),
    role: pool.mode === 'role' ? pick(rng, pool.roles) : 'none',
    isRef: false,
  };
}

function others<T>(list: readonly T[], not: T): T[] {
  return list.filter((x) => x !== not);
}

/** A decoy mole that never matches the target. */
export function makeDecoy(rng: Rng, pool: StagePool, target: ItemType): ItemType {
  if (pool.mode === 'plain') {
    // Every mole is valid in plain mode; there are no decoys (only the referee).
    return { ...PLAIN_MOLE };
  }
  const wrongKits = others(pool.kits, target.kit as Kit);
  if (pool.mode === 'kit') {
    return { kit: pick(rng, wrongKits), role: 'none', isRef: false };
  }
  const wrongRoles = others(pool.roles, target.role as Role);
  const r = rng();
  const canWrongKit = wrongKits.length > 0;
  const canWrongRole = wrongRoles.length > 0;
  if (canWrongKit && (r < DECOY_RATIOS.rightRoleWrongKit || !canWrongRole)) {
    return { kit: pick(rng, wrongKits), role: target.role, isRef: false };
  }
  if (canWrongRole && r < DECOY_RATIOS.rightRoleWrongKit + DECOY_RATIOS.rightKitWrongRole) {
    return { kit: target.kit, role: pick(rng, wrongRoles), isRef: false };
  }
  return { kit: pick(rng, pool.kits), role: pick(rng, wrongRoles), isRef: false };
}

/** Choose what to spawn on a regular tick. */
export function chooseSpawn(
  rng: Rng,
  pool: StagePool,
  target: ItemType,
  targetOnBoard: boolean,
  refsUp: number,
): ItemType {
  if (pool.referee && refsUp < REFEREE.maxUp && rng() < REFEREE.chance) return { ...REF };
  if (pool.mode === 'plain') return { ...PLAIN_MOLE };
  const chance = targetOnBoard ? TUNING.targetChanceSome : TUNING.targetChanceNone;
  if (rng() < chance) return { ...target };
  return makeDecoy(rng, pool, target);
}

/** Max moles up at once on a board of `holes`. There is always at least one empty hole. */
export function maxUpFor(holes: number, factor: number): number {
  return Math.max(1, Math.min(holes - 1, Math.ceil(holes * factor)));
}

/** Small deterministic RNG for tests and seeded runs. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
