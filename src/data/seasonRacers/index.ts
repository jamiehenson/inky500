import type { ConstructorName, RacerName, SeasonName } from "@/types";
import s1 from "./s1.json";
import s2 from "./s2.json";
import s3 from "./s3.json";
import s4 from "./s4.json";
import s5 from "./s5.json";

export type SeasonRacer = {
  team: string;
  car: ConstructorName;
  teamColor?: string;
  otherTeams?: {
    [index: string]: {
      team: string;
      car: ConstructorName;
    };
  };
};

export type SeasonRacers = Partial<Record<RacerName, SeasonRacer>>;

type SeasonRacersData = Record<SeasonName, SeasonRacers>;

export const seasonRacers = { s1, s2, s3, s4, s5 } as SeasonRacersData;
