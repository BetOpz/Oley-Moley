// Inline SVG art, generated in code. No external images.
import { PALETTE } from '../config';
import type { ItemType, Kit, Mode, Role } from '../config';

const INK = PALETTE.ink;
const WHITE = PALETTE.white;
const GLOVE = '#b8f04a';
const GLOVE_DARK = '#5f8f1c';

export type Side = 'top' | 'right' | 'bottom' | 'left';

let uidCounter = 0;
/** Ids for clip paths must be unique across every inline SVG on the page. */
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}${uidCounter}`;
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

// ---------------------------------------------------------------- kit patterns

/** The second colour of each kit: white for all but yellow, whose sash is dark. */
export function kitSecond(kit: Kit): string {
  return kit === 'yellow' ? PALETTE.sash : WHITE;
}

/**
 * A kit's colour and shirt pattern filling the box (0, 0, w, h). The caller clips it.
 * Patterns keep their screen orientation everywhere, so they can be told apart in greyscale:
 * red = vertical stripes, blue = horizontal hoops, yellow = diagonal sash, purple = halves.
 * `unit` is the stripe/hoop width; `single` draws one sash (a shirt) instead of a repeat.
 */
export function kitFill(kit: Kit, w: number, h: number, unit: number, single = false): string {
  const base = PALETTE.kits[kit];
  const fg = kitSecond(kit);
  let out = `<rect width="${w}" height="${h}" fill="${base}"/>`;
  switch (kit) {
    case 'red':
      for (let x = unit * 0.5; x < w; x += unit * 2) out += `<rect x="${x.toFixed(2)}" y="0" width="${unit}" height="${h}" fill="${fg}"/>`;
      break;
    case 'blue':
      for (let y = unit * 0.5; y < h; y += unit * 2) out += `<rect x="0" y="${y.toFixed(2)}" width="${w}" height="${unit}" fill="${fg}"/>`;
      break;
    case 'yellow': {
      const bw = unit * 1.6;
      if (single) {
        out += `<line x1="${-h * 0.1}" y1="${-h * 0.1}" x2="${w + h * 0.1}" y2="${h * 1.1}" stroke="${fg}" stroke-width="${bw}"/>`;
      } else {
        const p = Math.min(w, h) * 2.5;
        for (let c = -h; c < w + h; c += p)
          out += `<line x1="${c - 4}" y1="-4" x2="${c + h + 4}" y2="${h + 4}" stroke="${fg}" stroke-width="${bw}"/>`;
      }
      break;
    }
    case 'purple':
      if (single || h > w) out += `<rect x="${w / 2}" y="0" width="${w / 2}" height="${h}" fill="${fg}"/>`;
      else {
        const p = h * 2.2;
        for (let x = p / 2; x < w; x += p) out += `<rect x="${x}" y="0" width="${p / 2}" height="${h}" fill="${fg}"/>`;
      }
      break;
  }
  return out;
}

/** kitFill clipped to a rectangle at (x, y) with a nested <svg> (no ids needed). */
function kitBox(kit: Kit, x: number, y: number, w: number, h: number, unit: number, single = false): string {
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden">${kitFill(kit, w, h, unit, single)}</svg>`;
}

// ---------------------------------------------------------------- props

export function footballInner(cx: number, cy: number, r: number): string {
  const pent = (px: number, py: number, pr: number, rot: number) => {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const a = ((rot + i * 72) * Math.PI) / 180;
      d += `${i ? 'L' : 'M'}${(px + pr * Math.cos(a)).toFixed(2)},${(py + pr * Math.sin(a)).toFixed(2)}`;
    }
    return `<path d="${d}Z" fill="${INK}"/>`;
  };
  const s = r / 10.5;
  const id = uid('fb');
  return `<g transform="translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})">
    <circle cx="12" cy="12" r="10.5" fill="${WHITE}" stroke="${INK}" stroke-width="${1.6 / Math.max(s, 0.6)}"/>
    ${pent(12, 12, 4, -90)}
    <path d="M12,8 L12,3.5 M15.8,10.8 L20,9.3 M14.4,15.2 L17,19 M9.6,15.2 L7,19 M8.2,10.8 L4,9.3" stroke="${INK}" stroke-width="1.2"/>
    <clipPath id="${id}"><circle cx="12" cy="12" r="10"/></clipPath>
    <g clip-path="url(#${id})">${pent(12, 0.6, 3.2, 90)}${pent(22.8, 8.6, 3.2, 162)}${pent(18.8, 21.4, 3.2, 234)}${pent(5.2, 21.4, 3.2, 306)}${pent(1.2, 8.6, 3.2, 18)}</g>
  </g>`;
}

