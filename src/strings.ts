// Every player-facing string lives here so it can be tweaked or localised.
// Plain British English. "Olé" appears only in the title and the crowd's four cheers
// (tests/strings.test.ts enforces this).
import type { Kit, KitOrNone, Role, RoleOrNone } from './config';

export const STR = {
  gameTitle: 'Olé Molé!',

  ticketKicker: 'Matchday ticket',
  ticketFixture: 'Moles v Mallets',
  ticketGround: 'North Stand · Row M · Seat 1',
  ticketChoose: 'Kick off in',
  ticketPlay: 'Play',
  ticketStubSub: 'Kick-off',
  ticketBest: (score: number) => `Best score ${score}`,

  score: 'Score',
  division: 'Div',
  stage: 'Stage',
  lives: 'Lives',
  cards: 'Cards',
  livesAria: (n: number, max: number) => `${n} of ${max} lives`,
  cardsAria: (yellows: number) => (yellows ? `${yellows} yellow card` : 'No cards'),
  streak: (n: number) => `×${n} streak`,
  meterAria: 'Stage progress',
  mute: 'Sound on or off',
  colourToggle: 'Colour off (patterns only)',

  introLine: (division: string, num: number, grid: number) => `${division} · Stage ${num} · ${grid} × ${grid}`,
  introGo: 'Play',
  nowLabel: 'NOW',
  hitAny: 'HIT ANY MOLE',
  notTheRef: 'NOT THE REF',

  /** The crowd's four cheers, one per section of the stage progress meter. */
  cheers: ['Olé!', 'Olé, olé!', 'Olé, olé, olé!', 'Olé, olé, olé, olé!'] as const,

  messages: {
    wrongKit: 'Wrong kit!',
    wrongRole: 'Wrong one!',
    yellow: 'Yellow card!',
    red: 'Red card!',
    escape: 'Got away!',
  },

  promotedKicker: 'Promoted!',
  promotedTitle: (division: string) => `Promoted to ${division}!`,
  promotedBoard: (grid: number) => `New pitch: ${grid} × ${grid} holes`,
  promotedGo: 'Kick off',

  fullTimeTitle: 'Full time',
  fullTimeScore: 'Score',
  fullTimeReached: 'Reached',
  fullTimeReachedValue: (division: string, stage: string) => `${division}, ${stage}`,
  fullTimeBest: 'Best score',
  fullTimeNewBest: 'New best!',
  playAgain: 'Play again',

  boardAria: 'Pitch. Use arrow keys to move, Space or Enter to whack.',
  holeAria: (row: number, col: number, what: string | null) =>
    `Hole ${row + 1}, ${col + 1}${what ? `: ${what}` : ''}`,

  kitName: {
    red: 'red',
    blue: 'blue',
    yellow: 'yellow',
    purple: 'purple',
  } as Record<Kit, string>,
  patternName: {
    red: 'stripes',
    blue: 'hoops',
    yellow: 'sash',
    purple: 'halves',
  } as Record<Kit, string>,
  roleName: {
    player: 'player',
    keeper: 'keeper',
    fan: 'fan',
  } as Record<Role, string>,
  referee: 'referee',
  mole: 'mole',

  ruleAny: 'Hit any mole',
  ruleAnyRef: 'Hit any mole. Not the ref!',
  ruleKit: (k: Kit) => `Hit ${STR.kitName[k]}`,
  ruleRole: (k: Kit, r: Role) => `Hit the ${STR.kitName[k]} ${STR.roleName[r]}`,
  patternHint: (k: Kit) => `${STR.patternName[k]}`,
  itemLabel: (kit: KitOrNone, role: RoleOrNone, isRef: boolean) => {
    if (isRef) return STR.referee;
    if (kit === 'none') return STR.mole;
    const r = role === 'none' ? STR.mole : STR.roleName[role];
    return `${STR.kitName[kit]} ${r} (${STR.patternName[kit]})`;
  },

  divisions: ['Sunday League', 'Division Two', 'Division One', 'Top Flight'],
  stages: [
    { title: 'Warm-up', rule: 'Hit any mole.' },
    { title: 'Watch the Ref', rule: 'Hit any mole, but never the referee in black.' },
    { title: 'Home & Away', rule: 'Hit only the kit on the NOW board. Red or blue.' },
    { title: 'Three Teams', rule: 'Yellow joins in.' },
    { title: 'All Four Kits', rule: 'Purple joins in.' },
    { title: 'The Squad', rule: 'Match the kit and the role: player, keeper or fan.' },
    { title: 'Cup Tie', rule: 'All four kits, all three roles.' },
  ],
  extraTimeTitle: (n: number) => `Extra Time ${n}`,
  extraTimeShort: (n: number) => `ET${n}`,
  extraTimeRule: 'Same again, only faster.',
};
