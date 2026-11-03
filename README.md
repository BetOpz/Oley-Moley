# Olé Molé!

A whack-a-mole prototype set at a British football match. The name comes from the terrace
chant, not from Spain. The grid grows from 2 × 2 to 5 × 5 and the rules stack up: plain
moles, then moles in coloured bobble hats, then mascots (mole, rabbit, frog, fox) in bobble
hats. The crowd cheers "Olé!" as you work through each stage.

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

Add `?stage=5` to the URL to start a run at a later stage. This is meant for testing.

## The stadium

The screen is a stadium seen from above, with the pitch in the middle and stands on all four
sides. The player never has to look away from the pitch to know what to hit:

- **Pitch-side hoardings** on all four sides show the current target's colour and band
  pattern, plus the mascot in animal stages. The top hoarding has a **NOW** panel at each
  end and the next three targets, smaller and dimmer. Plain stages show "WHACK ANY MOLE".
- **Target wipe:** when the target changes, the new colour wipes outwards from the NOW
  panel round the pitch in about 150 ms. The crowd's card display ripples outwards just
  after it, and everything has updated within 300 ms.
- **Rule label:** "Hit blue hats" or "Hit the rabbit in red" shows in the centre circle for
  about 1.5 seconds when the target changes. It never blocks taps.
- **Scoreboard** in the top stand: score with the streak, stage, five football lives, and
  the Olé meter.

### The Olé meter

The stage progress bar is split into three sections. It fills by one per correct hit and
never goes backwards: mistakes cost lives, not progress.

| Hits reached | Cheer | What happens |
|---|---|---|
| `ceil(goal × 1/3)` | "Olé!" | Section 1 lights, the top stand jumps up |
| `ceil(goal × 2/3)` | "Olé, olé!" | Section 2 lights, the bottom stand jumps up |
| `goal` | "Olé, olé, olé!" | Stage clear: all four stands cheer with scarves waving, confetti |

## Controls

- **Mouse / touch:** tap a hole (`pointerdown`).
- **Keyboard:** Tab into the pitch, use the arrow keys to move between holes and press
  Space or Enter to whack.
- **Speaker button** on the scoreboard: sound on or off (remembered).
- **◐ button:** greyscale, pattern-only mode. Every hat colour has its own band pattern:
  red has horizontal stripes, blue has dots, yellow has a star and purple has a zigzag.
  The hoardings, the crowd and the rule text repeat the pattern.

## Sound

`src/audio.ts` loads recordings from `public/audio/` by name (see
[`public/audio/README.md`](public/audio/README.md)). Any file that's missing falls back to a
synthesised placeholder, so the game runs before real recordings exist. Sound starts only
after the first tap.

## Text

Every player-facing string is in `src/strings.ts`, in plain British English. "Olé" appears
only in the title and the crowd's three cheers. `tests/strings.test.ts` fails if any other
Spanish word, "¡", "¿" or "ñ" gets into that file.

## Layout

```
src/
  main.ts            bootstraps, wires the game to the DOM and sound, runs the frame loop
  config.ts          stage table, colours, animals, tuning, decoy ratios
  strings.ts         every player-facing string
  game.ts            pure game state + rules (no DOM); driven by tick(dt) and whack(hole)
  spawner.ts         matches(), target/decoy selection, seeded RNG
  audio.ts           sound manager with synthesised fallbacks
  storage.ts         best score and settings in localStorage (try/catch)
  render/stadium.ts  stands, crowd card display, hoardings, target wipe, rule label, cheers
  render/board.ts    pitch, holes, critters, keyboard navigation
  render/hud.ts      scoreboard: score, streak, stage, lives, Olé meter, toggles
  render/overlay.ts  matchday ticket, stage intro, full time card
  render/art.ts      inline SVG: mascots, bobble hats, footballs, tiles, hoardings, crowd
  render/fx.ts       text pops, floating points, confetti, shake
public/audio/        real recordings go here
tests/
  game.test.ts       rules, decoys, queue, scoring, Olé thresholds, stages
  strings.test.ts    no Spanish text
```

`game.ts` has no DOM access. It only emits events such as `spawn`, `hit` (with the Olé
section reached, if any), `wrong`, `escape`, `sink`, `clear`, `queue`, `stageClear` and
`gameOver`, and the renderers react to them.