/** A big keeper's glove, palm out, centred at (x, y). `flip` mirrors it for the right hand. */
function glove(x: number, y: number, s: number, flip: boolean): string {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(-12)">
    <path d="M-9,12 L-9,-2 Q-13,-6 -12,-10 Q-11,-13 -7,-9 L-7,-15 Q-7,-19 -4,-19 Q-1,-19 -1,-15 L-1,-17 Q-1,-21 2,-21 Q5,-21 5,-17 L5,-15 Q5,-19 8,-19 Q11,-19 11,-15 L11,12 Z"
      fill="${GLOVE}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M-1,-13 L-1,0 M5,-13 L5,0" stroke="${GLOVE_DARK}" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="-10" y="6" width="22" height="9" rx="2.5" fill="${WHITE}" stroke="${INK}" stroke-width="2.2"/>
  </g>`;
}

/** A furry arm from (x1, y1) to (x2, y2) with a paw. */
function arm(x1: number, y1: number, x2: number, y2: number, paw = true): string {
  return `<path d="M${x1},${y1} L${x2},${y2}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x1},${y1} L${x2},${y2}" stroke="${PALETTE.mole}" stroke-width="6" stroke-linecap="round"/>
    ${paw ? `<circle cx="${x2}" cy="${y2}" r="5.2" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>` : ''}`;
}

/** A supporter's scarf held up flat, in the kit's colours, with fringes. */
function scarf(kit: Kit, x: number, y: number, w: number, h: number): string {
  const n = 6;
  const bw = w / n;
  let blocks = '';
  for (let i = 0; i < n; i++) {
    const fill = i % 2 === 0 ? PALETTE.kits[kit] : kitSecond(kit);
    blocks += `<rect x="${(x + i * bw).toFixed(2)}" y="${y}" width="${bw.toFixed(2)}" height="${h}" fill="${fill}"/>`;
  }
  let fringe = '';
  for (let i = 0; i < 4; i++) {
    const fy = y + 2 + (i * (h - 4)) / 3;
    fringe += `<path d="M${x},${fy} l-5,0 M${x + w},${fy} l5,0" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  return `${fringe}${blocks}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="2.4" rx="1.5"/>`;
}

// ---------------------------------------------------------------- moles

// The mole, in a 100 × 100 box. The body runs off the bottom (hidden by the turf lip).
const BODY = { cx: 50, cy: 67, rx: 30, ry: 40 };
const SHIRT_TOP = 69;

function blush(x: number, y: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#ff8a9a" opacity=".5"/>`;
}

const EYES: [number, number][] = [[41, 46], [59, 46]];
const EYE_R = 3.3;

