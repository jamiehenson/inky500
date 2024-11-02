import type { RacerName } from "@/types";
import driversData from "./drivers.json";

type Drivers = Record<
  RacerName,
  {
    name: string;
    countryCode?: string;
    img?: string;
  }
>;

export const drivers = driversData as Drivers;
