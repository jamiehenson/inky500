import type { ConstructorName } from "./types";

import alpine from "./assets/cars/alpine.png";
import astonmartin from "./assets/cars/astonmartin.png";
import audi from "./assets/cars/audi.png";
import bmw from "./assets/cars/bmw.png";
import chevrolet from "./assets/cars/chevrolet.png";
import ginetta from "./assets/cars/ginetta.png";
import ktm from "./assets/cars/ktm.png";
import maserati from "./assets/cars/maserati.png";
import mclaren from "./assets/cars/mclaren.png";
import mercedes from "./assets/cars/mercedes.png";
import porsche from "./assets/cars/porsche.png";
import renault from "./assets/cars/renault.png";

export const withBase = (path: string) => {
  return `${import.meta.env.BASE_URL}${path}`;
};

export const getCarImages = () => {
  const images = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/cars/*.{jpeg,jpg,png,gif}"
  );
  const imagePath = (car: ConstructorName) => `/src/assets/cars/${car}.png`;

  return { images, imagePath };
};

export const carImages: Record<ConstructorName, ImageMetadata> = {
  alpine,
  astonmartin,
  audi,
  bmw,
  chevrolet,
  ginetta,
  ktm,
  maserati,
  mclaren,
  mercedes,
  porsche,
  renault,
};
