import type { RacerName, SeasonName, TrackName } from "@/types";

export const penalties = {
  s1: {},
  s2: {},
  s3: {},
  s4: {
    monza: {
      bouncingczech: 1,
    },
    silverstone: {
      wobbleboss: -3,
    },
  },
} as Record<SeasonName, Record<TrackName, Record<RacerName, number>>>;