function eyeDots(): string {
  return EYES.map(
    ([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${EYE_R}" ry="${EYE_R * 1.2}" fill="${INK}"/><circle cx="${x - 1.1}" cy="${y - 1.3}" r="1.25" fill="#fff"/>`,
  ).join('');
}

function dazedEyes(): string {
  const s = EYE_R * 1.1;
  return EYES.map(
    ([x, y]) =>
      `<path d="M${x - s},${y - s} L${x + s},${y + s} M${x + s},${y - s} L${x - s},${y + s}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  ).join('');
}

/** The shirt: the lower part of the body, filled with the kit (or the referee's black). */
function shirt(kit: Kit | 'ref'): string {
  const dy = SHIRT_TOP - BODY.cy;
  const hw = BODY.rx * Math.sqrt(1 - (dy / BODY.ry) ** 2);
  const x1 = (BODY.cx - hw).toFixed(2);
  const x2 = (BODY.cx + hw).toFixed(2);
  const d = `M${x1},${SHIRT_TOP} A${BODY.rx},${BODY.ry} 0 0 0 ${x2},${SHIRT_TOP} Z`;
  const id = uid('sh');
  const top = SHIRT_TOP;
  const w = BODY.rx * 2;
  const h = BODY.cy + BODY.ry - top;
  const fill =
    kit === 'ref'
      ? `<rect x="${BODY.cx - BODY.rx}" y="${top}" width="${w}" height="${h}" fill="${PALETTE.ref}"/>`
      : `<g transform="translate(${BODY.cx - BODY.rx} ${top})">${kitFill(kit, w, h, 6.5, true)}</g>`;
  const collar =
    kit === 'ref'
      ? `<path d="M39,${top + 0.5} Q50,${top + 9} 61,${top + 0.5}" fill="none" stroke="#3b3f4a" stroke-width="3"/>`
      : `<path d="M39,${top + 0.5} Q50,${top + 9} 61,${top + 0.5}" fill="none" stroke="${kit === 'yellow' ? PALETTE.sash : WHITE}" stroke-width="3.2"/>
         <path d="M39,${top + 0.5} Q50,${top + 9} 61,${top + 0.5}" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>
    <g clip-path="url(#${id})">${fill}</g>
    <path d="M${x1},${top} L${x2},${top}" stroke="${INK}" stroke-width="2.2"/>
    ${collar}`;
}

function whistle(): string {
  return `<path d="M41,${SHIRT_TOP + 2} Q46,${SHIRT_TOP + 14} 55,${SHIRT_TOP + 13}" fill="none" stroke="${WHITE}" stroke-width="1.8"/>
    <path d="M59,${SHIRT_TOP + 2} Q58,${SHIRT_TOP + 10} 55,${SHIRT_TOP + 13}" fill="none" stroke="${WHITE}" stroke-width="1.8"/>
    <g transform="translate(55 ${SHIRT_TOP + 13})">
      <path d="M-1,-4 L11,-4 L11,1 L7,1 A5.5,5.5 0 1 1 -1,-1 Z" fill="#d8dde6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="2.6" cy="2" r="1.8" fill="${INK}"/>
    </g>`;
}

/** The inner content (0…100 coords) of a mole. `daze` adds the hidden dizzy eyes. */
export function moleInner(item: ItemType, daze = true): string {
  const kitted = item.isRef || item.kit !== 'none';
  let behind = '';
  let front = '';
  if (!item.isRef && item.kit !== 'none') {
    const kit = item.kit;
    switch (item.role) {
      case 'player':
        front += footballInner(50, 15, 12.5);
        break;
      case 'keeper':
        behind += arm(28, 76, 16, 50, false) + arm(72, 76, 84, 50, false);
        front += glove(14, 40, 0.92, false) + glove(86, 40, 0.92, true);
        break;
      case 'fan':
        behind += arm(26, 74, 15, 13) + arm(74, 74, 85, 13);
        front += scarf(kit, 12, 1, 76, 14) + `<circle cx="15" cy="12" r="5.2" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/><circle cx="85" cy="12" r="5.2" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>`;
        break;
      default:
        break;
    }
  }
  const body = `<ellipse cx="${BODY.cx}" cy="${BODY.cy}" rx="${BODY.rx}" ry="${BODY.ry}" fill="${PALETTE.mole}"/>`;
  const belly = kitted ? '' : `<ellipse cx="50" cy="90" rx="19" ry="17" fill="${PALETTE.belly}"/>`;
  const clothes = item.isRef ? shirt('ref') + whistle() : item.kit !== 'none' ? shirt(item.kit) : '';
  const outline = `<ellipse cx="${BODY.cx}" cy="${BODY.cy}" rx="${BODY.rx}" ry="${BODY.ry}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  const restPaws = kitted && item.role !== 'none' ? '' : `<ellipse cx="31" cy="${kitted ? 88 : 85}" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/><ellipse cx="69" cy="${kitted ? 88 : 85}" rx="7" ry="5" fill="#f2a6b3" stroke="${INK}" stroke-width="2"/>`;
  const face = `
    ${blush(35, 56)}${blush(65, 56)}
    <g stroke="${INK}" stroke-width="1.4" stroke-linecap="round">
      <line x1="38" y1="56" x2="24" y2="53"/><line x1="38" y1="59" x2="24" y2="61"/>
      <line x1="62" y1="56" x2="76" y2="53"/><line x1="62" y1="59" x2="76" y2="61"/>
    </g>
    <ellipse cx="50" cy="55" rx="7.5" ry="5.6" fill="#f48fa6" stroke="${INK}" stroke-width="2"/>
    <path d="M45,63 Q50,67 55,63" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <g class="eyes">${eyeDots()}</g>
    ${daze ? `<g class="eyes-daze">${dazedEyes()}</g>` : ''}`;
  return `${behind}${body}${belly}${clothes}${outline}${restPaws}${face}${front}`;
}

export function moleSvg(item: ItemType): string {
  return `<svg class="critter-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${moleInner(item)}</svg>`;
}

// ---------------------------------------------------------------- icons

const SHIRT_PATH = 'M10,5 L16,2 Q20,6 24,2 L30,5 L38,13 L32,18 L31,37 L9,37 L8,18 L2,13 Z';

/** A football shirt icon in a 40 × 40 box at (x, y), scaled to `size`. */
export function shirtIcon(kit: Kit | 'ref', x: number, y: number, size: number): string {
  const id = uid('si');
  const fill =
    kit === 'ref'
      ? `<rect width="40" height="40" fill="${PALETTE.ref}"/>`
      : kitFill(kit, 40, 40, 5.5, true);
  const extra =
    kit === 'ref'
      ? `<path d="M14,8 Q20,18 26,8" fill="none" stroke="${WHITE}" stroke-width="1.6"/><circle cx="22" cy="20" r="3.4" fill="#d8dde6" stroke="${WHITE}" stroke-width="1"/>`
      : '';
  return `<g transform="translate(${x} ${y}) scale(${size / 40})">
    <clipPath id="${id}"><path d="${SHIRT_PATH}"/></clipPath>
    <g clip-path="url(#${id})">${fill}</g>${extra}
    <path d="${SHIRT_PATH}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
  </g>`;
}

/** A role icon (ball, glove or scarf) in a 40 × 40 box at (x, y). */
export function roleIcon(role: Role, kit: Kit, x: number, y: number, size: number): string {
  const s = size / 40;
  let inner = '';
  switch (role) {
    case 'player':
      inner = footballInner(20, 20, 16);
      break;
    case 'keeper':
      inner = glove(20, 22, 1.25, false);
      break;
    case 'fan':
      inner = `<g transform="rotate(-18 20 20)">${scarf(kit, 6, 13, 28, 13)}</g>`;
      break;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
}

// ---------------------------------------------------------------- queue tiles

/**
 * An LED tile for the NOW panel and the next targets: the kit pattern edge to edge, with the
 * shirt (kit stages) or the role (role stages) on a white badge.
 */
export function tileSvg(item: ItemType, mode: Mode): string {
  if (item.kit === 'none') return '';
  const k = item.kit;
  const icon =
    mode === 'role' && item.role !== 'none' ? roleIcon(item.role, k, 13, 13, 34) : shirtIcon(k, 13, 13, 34);
  return `<svg viewBox="0 0 60 60" aria-hidden="true">
    ${kitBox(k, 1, 1, 58, 58, 6)}
    <rect x="10" y="10" width="40" height="40" rx="8" fill="${WHITE}" stroke="${INK}" stroke-width="1.8"/>
    ${icon}
    <rect x="1" y="1" width="58" height="58" rx="7" fill="none" stroke="${INK}" stroke-width="2"/>
  </svg>`;
}

// ---------------------------------------------------------------- scoreboard bits

export function footballSvg(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${footballInner(12, 12, 10.5)}</svg>`;
}

export function cardSvg(card: 'yellow' | 'red'): string {
  const fill = card === 'yellow' ? '#ffd21f' : '#e02a2a';
  return `<svg viewBox="0 0 16 22" aria-hidden="true"><rect x="1" y="1" width="14" height="20" rx="2" fill="${fill}" stroke="${INK}" stroke-width="1.6" transform="rotate(6 8 11)"/></svg>`;
}

export function speakerSvg(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4,9 H8 L13,5 V19 L8,15 H4Z" fill="currentColor"/>
    <path class="waves" d="M16,9 Q18,12 16,15 M18.5,6.5 Q22.5,12 18.5,17.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path class="cross" d="M16,9 L22,15 M22,9 L16,15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

/** The patterns-only toggle: a circle, half filled. */
export function contrastSvg(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12,3.5 A8.5,8.5 0 0 1 12,20.5 Z" fill="currentColor"/>
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

export interface HoardingOpts {
  vertical: boolean;
  /** Plain stages: the white text, e.g. "HIT ANY MOLE". */
  text: string;
  /** Stage 2: "NOT THE REF" with a referee icon. */
  refText?: string;
  /** Show the role badge (role stages). The top hoarding leaves it to its NOW panels. */
  badge?: boolean;
}

/**
 * One repeat of an LED pitch-side hoarding, as a CSS background. Kit stages show the kit's colour
 * and shirt pattern (plus the role in role stages); plain stages show white text.
 */
export function hoardingUri(item: ItemType, mode: Mode, o: HoardingOpts): string {
  const plain = mode === 'plain' || item.kit === 'none';
  const T = 40;
  let L: number;
  let inner: string;
  if (plain) {
    const label = (text: string, x: number, len: number) =>
      `<text x="${x + len / 2}" y="${T / 2}" dy=".36em" text-anchor="middle" textLength="${len}" lengthAdjust="spacingAndGlyphs" font-family="Anton, Impact, 'Arial Narrow', sans-serif" font-weight="700" font-size="20" fill="${WHITE}">${text}</text>`;
    const dot = (x: number) => `<circle cx="${x}" cy="${T / 2}" r="3" fill="${WHITE}" opacity=".6"/>`;
    let row: string;
    if (o.refText) {
      L = 520;
      row = `${dot(10)}${label(o.text, 28, 210)}${dot(256)}<rect x="268" y="3" width="34" height="34" rx="7" fill="${WHITE}" stroke="${INK}" stroke-width="1.6"/>${shirtIcon('ref', 271, 6, 28)}${label(o.refText, 310, 186)}${dot(L - 10)}`;
    } else {
      L = 280;
      row = `${dot(10)}${label(o.text, 28, L - 56)}${dot(L - 10)}`;
    }
    const w = o.vertical ? T : L;
    const h = o.vertical ? L : T;
    inner = `<rect width="${w}" height="${h}" fill="#141a26"/>
      ${o.vertical ? `<g transform="translate(${T} 0) rotate(90)">${row}</g>` : row}`;
    return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}${ledDots(w, h)}</svg>`);
  }
  const k = item.kit as Kit;
  L = 176;
  const w = o.vertical ? T : L;
  const h = o.vertical ? L : T;
  // The pattern keeps its screen orientation on every side (stripes stay vertical, hoops
  // horizontal), so red and blue never swap looks on the side boards.
  const fill = kitFill(k, w, h, T / 5);
  let badge = '';
  if (mode === 'role' && item.role !== 'none' && o.badge !== false) {
    const bs = 32;
    const bx = w / 2 - bs / 2;
    const by = h / 2 - bs / 2;
    badge = `<rect x="${bx}" y="${by}" width="${bs}" height="${bs}" rx="7" fill="${WHITE}" stroke="${INK}" stroke-width="1.8"/>
      ${roleIcon(item.role, k, bx + 3, by + 3, bs - 6)}`;
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${fill}${badge}${ledDots(w, h)}</svg>`);
}

// ---------------------------------------------------------------- crowd card display

/**
 * One repeat of the crowd's card display: supporters holding up cards in the target kit with its
 * pattern. `null` gives a mix of all four kits (plain stages).
 */
export function crowdUri(kit: Kit | null): string {
  const cells = 8;
  const cell = 12;
  const size = cells * cell;
  let seed = kit ? kit.length * 31 + 7 : 3;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const all: Kit[] = ['red', 'blue', 'yellow', 'purple'];
  let out = `<rect width="${size}" height="${size}" fill="${PALETTE.stand}"/>`;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const x = c * cell + 1 + (rnd() - 0.5) * 0.8;
      const y = r * cell + 1.5 + (rnd() - 0.5) * 0.8;
      // A few empty seats keep it looking like people.
      if (rnd() < 0.08) {
        out += `<circle cx="${(x + 5).toFixed(2)}" cy="${(y + 5).toFixed(2)}" r="3.4" fill="#2a2f3f"/>`;
        continue;
      }
      const col = kit ?? all[Math.floor(rnd() * 4)];
      const shade = 0.8 + rnd() * 0.2;
      out += `<g opacity="${shade.toFixed(2)}">${kitBox(col, +x.toFixed(2), +y.toFixed(2), 10, 9, 2, true)}</g>`;
    }
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${out}</svg>`);
}
