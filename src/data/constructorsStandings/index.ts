import s4 from "./s4.json";
import s5 from "./s5.json";
import s6 from "./s6.json";
import type { ConstructorName, SeasonName, TrackName } from "@/types";

export type ConstructorResult = {
  points: number;
  normalisedPoints: number;
  netNormalisedPoints?: number;
  driverCount: number;
  delta: number;
  netDelta: number;
};

export type ConstructorResults = {
  [constructor in ConstructorName]: ConstructorResult;
};

export type ConstructorsResults = {
  [track in TrackName]: Partial<ConstructorResults>;
};

type ConstructorsStandings = {
  [season in SeasonName]: Partial<ConstructorsResults>;
};

export const constructorsStandings = {
  s1: {},
  s2: {},
  s3: {},
  s4,
  s5,
  s6,
} as ConstructorsStandings;
