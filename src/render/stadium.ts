// The stadium round the pitch: four stands with a card-display crowd, LED pitch-side
// hoardings showing the target (and the queue on the top one), the scroll and sweep when the
// target changes, the centre-circle rule label and the stand cheers.
import type { ItemType, Kit } from '../config';
import type { OleLevel, Stage } from '../game';
import { STR } from '../strings';
import { crowdUri, hoardingUri, tileSvg } from './art';
import type { Side } from './art';
import { el } from './board';
import { pulseClass, reducedMotion } from './fx';

const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
/** Stands join the cheer clockwise from the top (the scoreboard's stand). */
const CHEER_ORDER: Side[] = ['top', 'right', 'bottom', 'left'];

/**
 * Timeline when the target changes (all done by 400 ms):
 * 0–200 ms the top hoarding scrolls sideways (next target slides into NOW),
 * 200–350 ms the new kit sweeps out round the other three hoardings,
 * 290–390 ms the crowd ripples.
 */
const SCROLL_MS = 200;
const SWEEP: Record<Side, [delay: number, ms: number]> = {
  top: [0, SCROLL_MS],
  left: [200, 80],
  right: [200, 80],
  bottom: [270, 80],
};
const CROWD_DELAY_MS = 290;
const CROWD_MS = 100;
const RULE_MS = 1500;

export class Stadium {
  readonly root: HTMLElement;
  readonly stands: Record<Side, HTMLElement>;
  readonly hoardings: Record<Side, HTMLElement>;
  /** Shakes when a life is lost. */
  readonly frame: HTMLElement;
  /** The board renders the pitch in here, inside the hoardings. */
  readonly pitchHost: HTMLElement;
  private crowds: Record<Side, HTMLElement>;
  private queueEl: HTMLElement;
  private nowTiles: HTMLElement[];
  private nextEl: HTMLElement;
  private rule: HTMLElement;
  private ruleTimer = 0;
  private key = '';

  constructor(parent: HTMLElement) {
    this.root = el('div', 'stadium');
    this.stands = {} as Record<Side, HTMLElement>;
    this.crowds = {} as Record<Side, HTMLElement>;
    this.hoardings = {} as Record<Side, HTMLElement>;
    for (const side of SIDES) {
      const stand = el('div', `stand stand-${side}`);
      stand.setAttribute('aria-hidden', side === 'top' ? 'false' : 'true');
      const crowd = el('div', 'crowd');
      stand.append(crowd);
      this.stands[side] = stand;
      this.crowds[side] = crowd;
      this.root.append(stand);
    }

    this.frame = el('div', 'pitch-frame');
    for (const side of SIDES) {
      const h = el('div', `hoarding hoarding-${side}`);
      h.setAttribute('aria-hidden', 'true');
      this.hoardings[side] = h;
      this.frame.append(h);
    }

    // Top hoarding: NOW panel, the next three, and NOW again at the far end.
    this.queueEl = el('div', 'h-queue');
    const now = () => {
      const p = el('div', 'now-panel');
      const label = el('span', 'now-label');
      label.textContent = STR.nowLabel;
      const tile = el('div', 'tile now-tile');
      p.append(label, tile);
      return { p, tile };
    };
    const left = now();
    const right = now();
    right.p.classList.add('now-right');
    this.nextEl = el('div', 'next-tiles');
    const spacer = el('div', 'h-spacer');
    this.queueEl.append(left.p, this.nextEl, spacer, right.p);
    this.nowTiles = [left.tile, right.tile];
    this.hoardings.top.append(this.queueEl);

    this.pitchHost = el('div', 'pitch-host');
    this.rule = el('div', 'rule-label');
    this.rule.setAttribute('aria-live', 'polite');
    this.frame.append(this.pitchHost);
    this.root.append(this.frame);
    parent.append(this.root);
  }

  /** Put the rule label above the pitch (call after the board has rendered into pitchHost). */
  mountRuleLabel(): void {
    this.pitchHost.append(this.rule);
  }

