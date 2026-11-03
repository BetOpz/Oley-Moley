// Every player-facing string lives here so it can be tweaked or localised.
// Plain British English. "Olé" appears only in the title and the crowd's three cheers
// (tests/strings.test.ts enforces this).
import type { Animal, HatColor } from './config';

export const STR = {
  gameTitle: 'Olé Molé!',

  ticketKicker: 'Matchday ticket',
  ticketFixture: 'Moles v Mallets',
  ticketGround: 'North Stand · Row M · Seat 1',
  ticketPlay: 'Play',
  ticketStubSub: 'Kick-off',
  ticketBest: (score: number) => `Best score ${score}`,

  score: 'Score',
  stage: 'Stage',
  lives: 'Lives',
  livesAria: (n: number, max: number) => `${n} of ${max} lives`,
  streak: (n: number) => `×${n} streak`,
  meterAria: 'Stage progress',
  mute: 'Sound on or off',
  colourToggle: 'Colour off (patterns only)',

  introStageLine: (num: number, grid: number) => `Stage ${num} · ${grid} × ${grid}`,
  introGo: 'Play',
  nowLabel: 'NOW',
  nextLabel: 'Next',
  whackAny: 'WHACK ANY MOLE',

  /** The crowd's three cheers, one per section of the stage progress meter. */
  cheers: ['Olé!', 'Olé, olé!', 'Olé, olé, olé!'] as const,

  messages: {
    wrongHat: 'Wrong hat!',
    wrongAnimal: 'Wrong one!',
    escape: 'Got away!',
  },

  fullTimeTitle: 'Full time',
  fullTimeScore: 'Score',
  fullTimeStage: 'Stage reached',
  fullTimeBest: 'Best score',
  fullTimeNewBest: 'New best!',
  playAgain: 'Play again',

  boardAria: 'Pitch. Use arrow keys to move, Space or Enter to whack.',
  holeAria: (row: number, col: number, what: string | null) =>
    `Hole ${row + 1}, ${col + 1}${what ? `: ${what}` : ''}`,

  colorName: {
    red: 'red',
    blue: 'blue',
    yellow: 'yellow',
    purple: 'purple',
  } as Record<HatColor, string>,
  patternName: {
    red: 'stripes',
    blue: 'dots',
    yellow: 'star',
    purple: 'zigzag',
  } as Record<HatColor, string>,
  animalName: {
    mole: 'mole',
    rabbit: 'rabbit',
    frog: 'frog',
    fox: 'fox',
  } as Record<Animal, string>,

  ruleAny: 'Whack any mole',
  patternHint: (c: HatColor) => `${STR.patternName[c]} band`,
  ruleHat: (c: HatColor) => `Hit ${STR.colorName[c]} hats`,
  ruleAnimal: (a: Animal, c: HatColor) => `Hit the ${STR.animalName[a]} in ${STR.colorName[c]}`,
  itemLabel: (a: Animal, c: HatColor | 'none') =>
    c === 'none' ? STR.animalName[a] : `${STR.animalName[a]} in ${STR.colorName[c]} hat (${STR.patternName[c]})`,

  stages: [
    { title: 'Kick-off', rule: 'Whack any mole.' },
    { title: 'More Holes', rule: 'Bigger pitch, quicker moles.' },
    { title: 'Hats On', rule: 'Only whack the hat colour on the NOW panel.' },
    { title: 'Full Kit', rule: 'All four hat colours.' },
    { title: 'Mascots', rule: 'Other animals join. Match the animal and the hat.' },
    { title: 'Cup Final', rule: '5 × 5, every animal, every hat.' },
  ],
  extraTimeTitle: (n: number) => `Extra Time ${n}`,
  extraTimeRule: 'Same again, only faster.',
};
