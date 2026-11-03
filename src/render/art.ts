// Inline SVG art, generated in code. No external images.
import { PALETTE } from '../config';
import type { Animal, Color, HatColor, ItemType, Mode } from '../config';

const INK = PALETTE.ink;
const WHITE = PALETTE.white;

export type Side = 'top' | 'right' | 'bottom' | 'left';

export function starPath(cx: number, cy: number, r: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

/** Foreground colour for patterns drawn on a hat colour. */
function fgFor(color: HatColor): string {
  return color === 'yellow' ? INK : WHITE;
}

// ---------------------------------------------------------------- bobble hats

/**
 * The colour-blind key: a band pattern per colour, drawn inside the box (x, y, w, h).
 * Red = horizontal stripes, blue = dots, yellow = star, purple = zigzag.
 */
function bandPattern(color: HatColor, x: number, y: number, w: number, h: number, fg: string): string {
  switch (color) {
    case 'red': {
      const t = h * 0.2;
      return `<rect x="${x}" y="${y + h * 0.18}" width="${w}" height="${t}" fill="${fg}"/><rect x="${x}" y="${y + h * 0.62}" width="${w}" height="${t}" fill="${fg}"/>`;
    }
    case 'blue': {
      const n = Math.max(2, Math.round(w / (h * 1.3)));
      const r = h * 0.2;
      let out = '';
      for (let i = 0; i < n; i++) out += `<circle cx="${x + (w * (i + 0.5)) / n}" cy="${y + h / 2}" r="${r}" fill="${fg}"/>`;
      return out;
    }
    case 'yellow':
      return `<path d="${starPath(x + w / 2, y + h / 2 + h * 0.03, h * 0.44, h * 0.19)}" fill="${fg}"/>`;
    case 'purple': {
      const n = Math.max(3, Math.round(w / (h * 0.55)));
      const pts: string[] = [];
      for (let i = 0; i <= n; i++) pts.push(`${x + (w * i) / n},${y + (i % 2 ? h * 0.25 : h * 0.75)}`);
      return `<polyline points="${pts.join(' ')}" fill="none" stroke="${fg}" stroke-width="${h * 0.16}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
  }
}

/** A knitted bobble hat. (x, y) is the bottom centre of the cuff. */
export function hatSvg(color: Color, x: number, y: number, scale = 1): string {
  if (color === 'none') return '';
  const fill = PALETTE.hats[color];
  const dark = PALETTE.hatsDark[color];
  return `<g class="hat" transform="translate(${x} ${y}) scale(${scale})">
    <circle cx="0" cy="-33" r="6.5" fill="${WHITE}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M-19,-10 C-20,-33 20,-33 19,-10Z" fill="${fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-9,-11 Q-10,-22 -6,-26.5 M0,-11 L0,-27.5 M9,-11 Q10,-22 6,-26.5" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
    <rect x="-22" y="-12" width="44" height="12" rx="3.5" fill="${dark}"/>
    <svg x="-22" y="-12" width="44" height="12" overflow="hidden">${bandPattern(color, 0, 0, 44, 12, fgFor(color))}</svg>
    <rect x="-22" y="-12" width="44" height="12" rx="3.5" fill="none" stroke="${INK}" stroke-width="2.2"/>
  </g>`;
}

// ---------------------------------------------------------------- mascots

interface AnimalArt {
  /** Drawn behind the head (ears). */
  back: string;
  body: string;
  eyes: [number, number][];
  eyeR: number;
  hat: { x: number; y: number; s: number };
}

function blush(x: number, y: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#ff8a9a" opacity=".5"/>`;
}

function eyeDots(eyes: [number, number][], r: number, white = false): string {
  return eyes
    .map(([x, y]) =>
      (white ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.7}" ry="${r * 1.9}" fill="#fff" stroke="${INK}" stroke-width="2"/>` : '') +
      `<ellipse cx="${x}" cy="${y + (white ? 1 : 0)}" rx="${r}" ry="${r * 1.2}" fill="${INK}"/>` +
      `<circle cx="${x - r * 0.35}" cy="${y - r * 0.4 + (white ? 1 : 0)}" r="${r * 0.38}" fill="#fff"/>`,
    )
    .join('');
}

const ART: Record<Animal, () => AnimalArt> = {
  mole: () => ({
    back: '',
    body: `
      <ellipse cx="50" cy="80" rx="31" ry="42" fill="#7a4a2b" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="100" rx="20" ry="20" fill="#c99a6c"/>
      <ellipse cx="31" cy="93" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="69" cy="93" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>
      ${blush(35, 72)}${blush(65, 72)}
      <g stroke="${INK}" stroke-width="1.4" stroke-linecap="round">
        <line x1="38" y1="74" x2="24" y2="71"/><line x1="38" y1="77" x2="24" y2="79"/>
        <line x1="62" y1="74" x2="76" y2="71"/><line x1="62" y1="77" x2="76" y2="79"/>
      </g>
      <ellipse cx="50" cy="72" rx="7.5" ry="5.6" fill="#f48fa6" stroke="${INK}" stroke-width="2"/>
      <path d="M45,81 Q50,85 55,81" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    eyes: [[41, 61], [59, 61]],
    eyeR: 3.2,
    hat: { x: 50, y: 50, s: 1.0 },
  }),
  rabbit: () => ({
    back: `
      <g transform="rotate(-14 40 52)">
        <ellipse cx="40" cy="24" rx="8.5" ry="25" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="40" cy="26" rx="4" ry="17" fill="#f6b5c3"/>
      </g>
      <g transform="rotate(14 60 52)">
        <ellipse cx="60" cy="24" rx="8.5" ry="25" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="60" cy="26" rx="4" ry="17" fill="#f6b5c3"/>
      </g>`,
    body: `
      <ellipse cx="50" cy="80" rx="29" ry="38" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="100" rx="18" ry="16" fill="#f3f3f6"/>
      ${blush(34, 76)}${blush(66, 76)}
      <rect x="45.6" y="79" width="4.2" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
      <rect x="50.2" y="79" width="4.2" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
      <path d="M44,77 Q47,80 50,77 Q53,80 56,77" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M46.5,72 L53.5,72 L50,76Z" fill="#f48fa6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    eyes: [[40, 65], [60, 65]],
    eyeR: 3.2,
    hat: { x: 50, y: 53, s: 0.78 },
  }),
  frog: () => ({
    back: '',
    body: `
      <circle cx="27" cy="56" r="13" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <circle cx="73" cy="56" r="13" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="82" rx="39" ry="30" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <path d="M16,64 Q27,48 38,64Z M62,64 Q73,48 84,64Z" fill="#5cbf55"/>
      <ellipse cx="50" cy="104" rx="25" ry="15" fill="#c4eba5"/>
      ${blush(25, 82)}${blush(75, 82)}
      <circle cx="44" cy="74" r="1.4" fill="${INK}"/><circle cx="56" cy="74" r="1.4" fill="${INK}"/>
      <path d="M24,82 Q50,102 76,82" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    eyes: [[27, 55], [73, 55]],
    eyeR: 4,
    hat: { x: 50, y: 61, s: 0.6 },
  }),
  fox: () => ({
    back: `
      <path d="M20,64 L25,22 L48,50Z" fill="#e8742a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M26,56 L28,32 L41,49Z" fill="#3a2318"/>
      <path d="M80,64 L75,22 L52,50Z" fill="#e8742a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M74,56 L72,32 L59,49Z" fill="#3a2318"/>`,
    body: `
      <ellipse cx="50" cy="80" rx="32" ry="36" fill="#e8742a" stroke="${INK}" stroke-width="3"/>
      <path d="M19,80 Q30,74 40,82 Q50,90 60,82 Q70,74 81,80 Q76,112 50,114 Q24,112 19,80Z" fill="#fff7ee"/>
      <path d="M19,80 Q30,74 40,82 Q50,90 60,82 Q70,74 81,80" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".35"/>
      ${blush(30, 80)}${blush(70, 80)}
      <ellipse cx="50" cy="86" rx="5.5" ry="4" fill="${INK}"/>
      <path d="M44,93 Q50,97 56,93" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    eyes: [[39, 70], [61, 70]],
    eyeR: 3.4,
    hat: { x: 50, y: 52, s: 0.72 },
  }),
};

function dazedEyes(eyes: [number, number][], r: number): string {
  const s = r * 1.1;
  return eyes
    .map(
      ([x, y]) =>
        `<path d="M${x - s},${y - s} L${x + s},${y + s} M${x + s},${y - s} L${x - s},${y + s}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    )
    .join('');
}

/** The inner content (0…100 coords) of a mascot with its hat. `daze` adds the hidden dizzy eyes. */
export function critterInner(item: ItemType, daze = true): string {
  const a = ART[item.animal]();
  const whites = item.animal === 'frog';
  return `${a.back}${a.body}
    <g class="eyes">${eyeDots(a.eyes, a.eyeR, whites)}</g>
    ${daze ? `<g class="eyes-daze">${dazedEyes(a.eyes, a.eyeR)}</g>` : ''}
    ${hatSvg(item.color, a.hat.x, a.hat.y, a.hat.s)}`;
}

export function critterSvg(item: ItemType): string {
  return `<svg class="critter-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${critterInner(item)}</svg>`;
}

/** Just the target's icon: a hat in hat stages, the mascot in its hat in animal stages. */
function iconInner(item: ItemType, mode: Mode, x: number, y: number, size: number): string {
  if (mode === 'hat' && item.color !== 'none') {
    const s = size / 52;
    return `<g transform="translate(${x + size / 2} ${y + size * 0.86}) scale(${s})">${hatSvg(item.color, 0, 0, 1)}</g>`;
  }
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="4 10 92 92" preserveAspectRatio="xMidYMax slice">${critterInner(item, false)}</svg>`;
}

// ---------------------------------------------------------------- queue tiles

/** An LED tile for the NOW panel and the next targets: colour, band pattern, icon. */
export function tileSvg(item: ItemType, mode: Mode): string {
  if (item.color === 'none') return '';
  const c = item.color;
  return `<svg viewBox="0 0 60 60" aria-hidden="true">
    <rect x="1" y="1" width="58" height="58" rx="7" fill="${PALETTE.hats[c]}" stroke="${INK}" stroke-width="2"/>
    <svg x="3" y="3" width="54" height="10" overflow="hidden">${bandPattern(c, 0, 0, 54, 10, fgFor(c))}</svg>
    <svg x="3" y="47" width="54" height="10" overflow="hidden">${bandPattern(c, 0, 0, 54, 10, fgFor(c))}</svg>
    <rect x="9" y="12" width="42" height="36" rx="6" fill="${WHITE}" stroke="${INK}" stroke-width="1.6"/>
    ${iconInner(item, mode, 12, 12, 36)}
    <rect x="9" y="12" width="42" height="36" rx="6" fill="none" stroke="${INK}" stroke-width="1.6"/>
  </svg>`;
}

// ---------------------------------------------------------------- scoreboard bits

export function footballSvg(): string {
  const pent = (cx: number, cy: number, r: number, rot: number) => {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const a = ((rot + i * 72) * Math.PI) / 180;
      d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    }
    return `<path d="${d}Z" fill="${INK}"/>`;
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" fill="${WHITE}" stroke="${INK}" stroke-width="1.6"/>
    ${pent(12, 12, 4, -90)}
    <path d="M12,8 L12,3.5 M15.8,10.8 L20,9.3 M14.4,15.2 L17,19 M9.6,15.2 L7,19 M8.2,10.8 L4,9.3" stroke="${INK}" stroke-width="1.2"/>
    <clipPath id="fb"><circle cx="12" cy="12" r="10"/></clipPath>
    <g clip-path="url(#fb)">${pent(12, 0.6, 3.2, 90)}${pent(22.8, 8.6, 3.2, 162)}${pent(18.8, 21.4, 3.2, 234)}${pent(5.2, 21.4, 3.2, 306)}${pent(1.2, 8.6, 3.2, 18)}</g>
  </svg>`;
}

export function speakerSvg(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4,9 H8 L13,5 V19 L8,15 H4Z" fill="currentColor"/>
    <path class="waves" d="M16,9 Q18,12 16,15 M18.5,6.5 Q22.5,12 18.5,17.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path class="cross" d="M16,9 L22,15 M22,9 L16,15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

export function dizzyStarsSvg(): string {
  return `<svg viewBox="0 0 60 20" aria-hidden="true">
    <path d="${starPath(10, 10, 6, 2.6)}" fill="#ffd84a" stroke="${INK}" stroke-width="1"/>
    <path d="${starPath(30, 6, 5, 2.2)}" fill="#fff3a0" stroke="${INK}" stroke-width="1"/>
    <path d="${starPath(50, 11, 6, 2.6)}" fill="#ffd84a" stroke="${INK}" stroke-width="1"/>
  </svg>`;
}

// ---------------------------------------------------------------- hoardings

function uri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** A faint grid of LED pixels laid over a hoarding panel. */
function ledDots(w: number, h: number): string {
  return `<pattern id="led" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#000" opacity=".18"/><circle cx="1.5" cy="1.5" r="1.05" fill="#fff" opacity=".1"/></pattern>
    <rect width="${w}" height="${h}" fill="url(#led)"/>`;
}

/**
 * One repeat of an LED pitch-side hoarding, as a CSS background. It shows the target's colour and
 * band pattern, plus the mascot in animal stages. Plain stages show "WHACK ANY MOLE" in white.
 */
export function hoardingUri(item: ItemType, mode: Mode, vertical: boolean, text: string, icon = true): string {
  const plain = mode === 'plain' || item.color === 'none';
  const L = plain ? 280 : 180;
  const T = 40;
  const w = vertical ? T : L;
  const h = vertical ? L : T;
  let inner: string;
  if (plain) {
    // A separator dot at each end keeps the repeats apart.
    const label = `<text x="${L / 2}" y="${T / 2}" dy=".36em" text-anchor="middle" textLength="${L - 56}" lengthAdjust="spacingAndGlyphs" font-family="Anton, Impact, 'Arial Narrow', sans-serif" font-weight="700" font-size="20" fill="${WHITE}">${text}</text>
      <circle cx="10" cy="${T / 2}" r="3" fill="${WHITE}" opacity=".6"/><circle cx="${L - 10}" cy="${T / 2}" r="3" fill="${WHITE}" opacity=".6"/>`;
    inner = `<rect width="${w}" height="${h}" fill="#141a26"/>
      ${vertical ? `<g transform="translate(${T} 0) rotate(90)">${label}</g>` : label}`;
  } else {
    const c = item.color as HatColor;
    const fg = fgFor(c);
    // The band pattern runs the full length of the board, like the band on the hat.
    const band = vertical
      ? `<g transform="translate(${T} 0) rotate(90)">${bandPattern(c, 0, 6, L, T - 12, fg)}</g>`
      : bandPattern(c, 0, 6, L, T - 12, fg);
    const badge =
      mode === 'animal' && icon
        ? `<rect x="${w / 2 - 17}" y="${h / 2 - 17}" width="34" height="34" rx="7" fill="${WHITE}" stroke="${INK}" stroke-width="1.6"/>
           ${iconInner(item, mode, w / 2 - 15, h / 2 - 15, 30)}`
        : '';
    inner = `<rect width="${w}" height="${h}" fill="${PALETTE.hats[c]}"/>
      <g opacity=".75">${band}</g>${badge}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${inner}${ledDots(w, h)}</svg>`;
  return uri(svg);
}

// ---------------------------------------------------------------- crowd card display

/** Tiny version of the band pattern for one crowd card (10 × 9 box at x, y). */
function cardMark(color: HatColor, x: number, y: number, fg: string): string {
  switch (color) {
    case 'red':
      return `<rect x="${x + 1}" y="${y + 2.2}" width="8" height="1.5" fill="${fg}"/><rect x="${x + 1}" y="${y + 5.6}" width="8" height="1.5" fill="${fg}"/>`;
    case 'blue':
      return `<circle cx="${x + 3}" cy="${y + 3}" r="1.2" fill="${fg}"/><circle cx="${x + 7}" cy="${y + 3}" r="1.2" fill="${fg}"/><circle cx="${x + 3}" cy="${y + 6.4}" r="1.2" fill="${fg}"/><circle cx="${x + 7}" cy="${y + 6.4}" r="1.2" fill="${fg}"/>`;
    case 'yellow':
      return `<path d="${starPath(x + 5, y + 4.8, 3.4, 1.4)}" fill="${fg}"/>`;
    case 'purple':
      return `<polyline points="${x + 1},${y + 6} ${x + 3},${y + 3} ${x + 5},${y + 6} ${x + 7},${y + 3} ${x + 9},${y + 6}" fill="none" stroke="${fg}" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
}

/**
 * One repeat of the crowd's card display: fans holding up scarves in the target colour with its
 * band pattern. `null` gives a mix of all four colours (plain stages).
 */
export function crowdUri(color: HatColor | null): string {
  const cells = 8;
  const cell = 12;
  const size = cells * cell;
  let seed = color ? color.length * 31 + 7 : 3;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const all: HatColor[] = ['red', 'blue', 'yellow', 'purple'];
  let out = `<rect width="${size}" height="${size}" fill="${PALETTE.stand}"/>`;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const x = c * cell + 1 + (rnd() - 0.5) * 0.8;
      const y = r * cell + 1.5 + (rnd() - 0.5) * 0.8;
      // A few empty seats and fans without a scarf keep it looking like people.
      const roll = rnd();
      if (roll < 0.08) {
        out += `<circle cx="${x + 5}" cy="${y + 5}" r="3.4" fill="#2a2f3f"/>`;
        continue;
      }
      const col = color ?? all[Math.floor(rnd() * 4)];
      const shade = 0.78 + rnd() * 0.22;
      out += `<rect x="${x}" y="${y}" width="10" height="9" rx="1.6" fill="${PALETTE.hats[col]}" opacity="${shade.toFixed(2)}"/>`;
      out += `<g opacity="${(shade * 0.85).toFixed(2)}">${cardMark(col, x, y, fgFor(col))}</g>`;
    }
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${out}</svg>`);
}
