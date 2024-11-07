import type { RacerName, SeasonName, TrackName } from "@/types";
import s1 from "./s1.json";
import s2 from "./s2.json";
import s3 from "./s3.json";
import s4 from "./s4.json";
import s5 from "./s5.json";

type RacerResult = {
  results: Partial<Record<RacerName, string>>;
  fastestLap: {
    racerId: RacerName;
    time: string;
  };
  data?: string;
};

export type RacerResults = Record<
  SeasonName,
  Partial<Record<TrackName, RacerResult | null>>
>;

export const results = { s1, s2, s3, s4, s5 } as RacerResults;
