// The stadium round the pitch: four stands with a card-display crowd, LED pitch-side
// hoardings showing the target (and the queue on the top one), the target wipe, the
// centre-circle rule label and the stand cheers.
import type { HatColor, ItemType, Mode } from '../config';
import type { OleLevel } from '../game';
import { STR } from '../strings';
import { crowdUri, hoardingUri, tileSvg } from './art';
import type { Side } from './art';
import { el } from './board';
import { pulseClass, reducedMotion } from './fx';

const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

/** The hoarding wipe starts at the NOW panel (top left) and runs both ways round the pitch. */
const WIPE_DELAY: Record<Side, number> = { top: 0, left: 0, right: 75, bottom: 75 };
const WIPE_MS = 75;
/** The crowd ripples outwards from the pitch just after the hoardings. Done by ~280 ms. */
const CROWD_DELAY_MS = 110;
const CROWD_MS = 170;
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
   * top hoarding. When the target changed and `announce` is set, the hoardings wipe, the crowd
   * ripples and the rule label flashes.
   */
  setTarget(mode: Mode, queue: ItemType[], announce: boolean): void {
    const now: ItemType = queue[0] ?? { animal: 'mole', color: 'none' };
    const plain = mode === 'plain' || now.color === 'none';
    const key = `${mode}:${now.animal}:${now.color}`;
    const changed = key !== this.key;
    this.key = key;
    const motion = announce && !reducedMotion();

    this.queueEl.classList.toggle('hidden', plain);
    if (!plain) {
      for (const t of this.nowTiles) t.innerHTML = tileSvg(now, mode);
      this.nextEl.innerHTML = '';
      queue.slice(1, 4).forEach((item, i, arr) => {
        const t = el('div', 'tile next-tile');
        t.innerHTML = tileSvg(item, mode);
        if (motion) t.classList.add(i === arr.length - 1 ? 'slide-new' : 'slide');
        this.nextEl.append(t);
      });
    }
    if (!changed) return;

    document.documentElement.dataset.tgt = plain ? 'none' : now.color;
    for (const side of SIDES) {
      const vertical = side === 'left' || side === 'right';
      this.swapLayer(
        this.hoardings[side],
        'h-layer',
        // The top hoarding already shows the target on its NOW panels, so no extra badges there.
        hoardingUri(now, mode, vertical, STR.whackAny, side !== 'top'),
        motion ? WIPE_DELAY[side] : -1,
        WIPE_MS,
      );
      this.swapLayer(
        this.crowds[side],
        'crowd-layer',
        crowdUri(plain ? null : (now.color as HatColor)),
        motion ? CROWD_DELAY_MS : -1,
        CROWD_MS,
      );
    }
    if (announce) this.flashRule(mode, now);
  }

  /** Add a new background layer over the old ones; wipe it in if delay ≥ 0. */
  private swapLayer(host: HTMLElement, cls: string, bg: string, delay: number, ms: number): void {
    const layer = el('div', cls);
    layer.style.backgroundImage = bg;
    if (delay >= 0) {
      layer.classList.add('wipe');
      layer.style.animationDelay = `${delay}ms`;
      layer.style.animationDuration = `${ms}ms`;
    }
    const old = Array.from(host.querySelectorAll(`:scope > .${cls}`));
    host.append(layer); // CSS keeps the queue above the layers
    window.setTimeout(() => old.forEach((o) => o.remove()), delay >= 0 ? delay + ms + 30 : 0);
  }

  /** The rule in the centre circle for about 1.5 s. It never takes taps. */
  flashRule(mode: Mode, target: ItemType): void {
    let main: string = STR.ruleAny;
    let hint = '';
    if (mode !== 'plain' && target.color !== 'none') {
      main = mode === 'hat' ? STR.ruleHat(target.color) : STR.ruleAnimal(target.animal, target.color);
      hint = STR.patternHint(target.color);
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
   * Olé meter cheers: the stand by the scoreboard (top) first, then the bottom stand, then all
   * four with scarves waving at stage clear.
   */
  cheer(level: OleLevel): void {
    if (level === 1) pulseClass(this.stands.top, 'cheer', 1100);
    else if (level === 2) pulseClass(this.stands.bottom, 'cheer', 1100);
    else for (const side of SIDES) pulseClass(this.stands[side], 'cheer-all', 2000);
  }
}
