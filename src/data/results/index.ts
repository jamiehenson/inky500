import type { RacerName, SeasonName, TrackName } from "@/types";
import s1 from "./s1.json";
import s2 from "./s2.json";
import s3 from "./s3.json";
import s4 from "./s4.json";
import s5 from "./s5.json";

export type RacerResult = {
  results: Partial<Record<RacerName, string>> | null;
  fastestLap: {
    racerId: RacerName;
    time: string;
  } | null;
  data?: string;
  date?: string;
};

export type RaceResults = Record<TrackName, RacerResult | null>;

export type SeasonResults = Record<SeasonName, Partial<RaceResults>>;

export const results = { s1, s2, s3, s4, s5 } as SeasonResults;
