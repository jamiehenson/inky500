import s4 from "./s4.json";
import type { ConstructorName, SeasonName, TrackName } from "@/types";

export type ConstructorResult = {
  points: number;
  normalisedPoints: number;
  driverCount: number;
  delta: number;
};

export type ConstructorResults = {
  [constructor in ConstructorName]: ConstructorResult;
};

export type ConstructorsResults = {
  [track in TrackName]: ConstructorResults;
};

type ConstructorsStandings = {
  [season in SeasonName]: ConstructorsResults;
};

export const constructorsStandings = {
  s1: {},
  s2: {},
  s3: {},
  s4,
} as ConstructorsStandings;
