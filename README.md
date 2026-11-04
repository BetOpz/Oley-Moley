# Olé Molé!

A whack-a-mole prototype set at a British football match. The name comes from the terrace
chant, not from Spain. Every critter is a mole. They pop up in team kits, and you hit only the
kit (and later the role) on the pitch-side hoardings, and never the referee. The game climbs
through four divisions, each on a bigger pitch, and each runs through the same seven stages.

## Run it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

Add `?div=3&stage=5` to the URL to start a run at Division One, stage 5. This is meant for testing.

## Divisions and stages

| Division | Pitch | Hits per stage |
|---|---|---|
| 1. Sunday League | 2 × 2 | 8 |
| 2. Division Two | 3 × 3 | 12 |
| 3. Division One | 4 × 4 | 16 |
| 4. Top Flight | 5 × 5 | 20 |

Every division plays the same seven stages, faster in each division: Warm-up (any mole), Watch
the Ref (any mole, never the referee), Home & Away (red or blue kit), Three Teams, All Four
Kits, The Squad (kit and role) and Cup Tie. After Top Flight comes Extra Time 1, 2, 3…, each
loop faster.

- **Kits:** red has vertical stripes, blue has hoops, yellow has a dark sash and purple is
  halves, so every kit can be told apart without colour.
- **Roles:** a player has a football on its head, a keeper holds up big gloves and a fan holds
  a scarf above its head.
- **Referee:** all black, with a whistle. Hitting him is a yellow card; a second yellow in the
  same stage is a red card and costs a life.
- **Lives:** five footballs, reset at each promotion. One comes back after each stage clear.
- **Start:** the ticket lets you kick off in any division you've already reached.

## The stadium

The screen is a stadium seen from above, with the pitch in the middle and stands on all four
sides. The player never has to look away from the pitch to know what to hit:

- **Pitch-side hoardings** on all four sides show the current target's kit, plus the role in
  role stages. The top hoarding has a **NOW** panel at each end and the next three targets.
  Plain stages show "HIT ANY MOLE", and "NOT THE REF" once the referee is about.
- **Target change:** the top hoarding scrolls sideways like an LED board (about 200 ms), then
  the new kit sweeps round the other three (about 150 ms), then the crowd's card display
  ripples. Everything has updated within 400 ms.
- **Rule label:** "Hit red" or "Hit the blue keeper" shows in the centre circle for about 1.5
  seconds when the target changes. It never blocks taps.
- **Scoreboard:** score with the streak, division and stage, lives, cards and the Olé meter.
  On wide screens it sits in a full-height stand on the left so the pitch can be bigger.

### The Olé meter

The stage progress bar is split into four sections. It fills by one per correct hit and never
goes backwards: mistakes cost lives, not progress.

| Hits reached | Cheer | What happens |
|---|---|---|
| `goal × 1/4` | "Olé!" | The top stand jumps up |
| `goal × 2/4` | "Olé, olé!" | The right stand joins in |
| `goal × 3/4` | "Olé, olé, olé!" | The bottom stand joins in |
| `goal` | "Olé, olé, olé, olé!" | All four stands, scarves waving, confetti, stage clear |

## Controls

- **Mouse / touch:** tap a hole (`pointerdown`).
- **Keyboard:** Tab into the pitch, use the arrow keys to move between holes and press
  Space or Enter to whack.
- **Speaker button** on the scoreboard: sound on or off (remembered).
- **Half-circle button:** greyscale, pattern-only mode.

## Sound

`src/audio.ts` loads recordings from `public/audio/` by name (see
[`public/audio/README.md`](public/audio/README.md)). Any file that's missing falls back to a
synthesised placeholder, so the game runs before real recordings exist. The Olé chant
(`ole-1`..`ole-4`) and the background crowd (`crowd-loop`) have no placeholder: they are
silent until real recordings are added. Sound starts only
after the first tap.

## Text

Every player-facing string is in `src/strings.ts`, in plain British English. "Olé" appears
only in the title and the crowd's four cheers. `tests/strings.test.ts` fails if any other
Spanish word, "¡", "¿" or "ñ" gets into that file.

## Layout

```
src/
  main.ts            bootstraps, wires the game to the DOM and sound, runs the frame loop
  config.ts          divisions, stages, kits, roles, referee, tuning, decoy ratios
  strings.ts         every player-facing string
  game.ts            pure game state + rules (no DOM); driven by tick(dt) and whack(hole)
  spawner.ts         matches(), referee, target and decoy selection, max-up formula, seeded RNG
  audio.ts           sound manager with synthesised fallbacks
  storage.ts         best score, highest division and settings in localStorage (try/catch)
  render/stadium.ts  stands, crowd card display, hoardings, scroll and sweep, rule label, cheers
  render/board.ts    pitch, holes, moles, keyboard navigation
  render/hud.ts      scoreboard: score, streak, division, stage, lives, cards, Olé meter
  render/overlay.ts  matchday ticket, stage intro, promotion, full time
  render/art.ts      inline SVG: moles, kits, role props, referee, footballs, hoardings, crowd
  render/fx.ts       text pops, floating points, referee cards, confetti, shake
public/audio/        real recordings go here
tests/
  game.test.ts       rules, referee, decoys, queue, scoring, Olé thresholds, divisions
  strings.test.ts    no Spanish text
```
