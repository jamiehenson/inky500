import type { ConstructorName } from "@/types";
import constructorsData from "./constructors.json";

type Constructor = {
  name: string;
  countryCode: string;
  img: string;
  teamColor?: string;
};

type Constructors = {
  [key in ConstructorName]: Constructor;
};

export const constructors = constructorsData as Constructors;
