// The game is British football, not Spanish: guard the text file against Spanish creeping in.
import { describe, expect, it } from 'vitest';
import { STR } from '../src/strings';
import source from '../src/strings.ts?raw';

/** Every string value reachable from STR, with functions called on sample arguments. */
function allStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'function') {
      try {
        walk((v as (...a: unknown[]) => unknown)('red', 'red', 'red'));
        walk((v as (...a: unknown[]) => unknown)(1, 5, null));
      } catch {
        /* sample arguments didn't fit; the source check below still covers it */
      }
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(STR);
  return out;
}

describe('strings.ts', () => {
  it('contains no "¡", "¿" or "ñ"', () => {
    expect(source).not.toMatch(/[¡¿ñÑ]/);
    for (const s of allStrings()) expect(s).not.toMatch(/[¡¿ñÑ]/);
  });

  it('uses "Olé" only in the title and the four cheers', () => {
    const allowed = new Set<string>([STR.gameTitle, ...STR.cheers]);
    for (const s of allStrings()) {
      if (/olé/i.test(s)) expect(allowed.has(s), s).toBe(true);
    }
    // In the source, "Olé" may only sit on the title and cheers lines (and this file's header comment).
    const lines = source
      .split('\n')
      .filter((l) => /olé/i.test(l) && !/^\s*(\/\/|\/\*|\*)/.test(l));
    expect(lines).toHaveLength(2);
    expect(lines.some((l) => l.includes('gameTitle'))).toBe(true);
    expect(lines.some((l) => l.includes('cheers'))).toBe(true);
  });

  it('has the four cheers in order', () => {
    expect([...STR.cheers]).toEqual(['Olé!', 'Olé, olé!', 'Olé, olé, olé!', 'Olé, olé, olé, olé!']);
  });

  it('names no real leagues', () => {
    const lower = source.toLowerCase();
    for (const w of ['premier league', 'championship', 'la liga', 'serie a']) expect(lower.includes(w), w).toBe(false);
  });

  it('contains none of the Spanish words an earlier draft used', () => {
    const banned = [
      'ahora', 'fiesta', 'toro', 'vamos', 'gracias', 'adiós', 'adios', 'acabó', 'bravo', 'torero',
      'sombrero', 'plaza', 'topos', 'otra vez', 'luego', 'récord', 'entrada', 'paseíllo', 'invitados',
      'ese no', 'escapó', 'nuevo',
    ];
    const lower = source.toLowerCase();
    for (const w of banned) expect(lower.includes(w), w).toBe(false);
  });
});
