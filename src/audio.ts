// Sound manager. Loads recordings from public/audio/ by name; any file that is missing or
// won't decode falls back to a simple synthesised placeholder (Web Audio API), so the game
// runs before real recordings exist. Nothing plays until the player's first tap.
//
// The Olé chant and the background crowd have no placeholder: they stay silent until
// recordings are added.

export type SoundName =
  | 'hit-1'
  | 'hit-2'
  | 'hit-3'
  | 'hit-4'
  | 'ole-1'
  | 'ole-2'
  | 'ole-3'
  | 'ole-4'
  | 'roar'
  | 'groan'
  | 'jeer'
  | 'whistle'
  | 'fulltime'
  | 'crowd-loop';

const NAMES: SoundName[] = [
  'hit-1', 'hit-2', 'hit-3', 'hit-4', 'ole-1', 'ole-2', 'ole-3', 'ole-4',
  'roar', 'groan', 'whistle', 'jeer', 'fulltime', 'crowd-loop',
];

const LOOP_GAIN = 0.12;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<SoundName, AudioBuffer | null>();
  private noise: AudioBuffer | null = null;
  private lastHit: { stop: () => void } | null = null;
  private loopStarted = false;
  private muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  /** Call from the player's first tap or key press (browser autoplay rules). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.noise = makeNoise(this.ctx);
    void this.loadAll().then(() => this.startLoop());
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Correct hit: one of four bonks at random, slightly pitch-shifted. Stops the previous one. */
  hit(): void {
    const v = 1 + Math.floor(Math.random() * 4);
    const rate = 0.93 + Math.random() * 0.14;
    this.lastHit?.stop();
    this.lastHit = this.play(`hit-${v}` as SoundName, rate);
  }

  play(name: SoundName, rate = 1): { stop: () => void } | null {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out || this.muted) return null;
    const buf = this.buffers.get(name);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      src.connect(out);
      src.start();
      return { stop: () => safeStop(src) };
    }
    // No placeholder for the chant or the crowd loop: these wait for real recordings.
    if (name.startsWith('ole-') || name === 'crowd-loop') return null;
    return synth(ctx, out, this.noise!, name, rate);
  }

  private async loadAll(): Promise<void> {
    const base = `${import.meta.env.BASE_URL ?? './'}audio/`;
    await Promise.all(
      NAMES.map(async (name) => {
        try {
          const res = await fetch(`${base}${name}.mp3`);
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.arrayBuffer();
          this.buffers.set(name, await this.ctx!.decodeAudioData(data));
        } catch {
          // Missing or not audio (a dev server may answer with index.html): use the synth.
          this.buffers.set(name, null);
        }
      }),
    );
  }

  private startLoop(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.loopStarted) return;
    this.loopStarted = true;
    const gain = ctx.createGain();
    gain.gain.value = LOOP_GAIN;
    gain.connect(this.master);
    // Only a real recording: a synthesised murmur just sounds like wind.
    const buf = this.buffers.get('crowd-loop');
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.loop = true;
    src.buffer = buf;
    src.connect(gain);
    src.start();
  }
}

// ---------------------------------------------------------------- synth placeholders

