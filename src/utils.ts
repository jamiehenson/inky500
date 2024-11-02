import type { ConstructorName } from "./types";

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
