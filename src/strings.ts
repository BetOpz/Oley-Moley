// Every player-facing string lives here so it can be tweaked or localised.
import type { Animal, HatColor } from './config';

export const STR = {
  gameTitle: 'Olé Molé!',
  posterKicker: 'Gran Fiesta de Topos',
  posterPlaza: 'Plaza de los Topos',
  posterTagline: 'Whack the moles · ¡Olé!',
  posterPlay: 'Play',
  posterTicketSub: 'Entrada · Sol y Sombra',
  posterBest: (score: number) => `Best ${score}`,

  score: 'Score',
  stage: 'Stage',
  lives: 'Lives',
  livesAria: (n: number, max: number) => `${n} of ${max} lives`,

  introStageLine: (num: number, grid: number) => `Stage ${num} · ${grid} × ${grid}`,
  introGo: '¡Vamos!',
  gridSize: (n: number) => `${n} × ${n}`,
  nowLabel: 'AHORA',

  stageClear: '¡Bravo!',

  gameOverTitle: '¡Se acabó!',
  gameOverSub: "It's over!",
  gameOverScore: 'Score',
  gameOverStage: 'Stage reached',
  gameOverBest: 'Best score',
  gameOverBestStreak: 'Best streak',
  gameOverNewBest: '¡Nuevo récord!',
  playAgain: 'Play again',

  callouts: {
    ole: '¡Olé!',
    oleOle: '¡Olé, olé!',
    oleMax: '¡OLÉ!',
    torero: '¡Torero!',
    wrongHat: '¡Ay, el sombrero!',
    wrongAnimal: '¡Ese no!',
    escape: '¡Se escapó!',
  },

  colourToggle: 'Toggle colour (pattern-only mode)',
  boardAria: 'Arena. Use arrow keys to move, Space or Enter to whack.',
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
    bull: 'bull calf',
  } as Record<Animal, string>,

  ruleAny: 'Whack any mole',
  patternHint: (c: HatColor) => `(${STR.patternName[c]} band)`,
  ruleHat: (c: HatColor) => `Hit ${STR.colorName[c]} hats`,
  ruleAnimal: (a: Animal, c: HatColor) => `Hit the ${STR.animalName[a]} in ${STR.colorName[c]}`,
  itemLabel: (a: Animal, c: HatColor | 'none') =>
    c === 'none' ? STR.animalName[a] : `${STR.animalName[a]} in ${STR.colorName[c]} hat (${STR.patternName[c]})`,

  stages: [
    { title: 'El Paseíllo', sub: 'The opening parade.', rule: 'Whack any mole that pops up.' },
    { title: 'Más Agujeros', sub: 'More holes, quicker moles.', rule: 'Whack any mole — they are faster now.' },
    { title: '¡Sombreros!', sub: 'Hats on.', rule: 'Only whack the hat shown on the front tile.' },
    { title: 'Toda la Moda', sub: 'All four hat colours.', rule: 'Match the front tile’s hat — four colours now.' },
    { title: 'Los Invitados', sub: 'The guests arrive.', rule: 'Match the animal and the hat.' },
    { title: 'La Gran Fiesta', sub: 'Every animal, every hat.', rule: 'Five by five. Match the animal and the hat.' },
  ],
  encoreTitle: (n: number) => `Otra Vez ${n}`,
  encoreSub: 'Again — and faster!',

  months: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ],
  weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  posterDate: (d: Date) => {
    const day = STR.weekdays[d.getDay()];
    return `${day[0].toUpperCase()}${day.slice(1)}, ${d.getDate()} de ${STR.months[d.getMonth()]} de ${d.getFullYear()}`;
  },
};
