import type { TrackName } from "@/types";
import tracksData from "./tracks.json";

type Track = {
  name: string;
  location: string;
  countryCode: string;
};

type Tracks = Record<TrackName, Track>;

export const tracks = tracksData as Tracks;
