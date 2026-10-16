import { describe, expect, it } from 'vitest';
import { buildOrder, playStart, upcomingOf } from '@/components/player/play-order';

describe('buildOrder', () => {
  it('ランダムでなければ並びどおり', () => {
    expect(buildOrder(4, 2, false)).toEqual([0, 1, 2, 3]);
  });

  it('ランダムなら選んだ曲を先頭にして、残りを1曲ずつ混ぜる', () => {
    const order = buildOrder(5, 3, true);
    expect(order[0]).toBe(3);
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('playStart', () => {
  it('並びのどこかの曲から始める', () => {
    expect(playStart(10, () => 0)).toBe(0);
    expect(playStart(10, () => 0.55)).toBe(5);
    expect(playStart(10, () => 0.999)).toBe(9);
  });

  it('空の並びでは先頭', () => {
    expect(playStart(0, () => 0.5)).toBe(0);
  });
});

describe('upcomingOf', () => {
  const queue = ['a', 'b', 'c', 'd'];

  it('いまの曲のあとの曲を、流す順で並べる', () => {
    expect(upcomingOf(queue, [2, 0, 3, 1], 1, false)).toEqual([
      { item: 'd', index: 3 },
      { item: 'b', index: 1 },
    ]);
  });

  it('ループが全体なら、先頭からいまの曲の手前までも続けて並べる', () => {
    expect(upcomingOf(queue, [0, 1, 2, 3], 2, true).map((u) => u.item)).toEqual(['d', 'a', 'b']);
  });
});