  /**
   * Show the current target on all four hoardings and in the crowd, and the next three on the
   * top hoarding. With `animate`, the top hoarding scrolls, the kit sweeps round the others and
   * the crowd ripples; with `announce`, the rule label flashes too.
   */
  setTarget(stage: Stage, queue: ItemType[], animate: boolean, announce = animate): void {
    const mode = stage.mode;
    const now: ItemType = queue[0] ?? { kit: 'none', role: 'none', isRef: false };
    const plain = mode === 'plain' || now.kit === 'none';
    const key = plain ? `plain:${stage.referee}` : `${mode}:${now.kit}:${now.role}`;
    const changed = key !== this.key;
    this.key = key;
    const motion = animate && !reducedMotion();

    this.queueEl.classList.toggle('hidden', plain);
    if (!plain) {
      for (const t of this.nowTiles) this.swapTile(t, tileSvg(now, mode), motion && changed);
      this.nextEl.innerHTML = '';
      queue.slice(1, 4).forEach((item, i, arr) => {
        const t = el('div', 'tile next-tile');
        t.innerHTML = tileSvg(item, mode);
        if (motion) t.classList.add(i === arr.length - 1 ? 'slide-new' : 'slide');
        this.nextEl.append(t);
      });
    }
    if (!changed) {
      if (announce) this.flashRule(stage, now);
      return;
    }

    document.documentElement.dataset.tgt = plain ? 'none' : now.kit;
    for (const side of SIDES) {
      const vertical = side === 'left' || side === 'right';
      const [delay, ms] = SWEEP[side];
      this.swapLayer(
        this.hoardings[side],
        'h-layer',
        hoardingUri(now, mode, {
          vertical,
          text: STR.hitAny,
          refText: stage.referee ? STR.notTheRef : undefined,
          // The top hoarding already shows the role on its NOW panels.
          badge: side !== 'top',
        }),
        motion ? delay : -1,
        ms,
        side === 'top' ? 'scroll' : 'wipe',
      );
      this.swapLayer(
        this.crowds[side],
        'crowd-layer',
        crowdUri(plain ? null : (now.kit as Kit)),
        motion ? CROWD_DELAY_MS : -1,
        CROWD_MS,
        'wipe',
      );
    }
    if (announce) this.flashRule(stage, now);
  }

  /** The NOW tile: the old one slides out to the left as the new one slides in. */
  private swapTile(tile: HTMLElement, svg: string, motion: boolean): void {
    if (!motion) {
      tile.innerHTML = `<div class="tile-face">${svg}</div>`;
      return;
    }
    tile.querySelectorAll('.tile-face.out').forEach((n) => n.remove());
    const old = tile.querySelector('.tile-face');
    old?.classList.add('out');
    const face = el('div', 'tile-face in');
    face.innerHTML = svg;
    tile.append(face);
    window.setTimeout(() => {
      old?.remove();
      face.classList.remove('in');
    }, SCROLL_MS + 20);
  }

  /** Add a new background layer over the old ones; animate it in if delay ≥ 0. */
  private swapLayer(host: HTMLElement, cls: string, bg: string, delay: number, ms: number, anim: string): void {
    const layer = el('div', cls);
    layer.style.backgroundImage = bg;
    if (delay >= 0) {
      layer.classList.add(anim);
      layer.style.animationDelay = `${delay}ms`;
      layer.style.animationDuration = `${ms}ms`;
    }
    const old = Array.from(host.querySelectorAll(`:scope > .${cls}`));
    // Old layers that scroll out with the new one.
    if (anim === 'scroll' && delay >= 0) {
      old.forEach((o) => {
        const e = o as HTMLElement;
        e.classList.remove('scroll', 'wipe');
        e.classList.add('scroll-out');
        e.style.animationDuration = `${ms}ms`;
        e.style.animationDelay = `${delay}ms`;
      });
    }
    host.querySelector(':scope > .h-queue') ? host.insertBefore(layer, host.querySelector(':scope > .h-queue')) : host.append(layer);
    window.setTimeout(() => old.forEach((o) => o.remove()), delay >= 0 ? delay + ms + 30 : 0);
  }

  /** The rule in the centre circle for about 1.5 s. It never takes taps. */
  flashRule(stage: Stage, target: ItemType): void {
    let main: string = stage.referee ? STR.ruleAnyRef : STR.ruleAny;
    let hint = '';
    if (stage.mode !== 'plain' && target.kit !== 'none') {
      main =
        stage.mode === 'role' && target.role !== 'none'
          ? STR.ruleRole(target.kit, target.role)
          : STR.ruleKit(target.kit);
      hint = STR.patternHint(target.kit);
    }
    this.rule.innerHTML = '';
    const m = el('span', 'rule-main');
    m.textContent = main;
    this.rule.append(m);
    if (hint) {
      const h = el('span', 'rule-hint');
      h.textContent = hint;
      this.rule.append(h);
    }
    this.rule.classList.remove('show');
    void this.rule.offsetWidth;
    this.rule.classList.add('show');
    window.clearTimeout(this.ruleTimer);
    this.ruleTimer = window.setTimeout(() => this.rule.classList.remove('show'), RULE_MS);
  }

  /**
   * Olé meter cheers: one more stand joins in at each quarter, clockwise from the top stand, so all
   * four are up at stage clear. Stands that have cheered stay on their feet until the next stage.
   */
  cheer(level: OleLevel): void {
    if (level >= 4) {
      for (const side of SIDES) {
        this.stands[side].classList.add('standing');
        pulseClass(this.stands[side], 'cheer-all', 2400);
      }
      return;
    }
    const side = CHEER_ORDER[level - 1];
    this.stands[side].classList.add('standing');
    pulseClass(this.stands[side], 'cheer', 1100);
  }

  /** Everyone sits back down (new stage). */
  sitDown(): void {
    for (const side of SIDES) this.stands[side].classList.remove('standing', 'cheer', 'cheer-all');
  }
}
