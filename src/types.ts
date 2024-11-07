import driversData from "./data/drivers/drivers.json";
import trackData from "./data/tracks/tracks.json";
import constructorsData from "./data/constructors/constructors.json";

export const seasons = ["s1", "s2", "s3", "s4"] as const;
export type SeasonName = (typeof seasons)[number];

export const tracks = Object.keys(trackData);
export type TrackName = keyof typeof trackData;

export const drivers = Object.keys(driversData);
export type RacerName = keyof typeof driversData;

export const constructors = Object.keys(constructorsData);
export type ConstructorName = keyof typeof constructorsData;

export type Penalties = Record<string, Record<string, number>>;
