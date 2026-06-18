const topTenPoints = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const topTwentyPoints = [
  35, 29, 24, 21, 19, 17, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];

// Season 6 uses an F1-style top-10 scheme (per class), plus +1 for fastest race lap.
const f1Points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export const pointsScheme = {
  s1: topTenPoints,
  s2: topTenPoints,
  s3: topTenPoints,
  s4: topTwentyPoints,
  s5: topTwentyPoints,
  s6: f1Points,
};

// Endurance rounds that award double points (positions and fastest lap doubled).
export const doublePointsTracks: Partial<Record<string, string[]>> = {
  s6: ["mt-panorama", "nordschleife", "spa"],
};
