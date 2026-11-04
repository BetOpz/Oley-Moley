// Tuning, stage table, colours and animals. No DOM in here.

export type Animal = 'mole' | 'rabbit' | 'frog' | 'fox';
export type HatColor = 'red' | 'blue' | 'yellow' | 'purple';
export type Color = HatColor | 'none';
export type Mode = 'plain' | 'hat' | 'animal';

export interface ItemType {
  animal: Animal;
  color: Color;
}

export interface StageDef {
  grid: number;
  mode: Mode;
  /** How many hat colours are in play (first N of HAT_COLORS). 0 in plain stages. */
  colors: number;
  /** How many animals are in play (first N of ANIMALS). */
  animals: number;
  goal: number;
  spawnMs: number;
  upMs: number;
  maxUp: number;
}

/** Order matters: stages take the first N of each list. */
export const HAT_COLORS: HatColor[] = ['red', 'blue', 'yellow', 'purple'];
export const ANIMALS: Animal[] = ['mole', 'rabbit', 'frog', 'fox'];

export const STAGES: StageDef[] = [
  { grid: 2, mode: 'plain', colors: 0, animals: 1, goal: 9, spawnMs: 950, upMs: 1500, maxUp: 1 },
  { grid: 3, mode: 'plain', colors: 0, animals: 1, goal: 9, spawnMs: 950, upMs: 1700, maxUp: 2 },
  { grid: 3, mode: 'hat', colors: 3, animals: 1, goal: 12, spawnMs: 720, upMs: 1600, maxUp: 3 },
  { grid: 4, mode: 'hat', colors: 4, animals: 1, goal: 12, spawnMs: 620, upMs: 1450, maxUp: 4 },
  { grid: 4, mode: 'animal', colors: 3, animals: 3, goal: 12, spawnMs: 640, upMs: 1600, maxUp: 5 },
  { grid: 5, mode: 'animal', colors: 4, animals: 4, goal: 15, spawnMs: 540, upMs: 1400, maxUp: 6 },
];

/** After the last stage, it repeats forever with these multipliers applied per loop. */
export const ENCORE = {
  spawnMul: 0.92,
  upMul: 0.93,
};

export const TUNING = {
  startLives: 5,
  maxLives: 5,
  queueLength: 6,
  /** Random spread on each spawn gap and each time-up. */
  spawnJitter: [0.7, 1.3] as const,
  upJitter: [0.85, 1.15] as const,
  /** Chance of spawning the target when none is up / when one already is. */
  targetChanceNone: 0.6,
  targetChanceSome: 0.28,
  /** If no target has been up for this long, force one in (keeps "never > ~2s without a target"). */
  forceTargetAfterMs: 1000,
  /** Delay before the first spawn of a stage. */
  firstSpawnMs: 450,
  /** Critter animation timings the game clock waits on before freeing a hole. */
  bonkMs: 340,
  sinkMs: 180,
  /** Scoring: 10 × stage + min(streak − 1, comboCap) × comboStep. */
  basePoints: 10,
  comboCap: 10,
  comboStep: 2,
};

/** Decoy mix for animal stages. Must sum to 1. */
export const DECOY_RATIOS = {
  rightAnimalWrongColor: 0.45,
  rightColorWrongAnimal: 0.35,
  wrongAnimalAnyColor: 0.2,
};

/** The Olé meter: stage progress split into three equal sections. */
export const OLE_SECTIONS = 3;

/** Colours used by the art. Hat colours are picked to differ in brightness too. */
export const PALETTE = {
  hats: {
    red: '#d62b36',
    blue: '#2f6fd6',
    yellow: '#f4c430',
    purple: '#7b3fa8',
    none: '#888888',
  } as Record<Color, string>,
  hatsDark: {
    red: '#8f141d',
    blue: '#18408a',
    yellow: '#a87f00',
    purple: '#47206a',
    none: '#555555',
  } as Record<Color, string>,
  ink: '#1c2230',
  white: '#ffffff',
  chalk: '#f4f7f2',
  turf: '#3f9b4a',
  turfDark: '#358a40',
  dusk: '#26345a',
  stand: '#3a4258',
};
