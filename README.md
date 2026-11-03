# Olé Molé!

A whack-a-mole prototype set at a Spanish fiesta. The grid grows from 2 × 2 to 5 × 5
and the rules stack up: plain moles, then moles in coloured hats, then several animals
in coloured hats. The screen is a stadium: the pitch sits in the middle with the crowd in stands on all
four sides.

## Where the target shows

Players shouldn't have to look away from the holes to check what to hit, so the target
sits all round the pitch:

- **Advertising boards** along all four edges show the current target's colour, band
  pattern and animal (or hat), so an edge in the target colour is always close by.
- **Colour wipe:** when the target changes, the new colour wipes clockwise round the
  boards. The next three targets sit smaller on a plate in the top board (**LUEGO**).
- **Crowd:** fans in every stand hold scarves and flags in the target colour.
- **Rule text** such as "Hit the rabbit in red" flashes in the centre circle for about
  1.5 seconds when the target changes, then fades out. It never blocks taps.

Score, stage, lives, stage progress and the Olé meter (the fan) are on a scoreboard in the
top stand. When the Olé meter passes each third, one stand jumps up and cheers: first the
left, then the right, then the bottom. All four cheer when you clear the stage. On a phone
the side stands shrink to thin strips, and the whole stadium always fits the screen
without scrolling.

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

## Controls

- **Mouse / touch:** tap a hole (`pointerdown`).
- **Keyboard:** Tab into the arena, use the arrow keys to move between holes and press
  Space or Enter to whack.
- **◐** in the header switches to a greyscale, pattern-only mode. Every hat colour has
  its own band pattern: red has stripes, blue has dots, yellow has a star and purple has
  a zigzag. The boards, the next-target tiles and the rule text repeat the pattern.

## Layout

```
src/
  main.ts          bootstraps, wires the game to the DOM, runs the frame loop
  config.ts        stage table, colours, animals, tuning, decoy ratios, streak thresholds
  strings.ts       every player-facing string (Spanish callouts + English explanations)
  game.ts          pure game state + rules (no DOM); driven by tick(dt) and whack(hole)
  spawner.ts       matches(), target/decoy selection, seeded RNG
  storage.ts       best score / best streak / settings in localStorage (try/catch)
  render/board.ts  stadium grid: four stands, ad boards, pitch, holes, keyboard navigation
  render/hud.ts    scoreboard, ad boards + colour wipe, next targets, crowd colour, rule flash, stand cheers
  render/overlay.ts start poster, stage intro, game over cards
  render/art.ts    inline SVG: animals, cordobés hats, tiles, board panels, fan, roses, castanets, crowd
  render/fx.ts     callouts, floating points, confetti, roses, sparkles, shake
tests/
  game.test.ts     Vitest
```

`game.ts` has no DOM access. It only emits events such as `spawn`, `hit`, `wrong`,
`escape`, `sink`, `clear`, `queue`, `stageClear` and `gameOver`, and the renderers react
to them. This keeps the rules unit-testable and makes it easy to move them to another
engine later.

## Notes

- To keep a target on screen most of the time, the game forces one in whenever none has
  been up for `TUNING.forceTargetAfterMs` (1 s). This can push the board one critter
  over `maxUp`. The tests simulate each hat and animal stage and check that the board
  never goes more than 2 s without a target.
- With `prefers-reduced-motion`, the shake, confetti, rose rain, crowd hops and bunting
  sway are switched off. Callouts still appear but fade instead of popping.
- There is no sound yet (see "Nice to have later" in the brief).
