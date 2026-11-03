# Audio

Drop real recordings here. `src/audio.ts` loads them by name, and any file that's missing falls
back to a synthesised placeholder.

| File | Plays when |
|---|---|
| `hit-1.mp3` … `hit-4.mp3` | Correct hit (one at random, slightly pitch-shifted) |
| `ole-1.mp3` | Olé meter at 1/3: a section of the crowd shouts "Olé!" |
| `ole-2.mp3` | Olé meter at 2/3: a bigger crowd, "Olé, olé!" |
| `ole-3.mp3` | Stage clear: the whole crowd, "Olé, olé, olé!" with claps |
| `groan.mp3` | Wrong hit: crowd "ooooh" |
| `whistle.mp3` | Escape: referee's whistle |
| `fulltime.mp3` | Game over: deflated sigh or slow handclap |
| `crowd-loop.mp3` | Background murmur, looped quietly |

British football crowd sounds only. The chant must be a rhythmic shout with claps or an
original tune, not the melody of the well-known "Olé, Olé, Olé" pop song.
