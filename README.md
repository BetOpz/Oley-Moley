# Olé Molé!

A whack-a-mole prototype set at a Spanish fiesta. The grid grows from 2 × 2 to 5 × 5
and the rules stack up: plain moles, then moles in coloured hats, then several animals
in coloured hats. A row of azulejo tiles shows the current target (**AHORA**) and the
next few, and the crowd cheers "¡Olé!" as your streak builds.

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
  a zigzag. The queue tiles and the rule text repeat the pattern.

## Layout

```
src/
  main.ts          bootstraps, wires the game to the DOM, runs the frame loop
  config.ts        stage table, colours, animals, tuning, decoy ratios, streak thresholds
  strings.ts       every player-facing string (Spanish callouts + English explanations)
  game.ts          pure game state + rules (no DOM); driven by tick(dt) and whack(hole)
  spawner.ts       matches(), target/decoy selection, seeded RNG
  storage.ts       best score / best streak / settings in localStorage (try/catch)
  render/board.ts  stands, arena, holes, critters, keyboard navigation
  render/hud.ts    chips, carnation lives, rule text, tile queue, Olé fan, progress
  render/overlay.ts start poster, stage intro, game over cards
  render/art.ts    inline SVG: animals, cordobés hats, tiles, fan, roses, castanets, crowd
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
