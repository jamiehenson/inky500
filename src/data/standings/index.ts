import type { TrackName, RacerName, SeasonName } from "@/types";
import s1 from "./s1.json";
import s2 from "./s2.json";
import s3 from "./s3.json";
import s4 from "./s4.json";
import s5 from "./s5.json";
import s6 from "./s6.json";

export type StandingResult = {
  points: number;
  delta: number;
  netPoints?: number;
  netDelta?: number;
  deductedRaces?: string[];
};

type Standings = Record<
  SeasonName,
  Partial<Record<TrackName, Partial<Record<RacerName, StandingResult>>>>
>;

export const standings = { s1, s2, s3, s4, s5, s6 } as Standings;
