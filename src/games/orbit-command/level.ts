import type { Tower } from "./types";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 620;

const points: Array<[number, number]> = [
  [105, 115], [310, 95], [520, 145], [745, 95], [900, 205],
  [160, 310], [390, 300], [635, 325], [850, 410], [290, 500],
  [535, 505], [740, 535],
];

const links: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 5], [1, 6], [2, 6],
  [2, 7], [3, 7], [3, 8], [4, 8], [5, 6], [6, 7], [7, 8], [5, 9],
  [6, 9], [6, 10], [7, 10], [7, 11], [8, 11], [9, 10], [10, 11],
];

export function createTowers(): Tower[] {
  const neighbors = points.map(() => [] as number[]);
  for (const [a, b] of links) {
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  return points.map(([x, y], id) => ({
    id,
    x,
    y,
    neighbors: neighbors[id],
    owner: null,
    units: 0,
    production: id % 4 === 1 ? 1.25 : 1,
    attackLevel: 1,
    defenseLevel: 1,
    incomeLevel: 1,
  }));
}

export const MAP_LINKS = links;
