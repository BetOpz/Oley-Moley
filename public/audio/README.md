# Audio files

Drop real recordings here. `src/audio.ts` loads them by name; any that are missing fall back to
a synthesised placeholder, so the game runs without them.

| File | Plays when |
|---|---|
| `hit-1.mp3` … `hit-4.mp3` | A correct hit (picked at random, slightly pitch-shifted) |
| `ole-1.mp3` | Olé meter at 1/4: one stand shouts "Olé!" |
| `ole-2.mp3` | Olé meter at 2/4: two stands, "Olé, olé!" |
| `ole-3.mp3` | Olé meter at 3/4: three stands, "Olé, olé, olé!" |
| `ole-4.mp3` | Stage clear: the whole ground, "Olé, olé, olé, olé!" with claps |
| `roar.mp3` | Division complete (promotion) |
| `groan.mp3` | A wrong hit (crowd "ooooh"); a short cut of it plays when a mole gets away |
| `whistle.mp3` | Hitting the referee (followed by the jeer) |
| `jeer.mp3` | Crowd jeer after hitting the referee |
| `fulltime.mp3` | Game over: long final whistle, then a deflated sigh |
| `crowd-loop.mp3` | Low crowd murmur, looped quietly under everything |

The chants must be shouted in rhythm with claps, or sung to an original tune. Don't use the
melody of the well-known "Olé, Olé, Olé" pop song. British football crowd sounds only: no
Spanish guitar, flamenco claps, trumpets or paso doble.
