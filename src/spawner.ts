// Spawn + decoy selection. Pure functions over an injected RNG.
import { ANIMALS, DECOY_RATIOS, HAT_COLORS, TUNING } from './config';
import type { Animal, HatColor, ItemType, Mode } from './config';

export type Rng = () => number;

export interface StagePool {
  mode: Mode;
  colors: HatColor[];
  animals: Animal[];
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

export function between(rng: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * rng();
}

export function poolFor(mode: Mode, colors: number, animals: number): StagePool {
  return {
    mode,
    colors: HAT_COLORS.slice(0, colors),
    animals: mode === 'animal' ? ANIMALS.slice(0, animals) : ['mole'],
  };
}

/** Does the item count as a valid hit for this target in this mode? */
export function matches(item: ItemType, target: ItemType, mode: Mode): boolean {
  switch (mode) {
    case 'plain':
      return item.animal === 'mole';
    case 'hat':
      return item.color === target.color;
    case 'animal':
      return item.color === target.color && item.animal === target.animal;
  }
}

/** A random target for the queue. */
export function randomTarget(rng: Rng, pool: StagePool): ItemType {
  if (pool.mode === 'plain') return { animal: 'mole', color: 'none' };
  return {
    animal: pool.mode === 'animal' ? pick(rng, pool.animals) : 'mole',
    color: pick(rng, pool.colors),
  };
}

function others<T>(list: readonly T[], not: T): T[] {
  return list.filter((x) => x !== not);
}

/** A decoy that never matches the target. */
export function makeDecoy(rng: Rng, pool: StagePool, target: ItemType): ItemType {
  if (pool.mode === 'plain') {
    // Every mole is valid in plain mode; there are no decoys.
    return { animal: 'mole', color: 'none' };
  }
  const wrongColors = others(pool.colors, target.color as HatColor);
  if (pool.mode === 'hat') {
    return { animal: 'mole', color: pick(rng, wrongColors) };
  }
  const wrongAnimals = others(pool.animals, target.animal);
  const r = rng();
  const canWrongColor = wrongColors.length > 0;
  const canWrongAnimal = wrongAnimals.length > 0;
  if (canWrongColor && (r < DECOY_RATIOS.rightAnimalWrongColor || !canWrongAnimal)) {
    return { animal: target.animal, color: pick(rng, wrongColors) };
  }
  if (canWrongAnimal && r < DECOY_RATIOS.rightAnimalWrongColor + DECOY_RATIOS.rightColorWrongAnimal) {
    return { animal: pick(rng, wrongAnimals), color: target.color };
  }
  return { animal: pick(rng, wrongAnimals), color: pick(rng, pool.colors) };
}

/** Choose what to spawn on a regular tick. */
export function chooseSpawn(
  rng: Rng,
  pool: StagePool,
  target: ItemType,
  targetOnBoard: boolean,
): ItemType {
  if (pool.mode === 'plain') return { animal: 'mole', color: 'none' };
  const chance = targetOnBoard ? TUNING.targetChanceSome : TUNING.targetChanceNone;
  if (rng() < chance) return { ...target };
  return makeDecoy(rng, pool, target);
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