function safeStop(node: AudioScheduledSourceNode): void {
  try {
    node.stop();
  } catch {
    /* already stopped */
  }
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

type Stopper = { stop: () => void };

function synth(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, name: SoundName, rate: number): Stopper {
  const nodes: AudioScheduledSourceNode[] = [];
  const t0 = ctx.currentTime + 0.005;
  const track = <T extends AudioScheduledSourceNode>(n: T): T => {
    nodes.push(n);
    return n;
  };

  const env = (at: number, attack: number, hold: number, release: number, peak: number): GainNode => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.setValueAtTime(peak, at + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
    return g;
  };

  const noiseBurst = (at: number, dur: number, filterType: BiquadFilterType, freq: number, q: number, peak: number) => {
    const src = track(ctx.createBufferSource());
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = env(at, 0.003, 0, dur, peak);
    src.connect(f).connect(g).connect(out);
    src.start(at, Math.random() * 0.5, dur + 0.05);
  };

  /** A crowd of voices shouting one vowel, `n` voices around f0, through a vowel formant. */
  const shout = (at: number, dur: number, n: number, f0: number, formant: number, peak: number, glide = 1) => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = formant;
    f.Q.value = 1.1;
    const g = env(at, 0.05, dur * 0.5, dur * 0.5, peak);
    f.connect(g).connect(out);
    for (let i = 0; i < n; i++) {
      const o = track(ctx.createOscillator());
      o.type = 'sawtooth';
      const fr = f0 * (0.85 + Math.random() * 0.3);
      o.frequency.setValueAtTime(fr, at);
      o.frequency.linearRampToValueAtTime(fr * glide, at + dur);
      const vg = ctx.createGain();
      vg.gain.value = 1 / n;
      o.connect(vg).connect(f);
      o.start(at + Math.random() * 0.04);
      o.stop(at + dur + 0.1);
    }
    noiseBurst(at, dur, 'bandpass', formant, 0.8, peak * 0.4);
  };

  /** A referee's pea whistle: a high tone with a fast trill. */
  const peaWhistle = (at: number, dur: number) => {
    const o = track(ctx.createOscillator());
    o.type = 'sine';
    o.frequency.value = 2900;
    const lfo = track(ctx.createOscillator());
    lfo.frequency.value = 28;
    const depth = ctx.createGain();
    depth.gain.value = 160;
    lfo.connect(depth).connect(o.frequency);
    const g = env(at, 0.01, dur, 0.06, 0.22);
    o.connect(g).connect(out);
    o.start(at);
    lfo.start(at);
    o.stop(at + dur + 0.12);
    lfo.stop(at + dur + 0.12);
  };

  switch (name) {
    case 'hit-1':
    case 'hit-2':
    case 'hit-3':
    case 'hit-4': {
      const base = { 'hit-1': 420, 'hit-2': 500, 'hit-3': 360, 'hit-4': 560 }[name] * rate;
      const o = track(ctx.createOscillator());
      o.type = 'triangle';
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * 0.42, t0 + 0.11);
      const g = env(t0, 0.004, 0.01, 0.12, 0.55);
      o.connect(g).connect(out);
      o.start(t0);
      o.stop(t0 + 0.2);
      noiseBurst(t0, 0.03, 'lowpass', 1800, 0.7, 0.25);
      break;
    }
    case 'roar': {
      // A big crowd roar: a swell of broadband noise with shouting voices underneath.
      const src = track(ctx.createBufferSource());
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 900;
      f.Q.value = 0.5;
      const g = env(t0, 0.35, 0.9, 1.1, 0.5);
      src.connect(f).connect(g).connect(out);
      src.start(t0);
      src.stop(t0 + 2.6);
      shout(t0 + 0.1, 1.6, 16, 230, 1100, 0.25, 1.05);
      break;
    }
    case 'groan':
      // The crowd's "ooooh".
      shout(t0, 1.0, 12, 200, 480, 0.4, 0.7);
      break;
    case 'jeer':
      // A crowd "booo".
      shout(t0, 1.1, 14, 135, 340, 0.4, 0.92);
      break;
    case 'whistle':
      peaWhistle(t0, 0.32);
      break;
    case 'fulltime':
      // The long final whistle (short, short, long), then a deflated sigh.
      peaWhistle(t0, 0.18);
      peaWhistle(t0 + 0.3, 0.18);
      peaWhistle(t0 + 0.6, 1.0);
      shout(t0 + 1.75, 1.0, 10, 170, 420, 0.3, 0.72);
      break;
    case 'crowd-loop':
      break;
  }
  return { stop: () => nodes.forEach(safeStop) };
}
