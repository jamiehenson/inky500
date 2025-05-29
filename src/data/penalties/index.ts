import type { RacerName, SeasonName, TrackName } from "@/types";

export type Penalties = Record<
  SeasonName,
  Partial<Record<TrackName, Partial<Record<RacerName, number>>>>
>;

export const gridPenalties = {
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
  s5: {
    "snetterton": {
      "graeme": 1
    }
  },
} satisfies Penalties;

export const pointsPenalties = {
  s1: {},
  s2: {},
  s3: {},
  s4: {},
  s5: {
    "red-bull-ring": {
      wobbleboss: 5,
    },
    "indianapolis": {
      "atlas": 5
    }
  },
} as Penalties;
