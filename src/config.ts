// Tuning, division and stage tables, kits, roles and the referee. No DOM in here.

export type Kit = 'red' | 'blue' | 'yellow' | 'purple';
export type KitOrNone = Kit | 'none';
export type Role = 'player' | 'keeper' | 'fan';
export type RoleOrNone = Role | 'none';
export type Mode = 'plain' | 'kit' | 'role';

/** Something that pops up. Every item is a mole. */
export interface ItemType {
  kit: KitOrNone;
  role: RoleOrNone;
  isRef: boolean;
}

export interface DivisionDef {
  grid: number;
  /** Hits per stage. A multiple of 4 so the Olé meter splits evenly into quarters. */
  goal: number;
  spawnMul: number;
  upMul: number;
}

export interface StageDef {
  mode: Mode;
  /** How many kits are in play (first N of KITS). 0 in plain stages. */
  kits: number;
  /** How many roles are in play (first N of ROLES). 0 outside role stages. */
  roles: number;
  referee: boolean;
  spawnMs: number;
  upMs: number;
  /** Max moles up = max(1, min(holes − 1, ceil(holes × factor))). */
  maxUpFactor: number;
}

/** Order matters: stages take the first N. No kit is black: black belongs to the referee. */
export const KITS: Kit[] = ['red', 'blue', 'yellow', 'purple'];
export const ROLES: Role[] = ['player', 'keeper', 'fan'];

export const DIVISIONS: DivisionDef[] = [
  { grid: 2, goal: 8, spawnMul: 1.0, upMul: 1.0 },
  { grid: 3, goal: 12, spawnMul: 0.85, upMul: 0.95 },
  { grid: 4, goal: 16, spawnMul: 0.75, upMul: 0.9 },
  { grid: 5, goal: 20, spawnMul: 0.65, upMul: 0.85 },
];

export const STAGES: StageDef[] = [
  { mode: 'plain', kits: 0, roles: 0, referee: false, spawnMs: 950, upMs: 1500, maxUpFactor: 0.25 },
  { mode: 'plain', kits: 0, roles: 0, referee: true, spawnMs: 900, upMs: 1500, maxUpFactor: 0.3 },
  { mode: 'kit', kits: 2, roles: 0, referee: true, spawnMs: 850, upMs: 1600, maxUpFactor: 0.35 },
  { mode: 'kit', kits: 3, roles: 0, referee: true, spawnMs: 800, upMs: 1600, maxUpFactor: 0.4 },
  { mode: 'kit', kits: 4, roles: 0, referee: true, spawnMs: 780, upMs: 1550, maxUpFactor: 0.45 },
  { mode: 'role', kits: 3, roles: 3, referee: true, spawnMs: 760, upMs: 1700, maxUpFactor: 0.45 },
  { mode: 'role', kits: 4, roles: 3, referee: true, spawnMs: 720, upMs: 1650, maxUpFactor: 0.5 },
];

/** After Top Flight stage 7: Extra Time 1, 2, 3… with these multipliers applied per loop. */
export const EXTRA_TIME = {
  spawnMul: 0.92,
  upMul: 0.93,
};

export const REFEREE = {
  /** Share of spawns that are the referee (when none is up and the stage has one). */
  chance: 0.12,
  maxUp: 1,
  /** Yellow cards in one stage that make a red card (and cost a life). */
  yellowsForRed: 2,
};

export const TUNING = {
  startLives: 5,
  maxLives: 5,
  queueLength: 6,
  /** How many upcoming targets the top hoarding shows after NOW. */
  queueShown: 3,
  /** Random spread on each spawn gap and each time up. */
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
  /** Scoring: 10 × division + 2 × stage + min(streak − 1, comboCap) × comboStep. */
  divisionPoints: 10,
  stagePoints: 2,
  comboCap: 10,
  comboStep: 2,
};

/** Decoy mix for role stages. Must sum to 1. */
export const DECOY_RATIOS = {
  rightRoleWrongKit: 0.45,
  rightKitWrongRole: 0.35,
  wrongRoleAnyKit: 0.2,
};

/** The Olé meter: stage progress split into four equal sections, one per stand. */
export const OLE_SECTIONS = 4;

/** Colours used by the art. Kit colours are picked to differ in brightness too. */
export const PALETTE = {
  kits: {
    red: '#d62b36',
    blue: '#2f6fd6',
    yellow: '#f4c430',
    purple: '#7b3fa8',
    none: '#888888',
  } as Record<KitOrNone, string>,
  kitsDark: {
    red: '#8f141d',
    blue: '#18408a',
    yellow: '#a87f00',
    purple: '#47206a',
    none: '#555555',
  } as Record<KitOrNone, string>,
  /** The yellow kit's sash. */
  sash: '#1f2a44',
  ref: '#16181d',
  ink: '#1c2230',
  white: '#ffffff',
  chalk: '#f4f7f2',
  mole: '#7a4a2b',
  belly: '#c99a6c',
  turf: '#3f9b4a',
  turfDark: '#358a40',
  dusk: '#26345a',
  stand: '#3a4258',
};
