// Best score / best streak / highest division reached / settings (colour mode, mute) in localStorage. Every access is guarded:
// storage can be missing or throw (private windows, blocked site data).

const KEY = 'ole-mole:v1';

export interface Saved {
  bestScore: number;
  bestStreak: number;
  /** Highest division reached (1…4). The ticket lets the player kick off from any of them. */
  highestDivision: number;
  patternsOnly: boolean;
  muted: boolean;
}

const DEFAULTS: Saved = { bestScore: 0, bestStreak: 0, highestDivision: 1, patternsOnly: false, muted: false };

export function load(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const data = JSON.parse(raw) as Partial<Saved>;
    return {
      bestScore: Number(data.bestScore) || 0,
      bestStreak: Number(data.bestStreak) || 0,
      highestDivision: Math.max(1, Math.min(4, Math.floor(Number(data.highestDivision) || 1))),
      patternsOnly: Boolean(data.patternsOnly),
      muted: Boolean(data.muted),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data: Saved): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore: best score just won't persist */
  }
}

/** Merge a finished run into the saved bests. Returns the updated record and whether the score is a new best. */
export function recordRun(score: number, streak: number): { saved: Saved; newBest: boolean } {
  const saved = load();
  const newBest = score > saved.bestScore;
  saved.bestScore = Math.max(saved.bestScore, score);
  saved.bestStreak = Math.max(saved.bestStreak, streak);
  save(saved);
  return { saved, newBest };
}

/** Remember that the player has reached `division`. */
export function recordDivision(division: number): Saved {
  const saved = load();
  if (division > saved.highestDivision) {
    saved.highestDivision = Math.min(4, division);
    save(saved);
  }
  return saved;
}
