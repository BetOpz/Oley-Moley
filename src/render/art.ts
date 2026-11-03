// Inline SVG art, generated in code. No external images.
import { PALETTE } from '../config';
import type { Animal, Color, HatColor, ItemType, Mode } from '../config';

const INK = PALETTE.ink;
const CREAM = PALETTE.warmWhite;

// ---------------------------------------------------------------- hats

/** Band decoration per colour: the colour-blind key. Drawn in hat-local coords (band spans y −12…−3). */
function bandDecoration(color: HatColor, fg: string): string {
  switch (color) {
    case 'red': // stripes
      return [-11, -6.5, -2, 2.5, 7, 11.5]
        .map((x) => `<rect x="${x - 1.2}" y="-11.5" width="2.4" height="8" fill="${fg}"/>`)
        .join('');
    case 'blue': // dots
      return [-10, -5, 0, 5, 10]
        .map((x) => `<circle cx="${x}" cy="-7.5" r="1.9" fill="${fg}"/>`)
        .join('');
    case 'yellow': // star
      return `<path d="${starPath(0, -7.5, 4.8, 2.1)}" fill="${fg}" stroke="${fg}" stroke-width="0.6" stroke-linejoin="round"/>`;
    case 'purple': // zigzag
      return `<polyline points="-13.5,-5 -10,-10.5 -6.5,-5 -3,-10.5 0.5,-5 4,-10.5 7.5,-5 11,-10.5 13.8,-6" fill="none" stroke="${fg}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
}

export function starPath(cx: number, cy: number, r: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

/** A flat-brimmed sombrero cordobés, brim centre at (x, y). */
export function hatSvg(color: Color, x: number, y: number, scale = 1): string {
  if (color === 'none') return '';
  const fill = PALETTE.hats[color];
  const dark = PALETTE.hatsDark[color];
  const fg = color === 'yellow' ? INK : CREAM;
  return `<g class="hat" transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="0" rx="27" ry="5.6" fill="${fill}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M-20,-1.6 Q0,-5 20,-1.6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
    <path d="M-14,-2 L-12.6,-21 Q0,-23.4 12.6,-21 L14,-2 Q0,1 -14,-2Z" fill="${fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-13.9,-12.2 Q0,-14.4 13.9,-12.2 L14,-2.6 Q0,0.2 -14,-2.6Z" fill="${dark}"/>
    ${bandDecoration(color, fg)}
    <path d="M-14,-2 L-12.6,-21 Q0,-23.4 12.6,-21 L14,-2 Q0,1 -14,-2Z" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="0" cy="-21" rx="12.6" ry="2.6" fill="${fill}" stroke="${INK}" stroke-width="1.8"/>
  </g>`;
}

// ---------------------------------------------------------------- animals

interface AnimalArt {
  body: string;
  eyes: [number, number][];
  eyeR: number;
  hat: { x: number; y: number; s: number };
}

function blush(x: number, y: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#ff8a9a" opacity=".55"/>`;
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
    body: `
      <ellipse cx="50" cy="80" rx="31" ry="42" fill="#7a4a2b" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="100" rx="20" ry="20" fill="#c99a6c"/>
      <ellipse cx="31" cy="93" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="69" cy="93" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>
      ${blush(35, 70)}${blush(65, 70)}
      <g stroke="${INK}" stroke-width="1.4" stroke-linecap="round">
        <line x1="38" y1="72" x2="24" y2="69"/><line x1="38" y1="75" x2="24" y2="77"/>
        <line x1="62" y1="72" x2="76" y2="69"/><line x1="62" y1="75" x2="76" y2="77"/>
      </g>
      <ellipse cx="50" cy="70" rx="7.5" ry="5.6" fill="#f48fa6" stroke="${INK}" stroke-width="2"/>
      <path d="M45,79 Q50,83 55,79" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    eyes: [[41, 59], [59, 59]],
    eyeR: 3.2,
    hat: { x: 50, y: 42, s: 1.12 },
  }),
  rabbit: () => ({
    body: `
      <g transform="rotate(-16 40 52)">
        <ellipse cx="40" cy="24" rx="8.5" ry="25" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="40" cy="26" rx="4" ry="17" fill="#f6b5c3"/>
      </g>
      <g transform="rotate(16 60 52)">
        <ellipse cx="60" cy="24" rx="8.5" ry="25" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="60" cy="26" rx="4" ry="17" fill="#f6b5c3"/>
      </g>
      <ellipse cx="50" cy="80" rx="29" ry="38" fill="#d9d9df" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="100" rx="18" ry="16" fill="#f3f3f6"/>
      ${blush(34, 74)}${blush(66, 74)}
      <rect x="45.6" y="77" width="4.2" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
      <rect x="50.2" y="77" width="4.2" height="7" rx="1" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
      <path d="M44,75 Q47,78 50,75 Q53,78 56,75" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M46.5,70 L53.5,70 L50,74Z" fill="#f48fa6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    eyes: [[40, 63], [60, 63]],
    eyeR: 3.2,
    hat: { x: 50, y: 46, s: 0.98 },
  }),
  frog: () => ({
    body: `
      <circle cx="28" cy="54" r="13" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <circle cx="72" cy="54" r="13" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="82" rx="39" ry="30" fill="#5cbf55" stroke="${INK}" stroke-width="3"/>
      <path d="M17,62 Q28,46 39,62Z M61,62 Q72,46 83,62Z" fill="#5cbf55"/>
      <ellipse cx="50" cy="104" rx="25" ry="15" fill="#c4eba5"/>
      ${blush(25, 80)}${blush(75, 80)}
      <circle cx="44" cy="72" r="1.4" fill="${INK}"/><circle cx="56" cy="72" r="1.4" fill="${INK}"/>
      <path d="M24,80 Q50,100 76,80" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    eyes: [[28, 53], [72, 53]],
    eyeR: 4,
    hat: { x: 50, y: 56, s: 0.78 },
  }),
  bull: () => ({
    body: `
      <g transform="rotate(-22 20 64)"><ellipse cx="20" cy="64" rx="12" ry="6" fill="#5b3520" stroke="${INK}" stroke-width="2.6"/><ellipse cx="18" cy="64" rx="6" ry="2.6" fill="#e89aa8"/></g>
      <g transform="rotate(22 80 64)"><ellipse cx="80" cy="64" rx="12" ry="6" fill="#5b3520" stroke="${INK}" stroke-width="2.6"/><ellipse cx="82" cy="64" rx="6" ry="2.6" fill="#e89aa8"/></g>
      <path d="M26,50 Q25,38 31,33 Q35,41 36,50Z" fill="#f4e6c4" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M74,50 Q75,38 69,33 Q65,41 64,50Z" fill="#f4e6c4" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="50" cy="76" rx="31" ry="34" fill="#5b3520" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="50" cy="91" rx="20" ry="13" fill="#f1dcbc" stroke="${INK}" stroke-width="2.4"/>
      <ellipse cx="43.5" cy="89" rx="2.4" ry="3" fill="#8a5a3c"/>
      <ellipse cx="56.5" cy="89" rx="2.4" ry="3" fill="#8a5a3c"/>
      <path d="M45,96 Q50,99 55,96" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      ${blush(30, 80)}${blush(70, 80)}`,
    eyes: [[39, 67], [61, 67]],
    eyeR: 4.3,
    hat: { x: 50, y: 46, s: 0.84 },
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

/** The inner content (0…100 coords) of an animal with its hat. */
export function critterInner(item: ItemType): string {
  const a = ART[item.animal]();
  const whites = item.animal === 'bull' || item.animal === 'frog';
  return `${a.body}
    <g class="eyes">${eyeDots(a.eyes, a.eyeR, whites)}</g>
    <g class="eyes-daze">${dazedEyes(a.eyes, a.eyeR)}</g>
    ${hatSvg(item.color, a.hat.x, a.hat.y, a.hat.s)}`;
}

export function critterSvg(item: ItemType): string {
  return `<svg class="critter-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${critterInner(item)}</svg>`;
}

// ---------------------------------------------------------------- tiles

function cornerMotif(color: HatColor, x: number, y: number, fg: string): string {
  switch (color) {
    case 'red':
      return `<g fill="${fg}"><rect x="${x - 3.5}" y="${y - 3.5}" width="1.8" height="7"/><rect x="${x - 0.9}" y="${y - 3.5}" width="1.8" height="7"/><rect x="${x + 1.7}" y="${y - 3.5}" width="1.8" height="7"/></g>`;
    case 'blue':
      return `<g fill="${fg}"><circle cx="${x - 2.4}" cy="${y - 2.4}" r="1.5"/><circle cx="${x + 2.4}" cy="${y - 2.4}" r="1.5"/><circle cx="${x - 2.4}" cy="${y + 2.4}" r="1.5"/><circle cx="${x + 2.4}" cy="${y + 2.4}" r="1.5"/></g>`;
    case 'yellow':
      return `<path d="${starPath(x, y, 4.4, 1.9)}" fill="${fg}"/>`;
    case 'purple':
      return `<polyline points="${x - 4},${y + 2} ${x - 2},${y - 2} ${x},${y + 2} ${x + 2},${y - 2} ${x + 4},${y + 2}" fill="none" stroke="${fg}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
}

/** A painted azulejo tile for the queue. */
export function tileSvg(item: ItemType, mode: Mode): string {
  if (item.color === 'none') return '';
  const c = item.color;
  const fill = PALETTE.hats[c];
  const fg = c === 'yellow' ? INK : CREAM;
  const corners = [
    [7, 7], [53, 7], [7, 54], [53, 54],
  ]
    .map(([x, y]) => cornerMotif(c, x, y, fg))
    .join('');
  const inner =
    mode === 'animal'
      ? `<svg x="12" y="10" width="36" height="41" viewBox="6 8 88 92" preserveAspectRatio="xMidYMax slice">${critterInner(item)}</svg>`
      : `<g>${hatSvg(c, 30, 40, 1)}</g>`;
  return `<svg viewBox="0 0 60 60" aria-hidden="true">
    <rect x="1" y="1" width="58" height="58" rx="5" fill="${fill}" stroke="${INK}" stroke-width="2"/>
    <rect x="4.5" y="4.5" width="51" height="51" rx="3" fill="none" stroke="${fg}" stroke-opacity=".7" stroke-width="1"/>
    ${corners}
    <rect x="12" y="10" width="36" height="41" rx="7" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/>
    ${inner}
    <rect x="12" y="10" width="36" height="41" rx="7" fill="none" stroke="${INK}" stroke-width="1.6"/>
  </svg>`;
}

// ---------------------------------------------------------------- HUD bits

export function carnationSvg(): string {
  const petals = [0, 60, 120, 180, 240, 300]
    .map((a) => `<ellipse cx="12" cy="6.5" rx="3.6" ry="4.6" transform="rotate(${a} 12 10)" fill="#e0263a" stroke="${INK}" stroke-width="1"/>`)
    .join('');
  return `<svg viewBox="0 0 24 30" aria-hidden="true">
    <path d="M12,15 Q11,22 12,29" stroke="#3f8a3a" stroke-width="2" fill="none"/>
    <path d="M12,23 Q6,20 5,24 Q9,25 12,23Z" fill="#4fa34a"/>
    ${petals}
    <circle cx="12" cy="10" r="4" fill="#ff5a6a" stroke="${INK}" stroke-width="1"/>
    <path d="M10,10 Q12,8 14,10" stroke="${INK}" stroke-width=".8" fill="none"/>
  </svg>`;
}

export function roseSvg(): string {
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20,22 Q22,30 34,37" stroke="#2f7a32" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M26,30 Q33,25 35,30 Q30,33 26,30Z" fill="#43a047" stroke="${INK}" stroke-width="1"/>
    <circle cx="17" cy="17" r="10" fill="#c8102e" stroke="${INK}" stroke-width="1.8"/>
    <path d="M17,11 Q24,13 21,19 Q17,23 13,19 Q11,14 16,14 Q19,15 18,18" fill="none" stroke="#7a0a1c" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

/** The Olé meter fan. Segments are rotated open by updateFan() in hud.ts. */
export function fanSvg(segments: number): string {
  const cx = 50;
  const cy = 54;
  const r = 46;
  const start = 190;
  const span = 160 / segments;
  const pt = (deg: number, rad = r) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  };
  let segs = '';
  for (let i = 0; i < segments; i++) {
    const col = i % 2 === 0 ? PALETTE.deepRed : '#d8262c';
    segs += `<g class="fan-seg" data-i="${i}">
      <path d="M${cx},${cy} L${pt(start)} A${r},${r} 0 0 1 ${pt(start + span)} Z" fill="${col}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M${pt(start, r - 7)} A${r - 7},${r - 7} 0 0 1 ${pt(start + span, r - 7)}" fill="none" stroke="${PALETTE.gold}" stroke-width="2"/>
      <circle cx="${pt(start + span / 2, r - 14).split(',')[0]}" cy="${pt(start + span / 2, r - 14).split(',')[1]}" r="1.8" fill="${CREAM}"/>
      <line x1="${cx}" y1="${cy}" x2="${pt(start, r - 2).split(',')[0]}" y2="${pt(start, r - 2).split(',')[1]}" stroke="#6b3b1d" stroke-width="1.6"/>
    </g>`;
  }
  return `<svg class="fan-svg" viewBox="0 0 100 60" aria-hidden="true">
    ${segs}
    <circle cx="${cx}" cy="${cy}" r="4" fill="${PALETTE.gold}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`;
}

/** Castanet whack effect: two shells that snap shut. */
export function castanetSvg(): string {
  const shell = (cls: string, cy: number) =>
    `<g class="${cls}"><ellipse cx="32" cy="${cy}" rx="22" ry="12" fill="#8a4b22" stroke="${INK}" stroke-width="2.6"/><ellipse cx="27" cy="${cy - 3}" rx="10" ry="3.5" fill="#c27a45" opacity=".8"/></g>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    ${shell('cast-top', 24)}
    ${shell('cast-bot', 40)}
    <path d="M10,32 Q4,24 9,16" stroke="${PALETTE.deepRed}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="10" cy="32" r="3" fill="${PALETTE.deepRed}" stroke="${INK}" stroke-width="1.5"/>
  </svg>`;
}

export function dizzyStarsSvg(): string {
  return `<svg viewBox="0 0 60 20" aria-hidden="true">
    <path d="${starPath(10, 10, 6, 2.6)}" fill="${PALETTE.gold}" stroke="${INK}" stroke-width="1"/>
    <path d="${starPath(30, 6, 5, 2.2)}" fill="#fff3a0" stroke="${INK}" stroke-width="1"/>
    <path d="${starPath(50, 11, 6, 2.6)}" fill="${PALETTE.gold}" stroke="${INK}" stroke-width="1"/>
  </svg>`;
}

export function sparkleSvg(): string {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath(10, 10, 9, 2.2, 4)}" fill="#ffe27a" stroke="${PALETTE.gold}" stroke-width="1"/></svg>`;
}

// ---------------------------------------------------------------- stadium

export type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * One stand of the stadium: tiers of seats parallel to the pitch edge, with an upright
 * crowd. About a fifth of the fans hold a scarf or a flag filled with `var(--tgt)`, so
 * the whole crowd switches to the current target colour from CSS. Deterministic.
 */
export function crowdSvg(side: Side): string {
  const horizontal = side === 'top' || side === 'bottom';
  const W = horizontal ? 1000 : 340;
  const H = horizontal ? 240 : 700;
  const tierGap = 34;
  const along = 27;
  const tiers = Math.floor((horizontal ? H : W) / tierGap);
  let seed = side.length * 97 + (side === 'left' ? 5 : 0);
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const tones = ['#8b3a2b', '#6d2f3b', '#a1543a', '#5a3a4a', '#7a4630', '#94402f', '#4d3b5c', '#9a6a3a'];
  const seatA = '#e6c79a';
  const seatB = '#d8b483';
  const rows: string[] = [];
  // Tier 0 is the front row, next to the pitch.
  for (let t = 0; t < tiers; t++) {
    const depth = t * tierGap;
    const people: string[] = [];
    const count = Math.ceil((horizontal ? W : H) / along) + 1;
    for (let i = 0; i < count; i++) {
      const a = i * along + (t % 2 ? along / 2 : 0) + (rnd() - 0.5) * 6;
      // Convert (along, depth) into screen coordinates for this side.
      let x: number;
      let y: number;
      if (side === 'top') {
        x = a;
        y = H - depth - 6;
      } else if (side === 'bottom') {
        x = a;
        y = depth + tierGap - 4;
      } else if (side === 'left') {
        x = W - depth - tierGap / 2;
        y = a;
      } else {
        x = depth + tierGap / 2;
        y = a;
      }
      const s = 10 + rnd() * 2;
      const tone = tones[Math.floor(rnd() * tones.length)];
      const r = rnd();
      let held = '';
      if (r < 0.13) {
        // Scarf held above the head with both hands.
        held = `<g class="tgt-item"><rect x="${x - s * 1.6}" y="${y - s * 2.75}" width="${s * 3.2}" height="${s * 0.75}" rx="1" class="tgt" stroke="${INK}" stroke-width="1"/>
          <rect x="${x - s * 1.6}" y="${y - s * 2.75}" width="${s * 0.55}" height="${s * 0.75}" fill="${CREAM}" opacity=".85"/>
          <rect x="${x + s * 1.05}" y="${y - s * 2.75}" width="${s * 0.55}" height="${s * 0.75}" fill="${CREAM}" opacity=".85"/></g>`;
      } else if (r < 0.21) {
        // Flag on a stick.
        held = `<g class="tgt-item"><line x1="${x + s * 0.8}" y1="${y - s * 0.4}" x2="${x + s * 0.8}" y2="${y - s * 3.4}" stroke="${INK}" stroke-width="1.4"/>
          <path class="tgt flag" d="M${x + s * 0.8},${y - s * 3.4} h${s * 1.9} l-${s * 0.45},${s * 0.6} l${s * 0.45},${s * 0.6} h-${s * 1.9}Z" stroke="${INK}" stroke-width="1"/></g>`;
      }
      people.push(`<path d="M${x - s},${y} Q${x - s},${y - s * 1.6} ${x},${y - s * 1.6} Q${x + s},${y - s * 1.6} ${x + s},${y}Z" fill="${tone}"/>
        <circle cx="${x}" cy="${y - s * 2.2}" r="${s * 0.62}" fill="${tone}"/>${held}`);
    }
    // Seat stripe for this tier.
    let stripe: string;
    if (side === 'top') stripe = `<rect x="0" y="${H - depth - tierGap}" width="${W}" height="${tierGap}" fill="${t % 2 ? seatA : seatB}"/>`;
    else if (side === 'bottom') stripe = `<rect x="0" y="${depth}" width="${W}" height="${tierGap}" fill="${t % 2 ? seatA : seatB}"/>`;
    else if (side === 'left') stripe = `<rect x="${W - depth - tierGap}" y="0" width="${tierGap}" height="${H}" fill="${t % 2 ? seatA : seatB}"/>`;
    else stripe = `<rect x="${depth}" y="0" width="${tierGap}" height="${H}" fill="${t % 2 ? seatA : seatB}"/>`;
    rows.push(`${stripe}<g class="tier" style="animation-delay:${(t * 0.035).toFixed(3)}s">${people.join('')}</g>`);
  }
  // Paint top-of-screen rows first so lower rows overlap them.
  if (side === 'top') rows.reverse();
  const anchor = { top: 'xMidYMax', bottom: 'xMidYMin', left: 'xMaxYMid', right: 'xMinYMid' }[side];
  return `<svg class="crowd-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${anchor} slice" aria-hidden="true">
    <rect width="${W}" height="${H}" fill="#c9a574"/>
    ${rows.join('')}
  </svg>`;
}

/** Repeating band pattern for an advertising board, one per hat colour. */
function boardPattern(color: HatColor, fg: string): string {
  switch (color) {
    case 'red': // stripes
      return `<pattern id="p" width="9" height="9" patternUnits="userSpaceOnUse"><rect x="0" width="3.6" height="9" fill="${fg}"/></pattern>`;
    case 'blue': // dots
      return `<pattern id="p" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="2.1" fill="${fg}"/></pattern>`;
    case 'yellow': // stars
      return `<pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse"><path d="${starPath(7, 7, 5, 2.1)}" fill="${fg}"/></pattern>`;
    case 'purple': // zigzag
      return `<pattern id="p" width="12" height="8" patternUnits="userSpaceOnUse"><polyline points="0,6 3,2 6,6 9,2 12,6" fill="none" stroke="${fg}" stroke-width="1.8" stroke-linejoin="round"/></pattern>`;
  }
}

/**
 * One advertising panel as a data-URI background: the target colour, its band pattern,
 * and the target itself (hat, or animal in hat) on a cream badge. Boards repeat it.
 */
export function boardPanelUri(item: ItemType, mode: Mode, vertical: boolean): string {
  const w = vertical ? 40 : 76;
  const h = vertical ? 64 : 40;
  const plain = mode === 'plain' || item.color === 'none';
  const fill = plain ? PALETTE.deepRed : PALETTE.hats[item.color as HatColor];
  const fg = !plain && item.color === 'yellow' ? INK : CREAM;
  const pattern = plain ? '' : boardPattern(item.color as HatColor, fg);
  const b = 32; // badge size
  const bx = (w - b) / 2;
  const by = (h - b) / 2;
  const icon =
    mode === 'hat' && !plain
      ? `<g transform="translate(${bx} ${by}) scale(${b / 60})">${hatSvg(item.color, 30, 42, 1.05)}</g>`
      : `<svg x="${bx + 1}" y="${by + 1}" width="${b - 2}" height="${b - 2}" viewBox="4 6 92 94" preserveAspectRatio="xMidYMax slice">${critterInner(item).replace(/<g class="eyes-daze">[\s\S]*?<\/g>/, '')}</svg>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${pattern}</defs>
    <rect width="${w}" height="${h}" fill="${fill}"/>
    ${pattern ? `<rect width="${w}" height="${h}" fill="url(#p)" opacity=".6"/>` : `<path d="${starPath(8, h / 2, 4, 1.6)} ${starPath(w - 8, h / 2, 4, 1.6)}" fill="${PALETTE.gold}"/>`}
    <rect x="${bx}" y="${by}" width="${b}" height="${b}" rx="6" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/>
    ${icon}
    <rect x="${bx}" y="${by}" width="${b}" height="${b}" rx="6" fill="none" stroke="${INK}" stroke-width="1.6"/>
    ${vertical ? `<rect x="0" y="${h - 1}" width="${w}" height="1" fill="${INK}" opacity=".35"/>` : `<rect x="${w - 1}" y="0" width="1" height="${h}" fill="${INK}" opacity=".35"/>`}
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Azulejo strip as a CSS background (data URI), for panel borders. */
export function azulejoDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="${CREAM}"/>
    <g fill="#2a67d1"><circle cx="12" cy="7" r="3.2"/><circle cx="12" cy="17" r="3.2"/><circle cx="7" cy="12" r="3.2"/><circle cx="17" cy="12" r="3.2"/></g>
    <circle cx="12" cy="12" r="2" fill="${PALETTE.gold}"/>
    <path d="${starPath(0, 0, 4, 1.6, 4)} ${starPath(24, 0, 4, 1.6, 4)} ${starPath(0, 24, 4, 1.6, 4)} ${starPath(24, 24, 4, 1.6, 4)}" fill="${PALETTE.terracotta}"/>
    <rect width="24" height="24" fill="none" stroke="#2a67d1" stroke-opacity=".25"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Castanet cursor for fine pointers. */
export function cursorDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">${castanetSvg()
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, pointer`;
}
