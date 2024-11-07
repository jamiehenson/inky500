import type { ConstructorName } from "./types";

import alpine from "./assets/cars/alpine.png";
import astonmartin from "./assets/cars/astonmartin.png";
import audi from "./assets/cars/audi.png";
import bentley from "./assets/cars/bentley.png";
import bmw from "./assets/cars/bmw.png";
import chevrolet from "./assets/cars/chevrolet.png";
import ferrari from "./assets/cars/ferrari.png";
import ford from "./assets/cars/ford.png";
import ginetta from "./assets/cars/ginetta.png";
import honda from "./assets/cars/honda.png";
import ktm from "./assets/cars/ktm.png";
import lamborghini from "./assets/cars/lamborghini.png";
import lexus from "./assets/cars/lexus.png";
import maserati from "./assets/cars/maserati.png";
import mclaren from "./assets/cars/mclaren.png";
import mercedes from "./assets/cars/mercedes.png";
import nissan from "./assets/cars/nissan.png";
import porsche from "./assets/cars/porsche.png";
import renault from "./assets/cars/renault.png";
import unknown from "./assets/cars/unknown.png";

export const withBase = (path?: string) => {
  return `${import.meta.env.BASE_URL}${path ?? ""}/`;
};

export const carImages: Record<ConstructorName, ImageMetadata> = {
  alpine,
  astonmartin,
  audi,
  bentley,
  bmw,
  chevrolet,
  ferrari,
  ford,
  ginetta,
  honda,
  ktm,
  lamborghini,
  lexus,
  maserati,
  mclaren,
  mercedes,
  nissan,
  porsche,
  renault,
  unknown,
};
