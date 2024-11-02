import type { RacerName, SeasonName, TrackName } from "@/types";
import s2 from "./s2.json";
import s3 from "./s3.json";
import s4 from "./s4.json";

export type RacerResults = {
  [season in SeasonName]: {
    [index in TrackName]: {
      results: {
        [index in RacerName]: string;
      };
      fastestLap: {
        racerId: RacerName;
        time: string;
      };
      data: string;
    } | null;
  };
};

export const results = { s1: {} as any, s2, s3, s4 } as RacerResults;
